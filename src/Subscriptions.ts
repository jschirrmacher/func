import {
  Logger,
  Redirection,
  RestError,
  routerBuilder,
  type MailTemplate,
  type Mailer,
  type SMTPConfiguration,
} from "useful-typescript-functions"

type SubscriptionTarget = { name: string; recipient: string } & MailTemplate

type Config = {
  emailFrom: string
  baseUrl: string
  smtp: SMTPConfiguration
  subscriptionTargets: SubscriptionTarget[]
}

type Logger = Pick<typeof console, "error">

export default (config: Config, mailer: Mailer, logger: Logger = Logger()) => {
  const subscriptionTargets = config.subscriptionTargets

  async function createSubscription(
    email: string,
    dest: string,
    onSuccess?: string,
    onError?: string,
  ) {
    const template = subscriptionTargets.find(target => target.name === dest)
    if (template === undefined) {
      logger.error(`destination: '${dest}' not found`)
      throw new RestError(404, `Destination not found`)
    }
    try {
      await mailer.send(template.recipient, template, { email, dest })
      if (!onSuccess) {
        return { registered: true }
      }
    } catch (error) {
      if (onError) {
        throw new Redirection(onError)
      } else {
        throw new RestError(500, `Error sending email: ${(error as Error).message}`)
      }
    }
    throw new Redirection(onSuccess)
  }

  const router = routerBuilder("/subscriptions", "subscriptions")
    .post("/", req => {
      const { email, dest, onSuccess, onError } = req.body
      return createSubscription(email, dest, onSuccess, onError)
    })
    .build()

  return { router, createSubscription }
}
