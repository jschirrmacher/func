import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

export default {
  backend: {
    dataDir: __dirname || resolve(dirname(fileURLToPath(import.meta.url)), "data"),
    baseUrl: "http://localhost:3000",
    smtp: {
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "somebody@ethereal.email",
        pass: "some-password",
      },
    },

    subscriptionTargets: {
      website: {
        name: "myWebsite",
        from: "noreply@myWebsite",
        admin: "newsletter-admin@my-server.org",
        request: {
          subject: "[my-website] Registration for newsletter",
          html: `<p>Dear {{ name }},</p><p>thank you for subscribing to the myWebsite newsletter.</p>
                 <p>Please use <a href="{{ link }}">this link</a> to confirm your description.</p>`,
          onSuccess: "https://mywebsite/newsletter-requesdted",
          onError: "https://mywebsite/subscription-request-failed",
        },
        confirm: {
          subject: "[my-website] Registration for newsletter",
          html: `<p>Dear newsletter admin,</p><p>a new user with the address {{ email }} registered at {{ name }}.`,
          onSuccess: "https://mywebsite/newsletter-subscribed",
          onError: "https://mywebsite/subscription-failed",
        },
      },
    },
  },
}
