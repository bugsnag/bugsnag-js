const { TextDecoder, TextEncoder } = require('node:util')
const crypto = require('crypto')

const JSDOMEnvironment = require('jest-environment-jsdom')

class FixJSDOMEnvironment extends JSDOMEnvironment {
  constructor (...args) {
    super(...args)

    this.global.TextEncoder = TextEncoder
    this.global.TextDecoder = TextDecoder
    this.global.crypto = {
      subtle: crypto.webcrypto.subtle
    }
  }
}

module.exports = FixJSDOMEnvironment
