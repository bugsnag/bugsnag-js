var browsers = require("./browsers.json");

module.exports = function(config) {
  var travisSauceLabsOptions =  {
    build: process.env.TRAVIS_BUILD_NUMBER,
    testName: "Bugsnag.js Browser Tests",
    tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
    startConnect: false,
  };

  config.set({
    basePath: "",
    port: 9876,
    frameworks: [
      "mocha-ie-legacy"
    ],
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
      "/amd": "/base/test/amd"
    },
    preprocessors: {
      'src/bugsnag.js': ["coverage"]
    },
    coverageReporter: {
      reporters: [
        { type: 'text-summary' },
        { type: 'html' }
      ]
    },
    concurrency: 1,
    captureTimeout: 100000,
    browserDisconnectTimeout: 100000,
    browserNoActivityTimeout: 100000,
    customLaunchers: browsers,
    browsers: ["PhantomJS"].concat(Object.keys(browsers)),
    reporters: ["coverage", "dots", "saucelabs"],
    sauceLabs: process.env.TRAVIS ? travisSauceLabsOptions : {},
    client: {
      mocha: {
        timeout: 100000,
        ui: "bdd"
      }
    }
  });
};
