const browsers = require('./browsers.json')
const MINUTE_IN_MS = 1000 * 60
const MAX_TIMEOUT = 2 * MINUTE_IN_MS

require('./lib/echo-server')

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'browserify', 'jasmine' ],

    browserify: {
      debug: true,
      transform: [ [ 'es3ify', { global: true } ], 'browserify-istanbul', [ 'bubleify', { 'namedFunctionExpressions': false, global: true } ] ],
      plugin: []
    },

    // list of files / patterns to load in the browser
    files: [
      '*.js'
    ],

    // list of files to exclude
    exclude: [
      'karma.conf.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      './**/*.js': [ 'browserify' ]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [ 'progress', 'saucelabs', 'coverage' ],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // browser/sauce settings
    customLaunchers: browsers,
    captureTimeout: MAX_TIMEOUT,
    browserDisconnectTimeout: MAX_TIMEOUT,
    browserNoActivityTimeout: MAX_TIMEOUT,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [ 'ChromeHeadless' ].concat(Object.keys(browsers)),

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: 1,

    proxies: {
      '/echo': 'http://localhost:55854'
    }
  })
}
