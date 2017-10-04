var browsers = require("./browsers.json");
var common = require('./karma-common.js');

var LEGACY_BROWSERS = [ 'bs_ie_6', 'bs_ie_7', 'bs_ie_8', 'bs_ie_9' ]

module.exports = function(config) {
  config.set(Object.assign({}, common, {
    browsers: Object.keys(browsers).filter(function (key) {
      return LEGACY_BROWSERS.indexOf(key) !== -1
    })
  }));
};
