var browsers = require('./browsers.json');

var MINUTE_IN_MS = 1000 * 60
var MAX_TIMEOUT = 1 * MINUTE_IN_MS

module.exports = {
  basePath: "",
  port: 9876,
  frameworks: [ "mocha-ie-legacy" ],
  files: [
    "test/assert.js",
    "test/stub.js",
    "test/test.bugsnag.js",
    { pattern: "src/bugsnag.js", watched: true, included: false, served: true },
    { pattern: "test/**/*", watched: true, included: false, served: true }
  ],
  proxies: {
    "/": "/base/test/",
    "/src": "/base/src",
    "/amd": "/base/test/amd",
    "/jquery": "/base/test/jquery"
  },
  concurrency: 1,
  captureTimeout: MAX_TIMEOUT,
  browserDisconnectTimeout: MAX_TIMEOUT,
  browserNoActivityTimeout: MAX_TIMEOUT,
  customLaunchers: browsers,
  browsers: [],
  reporters: [ "progress", "BrowserStack" ],
  browserStack: {
    startTunnel: !process.env.TRAVIS,
    tunnelIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
    project: process.env.TRAVIS_REPO_SLUG
  },
  client: {
    mocha: {
      timeout: 100000,
      ui: "bdd"
    }
  }
};
