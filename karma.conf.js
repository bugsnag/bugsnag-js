var browsers = require("./browsers.json");
var common = require('./karma-common.js');

module.exports = function(config) {
  config.set(Object.assign({}, common, {
    preprocessors: { "src/bugsnag.js": [ "coverage" ] },
    coverageReporter: {
      reporters: [
        { type: "text-summary" },
        { type: "html" }
      ]
    },
    reporters: [ "coverage", "progress", "saucelabs" ],
    browsers: []
    .concat("PhantomJS")
    .concat(
      Object.keys(browsers).filter(function (key) { return !browsers[key].legacy })
    )
  }));
};
