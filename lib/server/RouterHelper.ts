import { Request, RequestHandler, Response, Router } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import QueryString from "qs"
import RestError from "./RestError.js"

export interface MyResponse extends Response {
  locals: { user?: User; token?: string }
}

interface User {
  id: string
}

enum LogLevel {
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
}

type Logger = Record<LogLevel, (msg: unknown) => void>

type Locals = { user?: User; token?: string }
export type RestMethod = "get" | "post" | "put" | "patch" | "delete"
type RouteHandler = (req: Request, res: Response) => unknown
type RouteDefs = {
  [method in RestMethod]?: RequestHandler<
    ParamsDictionary,
    any,
    any,
    QueryString.ParsedQs,
    Locals
  >[]
}

export default function RouterHelper(logger: Logger = console) {
  function jsonResponse(func: RouteHandler) {
    return async function (req: Request, res: Response) {
      try {
        const result = await func(req, res)
        res.json(result)
      } catch (error) {
        logger.error(error)
        res.status((error as RestError).status || 500).json({ error: (error as RestError).message })
      }
    }
  }

  return {
    createRouter(paths: Record<string, RouteDefs>) {
      const router = Router()
      Object.entries(paths).forEach(([path, defs]) => {
        Object.keys(defs).forEach(key => {
          const method = key as RestMethod
          const handlers = defs[method]
          const last = handlers?.pop() as RouteHandler

          router[method](path, ...handlers!, jsonResponse(last))
        })
      })
      return router
    },
  }
}
