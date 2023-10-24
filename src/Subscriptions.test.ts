import express from "express"
import request from "supertest"
import { Logger, Redirection } from "useful-typescript-functions"
import { beforeEach, describe, expect, it, vi } from "vitest"

import Subscriptions from "./Subscriptions"
import { BackendConfig } from "./types"

const recipient = "recipient@website"
const name = "website"
const target = {
  name,
  from: "noreply@my-server",
  admin: "admin@my-server",
  request: {
    subject: "subscription",
    html: "{{ email }} registered at {{ dest }}",
  },
  confirm: {
    subject: "subscription",
    html: "{{ email }} registered at {{ dest }}",
  },
}

const config: BackendConfig = {
  baseUrl: "http://localhost",
  dataDir: ".",
  smtp: { host: "", port: 0, auth: { user: "", pass: "" } },
  subscriptionTargets: {
    website: target,
  },
}

const logger = Logger()

const errorSender = vi.fn(() => {
  throw new Error("Test error")
})

describe("Subscriptions", () => {
  beforeEach(() => {
    logger.runInTest(expect)
    vi.mock("fs")
    vi.mock("fs/promises")
  })

  it("should return a router", async () => {
    const { router } = Subscriptions(config, { send: vi.fn() }, logger)
    const app = express()
    app.use(express.urlencoded({ extended: false }))
    app.use(express.json())
    app.use(router)
    const result = await request(app)
      .post("/subscriptions/website")
      .send({ email: "user@somewhere" })
      .expect(200)
    expect(result.body).toEqual({ success: true })
  })

  it("should send an email to the recipient", async () => {
    const send = vi.fn()
    const { createSubscription } = Subscriptions(config, { send }, logger)
    await createSubscription(name, recipient)
    expect(send).toBeCalledWith(
      recipient,
      target.request,
      expect.objectContaining({ email: recipient }),
    )
  })

  it("should throw if the subscription target is not found", async () => {
    logger.expect({ level: "error", message: "destination: 'non-existing' not found" })
    const { createSubscription } = Subscriptions(config, { send: vi.fn() }, logger)
    await expect(createSubscription("non-existing", recipient)).rejects.toEqual(
      new Error("Configuration for target not found"),
    )
  })

  it("should redirect after sending mail", async () => {
    const url = "http://localhost/success"
    const modifiedConfig = JSON.parse(JSON.stringify(config)) as BackendConfig
    modifiedConfig.subscriptionTargets.website.request.onSuccess = url
    const { createSubscription } = Subscriptions(modifiedConfig, { send: vi.fn() }, logger)
    const promise = createSubscription("website", recipient)
    expect(promise).rejects.toEqual(new Redirection(url))
  })

  it("should report errors when sending the mail", async () => {
    logger.expect({ level: "error", message: "Test error" })
    const { createSubscription } = Subscriptions(config, { send: errorSender }, logger)
    const promise = createSubscription("website", recipient)
    expect(promise).rejects.toEqual(new Error("Error sending email: Test error"))
  })

  it("should redirect in case of errors", async () => {
    const modifiedConfig = JSON.parse(JSON.stringify(config)) as BackendConfig
    modifiedConfig.subscriptionTargets.website.request.onError = "http://failure"
    const { createSubscription } = Subscriptions(modifiedConfig, { send: errorSender }, logger)
    const promise = createSubscription("website", recipient)
    expect(promise).rejects.toEqual(new Redirection("http://failure"))
  })
})
