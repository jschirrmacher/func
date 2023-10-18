import { Logger, RestError, routerBuilder } from "useful-typescript-functions"

import { MailTemplate, Mailer, SMTPConfiguration } from "./lib/Mailer.js"

type SubscriptionTarget = { name: string, recipient: string } & MailTemplate

type Config = {
  emailFrom: string
  baseUrl: string
  smtp: SMTPConfiguration
  subscriptionTargets: SubscriptionTarget[]
}

const logger = Logger()

export default (config: Config, mailer: Mailer) => {
  const subscriptionTargets = config.subscriptionTargets

  async function createSubscription(email: string, dest: string) {
    const template = subscriptionTargets.find(target => target.name === dest)
    if (template === undefined) {
      logger.error(`destination: '${dest}' not found`)
      throw new RestError(404, `Destination not found`)
    }
    await mailer.send(template.recipient, template, { email, dest })
    return { registered: true }
  }

  const router = routerBuilder("/subscriptions", "subscriptions")
    .post("/", req => createSubscription(req.body.email, req.body.dest))
    .build()

  return { router, createSubscription }
}
