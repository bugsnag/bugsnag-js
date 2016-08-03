module.exports = function(config) {
  // Example set of browsers to run on Sauce Labs
  // Check out https://saucelabs.com/platforms for all browser/platform combos
  var customLaunchers = {
    sl_chrome: {
      base: "SauceLabs",
      browserName: "chrome",
      platform: "Windows 7",
      version: "35"
    },
    sl_firefox: {
      base: "SauceLabs",
      browserName: "firefox",
      version: "30"
    },
    sl_ios_safari: {
      base: "SauceLabs",
      browserName: "iphone",
      platform: "OS X 10.9",
      version: "7.1"
    },
    sl_ie_11: {
      base: "SauceLabs",
      browserName: "internet explorer",
      platform: "Windows 8.1",
      version: "11"
    }
  };

  config.set({
    basePath: "",
    frameworks: ["mocha"],
    files: [
      { pattern: "src/bugsnag.js", watched: true, included: false, served: true },
      { pattern: "test/**/*", watched: true, included: false, served: true },
      "test/assert.js",
      "test/stub.js",
      "test/test.bugsnag.js"
    ],
    proxies: {
      "/": "/base/test",
      "/src": "/base/src",
      "/amd": "/base/test/amd"
    },

    // The rest of your karma config is here
    // ...
    sauceLabs: {
      testName: "Bugsnag JS Unit Tests"
    },

    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    reporters: ["dots", "saucelabs"],
    singleRun: true,

    client: {
      mocha: {
        ui: "bdd"
      }
    }
  });
};

