export default {
  backend: {
    emailFrom: "joachim@localhost",
    baseUrl: "http://localhost:5173",
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
        recipient: "my-own-address@my-server.org",
        subject: "[my-website] Registration for newsletter",
        html: `<p>Dear newsletter admin,</p><p>a new user with the address {{ email }} registered.`,
      },
    ],
  },
}
