import http from "http"
import express, { Application, NextFunction, Request, Response, Router } from "express"
import { existsSync, readFileSync } from "fs"
import RestError from "./RestError.js"
// import fileUpload from "express-fileupload"
// import { useWebsocket } from "./WebsocketServer.js"

interface Logger {
  info: (msg: string) => void
  error: (msg: string | Error) => void
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

export function setupServer(
  publicPath: string,
  setupRouters: (app: Application) => void,
  options?: { port?: number; logger?: Logger; fileUploadSize?: number }
) {
  const config = {
    port: 8080,
    logger: console,
    fileUploadSize: 20 * 1024 * 1024,
    ...options,
  }

  const app = express()
  const server = http.createServer(app)
  // useWebsocket(server, app)

  // const fileUploadMiddleware = fileUpload({
  //   safeFileNames: true,
  //   preserveExtension: true,
  //   limits: { fileSize: config.fileUploadSize },
  // })

  // app.set("json spaces", 2)
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())
  // app.use(fileUploadMiddleware)
  app.use(getLoggerMiddleware(config.logger))

  setupRouters(app)

  app.use(getStaticFilesMiddleware(publicPath))
  app.use(getNotFoundMiddleware())
  app.use(getErrorHandler(config.logger))

  server.listen(config.port, () => {
    config.logger.info(`Running on http://localhost:${config.port}`)
  })
  process.on("beforeExit", server.close)
}
