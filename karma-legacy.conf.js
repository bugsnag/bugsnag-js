var browsers = require("./browsers.json");
var common = require('./karma-common.js');

module.exports = function(config) {
  config.set(Object.assign({}, common, {
    browsers: Object.keys(browsers).filter(function (key) { return !!browsers[key].legacy })
  }));
};
