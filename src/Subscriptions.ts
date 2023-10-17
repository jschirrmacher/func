import type { render as RenderFunction } from "mustache"
import nodeMailer from "nodemailer"
import { Logger, RestError, routerBuilder } from "useful-typescript-functions"

import { MailTemplate, MailerFactory, SMTPConfiguration } from "./lib/Mailer.js"

type SubscriptionTarget = { name: string, recipient: string } & MailTemplate

type Config = {
  emailFrom: string
  baseUrl: string
  smtp: SMTPConfiguration
  subscriptionTargets: SubscriptionTarget[]
}

const logger = Logger()

export default (config: Config, render: typeof RenderFunction) => {
  const mailer = MailerFactory(nodeMailer, render, logger, config)
  const subscriptionTargets = config.subscriptionTargets

  return routerBuilder("/subscriptions", "subscriptions")
    .post("/", req => createSubscription(req.body.email, req.body.dest))
    .build()

  async function createSubscription(email: string, dest: string) {
    const template = subscriptionTargets.find(target => target.name === dest)
    if (template === undefined) {
      logger.error(`destination: '${dest}' not found`)
      throw new RestError(404, `Destination not found`)
    }
    await mailer.send(template.recipient, template, { email, dest })
    return { registered: true }
  }
}
