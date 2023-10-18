import Mustache from "mustache"
import { LogLevel, middlewares, setupServer } from "useful-typescript-functions"
import nodeMailer from "nodemailer"
import config from "./config.mjs"
import SubscriptionFactory from "./src/Subscriptions.js"
import { MailerFactory } from "./src/lib/Mailer.js"

const requestLogger = middlewares.requestLogger(
  console,
  (process.env.LOGLEVEL as LogLevel) || "warn",
)

const mailer = MailerFactory(nodeMailer, Mustache.render, console, config.backend)
const subscription = SubscriptionFactory(config.backend, mailer)

await setupServer({
  port: +(process.env.PORT || "3000"),
  middlewares: [requestLogger, subscription.router],
})
