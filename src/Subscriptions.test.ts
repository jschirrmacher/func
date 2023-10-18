import express from "express"
import request from "supertest"
import { describe, expect, it, vi } from "vitest"

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

describe("Subscriptions", () => {
  it("should return a router", async () => {
    const { router } = Subscriptions(config, { send: vi.fn() })
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
    const { createSubscription } = Subscriptions(config, { send })
    await createSubscription(recipient, name)
    expect(send).toBeCalledWith(recipient, target, { dest: name, email: recipient })
  })

  it("should throw if the subscription target is not found", async () => {
    const { createSubscription } = Subscriptions(config, { send: vi.fn() })
    await expect(createSubscription(recipient, "non-existing")).rejects.toEqual(
      new Error("Destination not found"),
    )
  })
})
