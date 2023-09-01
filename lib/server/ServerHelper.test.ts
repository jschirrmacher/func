// this comment is here for test purposes
import express, { Request, Response, Router } from "express"
import request from "supertest"
import { RestMethod } from "./RouterHelper.js"
import { getErrorHandler, getLoggerMiddleware, getNotFoundMiddleware, getStaticFilesMiddleware } from "./ServerHelper.js"
import RestError from "./RestError.js"

const { afterEach, describe, expect, it, vi } = import.meta.vitest

async function simulateFetch(
  router: Router,
  method: RestMethod = "get",
  path: string,
  role?: string,
  data?: object,
) {
  const app = express()
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())
  app.use((req, res, next) => {
    if (req.header("X-Test-User-Type")) {
      res.locals.user = { roles: req.header("X-Test-User-Type")?.split(",") }
      res.locals.token = "test-token"
    }
    next()
  })
  app.use(router)

  const call = request(app)[method](path)
  const prepared = role ? call.set("X-Test-User-Type", role) : call
  return await (data ? prepared.send(data) : prepared)
}

describe("ServerHelper", () => {
  describe("LoggerMiddleware", () => {
    afterEach(() => {
      delete process.env.LOGLEVEL
    })

    it("should log requests in debug mode", async () => {
      const logger = { info: vi.fn() }
      process.env.LOGLEVEL = "debug"
      await simulateFetch(getLoggerMiddleware(logger), "post", "/path")
      expect(logger.info).toBeCalledWith("POST /path")
    })

    it("should not log anything when not in debug mode", async () => {
      const logger = { info: vi.fn() }
      await simulateFetch(getLoggerMiddleware(logger), "post", "/path")
      expect(logger.info).not.toBeCalled()
    })
  })

  describe("StaticFilesMiddleware", () => {
    const middleware = getStaticFilesMiddleware(__dirname)

    it("should serve files in dist folder", async () => {
      const response = await simulateFetch(middleware, "get", __filename.replace(__dirname, ""))
      expect(response.status).toBe(200)
      expect(response.body.toString().split("\n")).toContain(
        `// this comment is here for test purposes`,
      )
    })

    it("should serve the index.html file if file is not found, but request method is GET", async () => {
      const response = await simulateFetch(middleware, "get", "/non-existing-file")
      expect(response.status).toBe(200)
      expect(response.text).toEqual(`this file exists only for test purposes.\n`)
    })
  })

  describe("NotFoundMiddleware", () => {
    it("should forward a RestError 404", async () => {
      const middleware = getNotFoundMiddleware()
      const response = await simulateFetch(middleware, "get", "/non-existing-file")
      expect(response.status).toBe(404)
    })
  })

  describe("ErrorHandler", () => {
    it("should log an error", async () => {
      const logger = { error: vi.fn() }
      const handler = getErrorHandler(logger)
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
      handler(
        new RestError(403, "not allowed"),
        {} as Request,
        res as unknown as Response,
        () => ({}),
      )
      expect(logger.error).toBeCalledWith(new RestError(403, "not allowed"))
    })

    it("should send the error message in JSON format", () => {
      const handler = getErrorHandler({ error: vi.fn() })
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
      handler(
        new RestError(403, "not allowed"),
        {} as Request,
        res as unknown as Response,
        () => ({}),
      )
      expect(res.status).toBeCalledWith(403)
      expect(res.json).toBeCalledWith({ error: "not allowed" })
    })
  })
})
