import http from "http"
import express, {
  Application,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express"
import { existsSync, readFileSync } from "fs"
import RestError from "./RestError.js"
// import { useWebsocket } from "./WebsocketServer.js"

interface Logger {
  info: (msg: string) => void
  error: (msg: string | Error) => void
}

type SetupRouterFunc = (app: Application) => void

interface ServerConfiguration {
  port?: number
  logger?: Logger
  middlewares?: RequestHandler[]
  publicPath?: string
}

export function getLoggerMiddleware(logger: Pick<Logger, "info">) {
  const loggingMiddleware = Router()

  if (process.env.LOGLEVEL === "debug") {
    loggingMiddleware.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`)
      next()
    })
  }
  return loggingMiddleware
}

export function getStaticFilesMiddleware(distPath: string) {
  const staticFilesMiddleware = Router()

  if (existsSync(distPath)) {
    const indexPage = readFileSync(distPath + "/index.html").toString()
    staticFilesMiddleware.use(express.static(distPath))
    staticFilesMiddleware.use((req, res) => res.send(indexPage))
  }
  return staticFilesMiddleware
}

export function getNotFoundMiddleware() {
  const notFoundMiddleware = Router()
  notFoundMiddleware.use((req: Request, res: Response, next: NextFunction) => {
    next(new RestError(404, "path not found"))
  })
  return notFoundMiddleware
}

export function getErrorHandler(logger: Pick<Logger, "error">) {
  return (error: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(error)
    res.status(error instanceof RestError ? error.status : 500).json({ error: error.message })
  }
}

export function setupServer(setupRouters: SetupRouterFunc, options?: ServerConfiguration) {
  const config = {
    port: 8080,
    logger: console,
    ...options,
  }

  const app = express()
  const server = http.createServer(app)
  // useWebsocket(server, app)

  // app.set("json spaces", 2)
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())
  if (config.middlewares) {
    config.middlewares.forEach(middleware => app.use(middleware))
  }
  app.use(getLoggerMiddleware(config.logger))

  setupRouters(app)

  if (config.publicPath) {
    app.use(getStaticFilesMiddleware(config.publicPath))
  }
  app.use(getNotFoundMiddleware())
  app.use(getErrorHandler(config.logger))

  server.listen(config.port, () => {
    config.logger.info(`Running on http://localhost:${config.port}`)
  })
  process.on("beforeExit", server.close)
}
