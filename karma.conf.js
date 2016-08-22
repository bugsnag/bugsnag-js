var browsers = require("./browsers.json");

module.exports = function(config) {

  config.set({
    basePath: "",
    frameworks: [
      "mocha-ie-legacy"
    ],
    files: [
      { pattern: "src/bugsnag.js", watched: true, included: false, served: true },
      { pattern: "test/**/*", watched: true, included: false, served: true },
      "test/assert.js",
      "test/stub.js",
      "test/test.bugsnag.js"
    ],
    proxies: {
      "/": "/base/test/",
      "/src": "/base/src",
      "/amd": "/base/test/amd"
    },
    concurrency: 4,
    customLaunchers: browsers,
    browserConsoleLogOptions: {
      terminal: false
    },
    logLevel: config.LOG_WARN,
    browsers: ["PhantomJS"].concat(Object.keys(browsers)),
    reporters: ["dots", "saucelabs"],
    client: {
      mocha: {
        ui: "bdd"
      }
    }
  });
};

