export default {
  backend: {
    emailFrom: "newsletter@my-server.org",
    baseUrl: "http://localhost:3000",
    smtp: {
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "somebody@ethereal.email",
        pass: "some-password",
      },
    },

    subscriptionTargets: [
      {
        name: "myWebsite",
        recipient: "newsletter-admin@my-server.org",
        subject: "[my-website] Registration for newsletter",
        html: `<p>Dear newsletter admin,</p><p>a new user with the address {{ email }} registered at {{ dest }}.`,
      },
    ],
  },
}
