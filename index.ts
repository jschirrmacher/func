import Mustache from "mustache"
import { LogLevel, middlewares, setupServer } from "useful-typescript-functions"

import config from "./config.mjs"
import SubscriptionRouterFactory from "./src/Subscriptions.js"

const requestLogger = middlewares.requestLogger(
  console,
  (process.env.LOGLEVEL as LogLevel) || "warn",
)

const subscriptionRouter = SubscriptionRouterFactory(config.backend, Mustache.render)

await setupServer({
  port: +(process.env.PORT || "3000"),
  middlewares: [requestLogger, subscriptionRouter],
})
