const JSDOMEnvironment = require('jest-environment-jsdom').TestEnvironment;
const { TextDecoder, TextEncoder } = require('node:util')
const crypto = require('crypto')
class FixJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    this.global.TextEncoder = TextEncoder
    this.global.TextDecoder = TextDecoder
    this.global.crypto.subtle = crypto.webcrypto.subtle
  }

  async teardown() {
    this.global.TextEncoder = undefined
    this.global.TextDecoder = undefined
    this.global.crypto = undefined
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = FixJSDOMEnvironment;