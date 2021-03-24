const expect = require('expect')
const matchers = require('./payload-matchers')
expect.extend(matchers)

module.exports = expect
