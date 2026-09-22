const jsdomPkg = require('jest-environment-jsdom')
const JSDOMEnvironment = jsdomPkg.TestEnvironment || jsdomPkg.default || jsdomPkg

const { TextDecoder, TextEncoder } = require('node:util')
const crypto = require('crypto')

class FixJSDOMEnvironment extends JSDOMEnvironment {
  async setup () {
    await super.setup()
    this.global.TextEncoder = TextEncoder
    this.global.TextDecoder = TextDecoder
    
    // FIX: Initialize crypto object if undefined in JSDOM environment
    if (!this.global.crypto) {
      this.global.crypto = {}
    }
    if (crypto.webcrypto && crypto.webcrypto.subtle) {
      this.global.crypto.subtle = crypto.webcrypto.subtle
    }
  }

  async teardown () {
    this.global.TextEncoder = undefined
    this.global.TextDecoder = undefined
    this.global.crypto = undefined
    await super.teardown()
  }

  getVmContext () {
    return super.getVmContext()
  }
}

module.exports = FixJSDOMEnvironment
