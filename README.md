# Functional service

This service provides functions to be used via HTTP REST calls.

It can be used by static websites sharing a common backend.

Currently, there is only just one such function, the sending of emails to a registered recipient, e.g. to subscribe to a newsletter with an email address. There is no double opt in yet, this needs to be solved manually.

## Usage

First, edit the `config.mjs` file to match your needs.

The easiest way to run this service is to use the docker image:

```shell
docker run -p 3000:3000 -v $(pwd)/config.mjs:/app/config.mjs joschi64/func
```

You should use a reverse proxy to make port 3000 available on a server on the internet, ideally with the use of https protocol. Examples for such reverse proxies are nginx or kong api gateway, which uses nginx under the hood, but provides a lot of tools to configure access to the proxied services.

If your reverse proxy listens on "my-backend.org", the service can be used from a frontend by sending the email address from the user and the name of the website, which was defined as `name` of one of the `subscriptionTargets` in `config.mjs`.

```html
<form action="http://my-backend.org" method="POST">
  <label>
    Your email address:
    <input type="email" name="email">
  </label>
  <input type="hidden" name="dest" value="my-website.org">
  <input type="hidden" name="onSuccess" value="https://my-website.org/registered-successfully.html">
  <input type="hidden" name="onError" value="https://my-website.org/error-on-register.html">
  <input type="submit" value="Register">
</form>
```

`onSuccess` and `onError` fields can be used to control what URLs to call if the subscription function registration succeeds or fails. You need to provide these html files as well.

Alternatively, you can use JSON format to send data programmatically by JavaScript:

```javascript
async function registerToNewsletter(email) {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
  const body = JSON.stringify({ email, dest: location.origin })
  const response = await fetch("http://my-backend.org/subscriptions, { method: "POST", headers, body })
  const content = await response.json()
  if (response.ok && !content.error) {
    alert("user registered successfully")
  } else {
    alert(`an error ocurred: ${content.error}`)
  }
}
```
