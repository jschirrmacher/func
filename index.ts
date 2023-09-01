import { setupServer } from "./lib/server/ServerHelper"
import RouterHelper from "./lib/server/RouterHelper.js"

const { createRouter } = RouterHelper()
const port = +(process.env.PORT || "3000")

setupServer(setupRouters, { port })

function setupRouters() {
  return createRouter({
    "/subscriptions": {
      post: [
        async (req) => {
          return await createSubscription(req.body.email, req.body.dest)
        },
      ],
    },
  })
}

async function createSubscription(email: string, dest: string) {
  console.log({ func: "createSubscription", email, dest })
}
