// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const Client = require('../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('client()', () => {

})
