import express from "express"
import request from "supertest"
import { Logger, Redirection } from "useful-typescript-functions"
import { beforeEach, describe, expect, it, vi } from "vitest"

import Subscriptions from "./Subscriptions"

const recipient = "recipient@website"
const name = "website"
const target = {
  name,
  recipient,
  subject: "subscription",
  html: "{{ email }} registered at {{ dest }}",
}

const config = {
  emailFrom: "from@my-server",
  baseUrl: "http://localhost",
  smtp: { host: "", port: 0, auth: { user: "", pass: "" } },
  subscriptionTargets: [target],
}

const logger = Logger()

const errorSender = vi.fn(() => {
  throw new Error("Test error")
})

describe("Subscriptions", () => {
  beforeEach(() => {
    logger.runInTest(expect)
  })

  it("should return a router", async () => {
    const { router } = Subscriptions(config, { send: vi.fn() }, logger)
    const app = express()
    app.use(express.urlencoded({ extended: false }))
    app.use(express.json())
    app.use(router)
    const result = await request(app)
      .post("/subscriptions")
      .send({ email: "user@somewhere", dest: "website" })
      .expect(200)
    expect(result.body).toEqual({ registered: true })
  })

  it("should send an email to the recipient", async () => {
    const send = vi.fn()
    const { createSubscription } = Subscriptions(config, { send }, logger)
    await createSubscription(recipient, name)
    expect(send).toBeCalledWith(recipient, target, { dest: name, email: recipient })
  })

  it("should throw if the subscription target is not found", async () => {
    logger.expect({ level: "error", message: "destination: 'non-existing' not found" })
    const { createSubscription } = Subscriptions(config, { send: vi.fn() }, logger)
    await expect(createSubscription(recipient, "non-existing")).rejects.toEqual(
      new Error("Destination not found"),
    )
  })

  it("should redirect after sending mail", async () => {
    const url = "http://localhost/success"
    const { createSubscription } = Subscriptions(config, { send: vi.fn() }, logger)
    const promise = createSubscription(recipient, name, url)
    expect(promise).rejects.toEqual(new Redirection(url))
  })

  it("should report errors when sending the mail", async () => {
    logger.expect({ level: "error", message: "Test error" })
    const { createSubscription } = Subscriptions(config, { send: errorSender }, logger)
    const promise = createSubscription(recipient, name)
    expect(promise).rejects.toEqual(new Error("Error sending email: Test error"))
  })

  it("should redirect in case of errors", async () => {
    const { createSubscription } = Subscriptions(config, { send: errorSender }, logger)
    const promise = createSubscription(recipient, name, "http://success", "http://failure")
    expect(promise).rejects.toEqual(new Redirection("http://failure"))
  })
})
