import Mustache from "mustache"
import { LogLevel, middlewares, setupServer } from "useful-typescript-functions"
import nodeMailer from "nodemailer"
import SubscriptionFactory from "./src/Subscriptions.js"
import { MailerFactory } from "./src/lib/Mailer.js"
import { existsSync } from "fs"

const logLevel = (process.env.LOGLEVEL || "warn") as LogLevel
const configFile = existsSync("./config.local.mjs") ? "./config.local.mjs" : "./config.mjs"
const config = (await import(configFile)).default
const mailer = MailerFactory(nodeMailer, Mustache.render, console, config.backend)

await setupServer({
  port: +(process.env.PORT || "3000"),
  middlewares: [
    middlewares.requestLogger(console, logLevel),
    SubscriptionFactory(config.backend, mailer).router,
  ],
})
