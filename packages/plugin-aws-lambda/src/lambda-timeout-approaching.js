module.exports = class LambdaTimeoutApproaching extends Error {
  constructor (remainingMs) {
    const message = `Lambda will timeout in ${remainingMs}ms`

    super(message)

    this.name = 'LambdaTimeoutApproaching'
    this.stack = []
  }
}
