import { randomUUID } from "crypto"
import { existsSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import {
  Files,
  Logger,
  Redirection,
  RestError,
  type Mailer,
  defineRouter,
} from "useful-typescript-functions"
import { BackendConfig, MailConfig } from "./types.js"

type Logger = Pick<typeof console, "error">
type Subscription = {
  targetId: string
  email: string
  subscribedAt: Date
  confirmedAt: Date
}

export default (
  config: BackendConfig,
  mailer: Mailer,
  logger: Logger = Logger(),
  { readJSON, mkdirp } = Files(),
) => {
  const subscriptionTargets = config.subscriptionTargets
  const subscriptionDataDir = join(config.dataDir, "subscriptions")

  async function subscription(targetId: string, code: string, email?: string) {
    await mkdirp(join(subscriptionDataDir, targetId))
    const fileName = join(subscriptionDataDir, targetId, code + ".json")
    const newFile = !existsSync(fileName)
    const data = (
      newFile ? { targetId, email, subscribedAt: new Date() } : await readJSON(fileName)
    ) as Subscription

    if (newFile) {
      await writeFile(fileName, JSON.stringify(data))
    }

    return {
      ...data,
      async confirm() {
        if (this.confirmedAt) {
          throw new Error(`Already confirmed subscription`)
        }
        this.confirmedAt = new Date()
        await writeFile(fileName, JSON.stringify(this))
        return this
      },
    }
  }

  function redirectCond(dest?: string) {
    if (dest) {
      throw new Redirection(dest)
    }
  }

  function getTarget(targetId: string) {
    const target = subscriptionTargets[targetId]
    if (target === undefined) {
      logger.error(`configuration for target '${targetId}' not found`)
      throw new RestError(404, `Configuration for target not found`)
    }
    return target
  }

  async function sendMail(recipient: string, config: MailConfig, vars: Record<string, string>) {
    try {
      await mailer.send(recipient, config, vars)
    } catch (error) {
      logger.error(error)
      redirectCond(config.onError)
      throw new RestError(500, `Error sending email: ${(error as Error).message}`)
    }
    redirectCond(config.onSuccess)
    return { success: true }
  }

  async function createSubscription(targetId: string, email: string) {
    const target = getTarget(targetId)
    const code = randomUUID()
    const link = `${config.baseUrl}/subscriptions/${targetId}/confirmations/${code}`
    await subscription(targetId, code, email)
    return await sendMail(email, target.request, {
      name: target.name,
      from: target.from,
      email,
      link,
    })
  }

  async function confirmSubscription(targetId: string, code: string) {
    const target = getTarget(targetId)
    const data = await subscription(targetId, code)
    await data.confirm()
    return await sendMail(target.admin, target.confirm, {
      name: target.name,
      from: target.from,
      email: data.email,
    })
  }

  const router = defineRouter("/subscriptions", "subscriptions")
    .post("/:targetId", req => createSubscription(req.params.targetId, req.body.email))
    .get("/:targetId/confirmations/:code", req =>
      confirmSubscription(req.params.targetId, req.params.code),
    )

  return { router, createSubscription, confirmSubscription }
}
