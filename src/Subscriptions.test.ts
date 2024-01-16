import express from "express"
import request from "supertest"
import { Logger, Mailer, Redirection, setupServer } from "useful-typescript-functions"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Subscriptions from "./Subscriptions"
import { BackendConfig } from "./types"
import { Server } from "http"

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
const errorMailer = { send: errorSender }

function setupErrorTest(config: BackendConfig, mailer: Mailer) {
  const { createSubscription, confirmSubscription } = Subscriptions(config, mailer, logger)
  return {
    subscription: createSubscription("website", recipient),
    confirmation: confirmSubscription("website", "abc-def"),
  }
}

describe("Subscriptions", () => {
  let appServer: Server | undefined

  beforeEach(() => {
    logger.runInTest(expect)
    vi.mock("fs")
    vi.mock("fs/promises")
  })

  afterEach(() => {
    appServer?.close()
    appServer = undefined
  })

  it("should return a router", async () => {
    const { router } = Subscriptions(config, { send: vi.fn() }, logger)
    const { app, server } = await setupServer({ logger, routers: [router] })
    appServer = server
    app.use(express.urlencoded({ extended: false }))
    app.use(express.json())

    const result = await request(app)
      .post("/subscriptions/website")
      .send({ email: "user@somewhere" })
      .expect(200)
    expect(result.body).toEqual({ success: true })

    const otherResult = await request(app)
      .get("/subscriptions/website/confirmations/abc-def")
      .expect(200)
    expect(otherResult.body).toEqual({ success: true })
  })

  it("should send an email to the recipient", async () => {
    const send = vi.fn()
    const { createSubscription } = Subscriptions(config, { send }, logger)
    await createSubscription(name, recipient)
    expect(send).toBeCalledWith(
      recipient,
      target.request,
      expect.objectContaining({ from: target.from, email: recipient }),
    )
  })

  it("should send an email with a confirmation link", async () => {
    const send = vi.fn()
    const { createSubscription } = Subscriptions(config, { send }, logger)
    await createSubscription(name, recipient)
    expect(send).toBeCalledWith(
      recipient,
      target.request,
      expect.objectContaining({
        link: expect.stringMatching("/subscriptions/website/confirmations/"),
      }),
    )
  })

  it("should send an email to the admin after confirmation", async () => {
    const send = vi.fn()
    const { confirmSubscription } = Subscriptions(config, { send }, logger)
    await confirmSubscription("website", "abc-def")
    expect(send).toBeCalledWith(
      target.admin,
      target.confirm,
      expect.objectContaining({ from: target.from }),
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
    const modifiedConfig = JSON.parse(JSON.stringify(config)) as BackendConfig
    modifiedConfig.subscriptionTargets.website.request.onSuccess = "http://success"
    modifiedConfig.subscriptionTargets.website.confirm.onSuccess = "http://success2"
    const { subscription, confirmation } = setupErrorTest(modifiedConfig, { send: vi.fn() })
    expect(subscription).rejects.toEqual(new Redirection("http://success"))
    expect(confirmation).rejects.toEqual(new Redirection("http://success2"))
  })

  it("should report errors when sending the mail", async () => {
    logger.expect({ level: "error", message: "Test error" })
    const { subscription, confirmation } = setupErrorTest(config, errorMailer)
    expect(subscription).rejects.toEqual(new Error("Error sending email: Test error"))
    expect(confirmation).rejects.toEqual(new Error("Error sending email: Test error"))
  })

  it("should redirect in case of errors", async () => {
    const modifiedConfig = JSON.parse(JSON.stringify(config)) as BackendConfig
    modifiedConfig.subscriptionTargets.website.request.onError = "http://failure"
    modifiedConfig.subscriptionTargets.website.confirm.onError = "http://failure2"
    const { subscription, confirmation } = setupErrorTest(modifiedConfig, errorMailer)
    expect(subscription).rejects.toEqual(new Redirection("http://failure"))
    expect(confirmation).rejects.toEqual(new Redirection("http://failure2"))
  })
})
