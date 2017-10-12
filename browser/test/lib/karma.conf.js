const browsers = require('./browsers.json')
const MINUTE_IN_MS = 1000 * 60
const MAX_TIMEOUT = 2 * MINUTE_IN_MS
const CI_BS_CONF = {
  startTunnel: false,
  tunnelIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
  project: process.env.TRAVIS_REPO_SLUG + '#' + process.env.TRAVIS_BRANCH
}

require('./echo-server')

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../..',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'browserify', 'jasmine' ],

    browserify: {
      debug: true,
      transform: [
        [ 'browserify-istanbul', { global: true } ],
        [ 'es3ify', { global: true } ],
        [ 'bubleify', { global: true, namedFunctionExpressions: false } ]
      ],
      plugin: []
    },

    // list of files / patterns to load in the browser
    files: [
      '**/*.test.js'
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
    reporters: [ 'progress', 'BrowserStack', 'coverage' ],

    coverageReporter: {
      dir: '../coverage',
      type: 'lcov'
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // browser settings
    customLaunchers: browsers,
    captureTimeout: MAX_TIMEOUT,
    browserDisconnectTimeout: MAX_TIMEOUT,
    browserNoActivityTimeout: MAX_TIMEOUT,

    browserStack: process.env.TRAVIS ? CI_BS_CONF : { startTunnel: true },

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
