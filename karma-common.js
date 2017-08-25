var browsers = require('./browsers.json');

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
  captureTimeout: 100000,
  browserDisconnectTimeout: 100000,
  browserNoActivityTimeout: 100000,
  customLaunchers: browsers,
  browsers: [],
  reporters: [ "progress", "saucelabs" ],
  sauceLabs: process.env.TRAVIS
    ? {
        build: process.env.TRAVIS_BUILD_NUMBER,
        testName: "Bugsnag.js Browser Tests",
        tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
        startConnect: false
      }
    : {},
  client: {
    mocha: {
      timeout: 100000,
      ui: "bdd"
    }
  }
};
