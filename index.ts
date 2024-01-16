import Mustache from "mustache"
import { setupServer, Mailer, Logger, Files } from "useful-typescript-functions"
import nodeMailer from "nodemailer"
import SubscriptionFactory from "./src/Subscriptions.js"
import { BackendConfig } from "./src/types.js"

const logger = Logger()
const config = (await Files().readConfig("config.yaml")) as { backend: BackendConfig }
const mailer = Mailer(nodeMailer, Mustache.render, console, config.backend)

await setupServer({
  port: +(process.env.PORT || "3000"),
  logRequests: true,
  logger,
  routers: [SubscriptionFactory(config.backend, mailer, logger).router],
})
