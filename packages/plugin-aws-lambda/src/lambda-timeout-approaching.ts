export default class LambdaTimeoutApproaching extends Error {
  constructor (remainingMs: string) {
    const message = `Lambda will timeout in ${remainingMs}ms`
    super(message)

    this.name = 'LambdaTimeoutApproaching'
    this.stack = undefined
  }
}
