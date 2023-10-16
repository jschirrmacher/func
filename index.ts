import { LogLevel, middlewares, routerBuilder, setupServer } from "useful-typescript-functions"

const requestLogger = middlewares.requestLogger(
  console,
  (process.env.LOGLEVEL as LogLevel) || "warn",
)

const subscriptionRouter = routerBuilder("/subscriptions", "subscriptions")
  .post("/", req => createSubscription(req.body.email, req.body.dest))
  .build()

await setupServer({
  port: +(process.env.PORT || "3000"),
  middlewares: [requestLogger, subscriptionRouter],
})

async function createSubscription(email: string, dest: string) {
  return { func: "createSubscription", email, dest }
}
