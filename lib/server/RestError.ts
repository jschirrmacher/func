export default class RestError extends Error {
  status

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
