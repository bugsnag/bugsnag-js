require "colors"
MochaCloud = require "mocha-cloud"

module.exports = (grunt) ->
  # Configuration
  grunt.initConfig
    # Package information
    pkg: grunt.file.readJSON "package.json"

    # JSHint (see http://www.jshint.com/docs/)
    jshint:
      options:
        # Predefined globals
        browser: true

        # The Good Parts
        eqeqeq: true
        eqnull: true
        curly: true
        latedef: true
        undef: true
        forin: true

        # Style preferences
        indent: 2
        camelcase: true
        trailing: true
        quotmark: "double"
        newcap: true

      dist:
        files:
          src: ["src/**/*.js"]

    # File concatenation, copying and templating
    concat:
      options:
        process: true
      dist:
        src: ["src/bugsnag.js"]
        dest: "dist/bugsnag.js"

    # Minification
    uglify:
      dist:
        files:
          "dist/bugsnag.min.js": ["dist/bugsnag.js"]

    # Upload to s3
    s3:
      bucket: "bugsnagcdn"
      access: "public-read"
      gzip: true

      upload: [
        src: "dist/bugsnag.js",
        dest: "bugsnag-<%= pkg.version %>.js"
      ,
        src: "dist/bugsnag.min.js",
        dest: "bugsnag-<%= pkg.version %>.min.js"
      ]

    # Version bumping
    bump:
      options: part: "patch"
      files: ["package.json", "component.json"]

    # Web server
    connect:
      server:
        options:
          hostname: null
          port: 8888

    # Tests
    mochaCloud:
      username: process.env.SAUCE_USERNAME
      accessKey: process.env.SAUCE_ACCESS_KEY
      url: "http://localhost:8888/test/"
      browsers: [
        ["chrome", "", "Mac 10.8"]
        ["chrome", "", "Windows 2003"]
        ["firefox", "11", "Mac 10.6"]
        ["firefox", "11", "Windows 2003"]
        ["safari", "5", "Mac 10.6"]
        ["safari", "6", "Mac 10.8"]
        ["iexplore", "6", "Windows 2003"]
        ["iexplore", "7", "Windows 2003"]
        ["iexplore", "8", "Windows 2003"]
        ["iexplore", "9", "Windows 2008"]
      ]

    # Documentation
    docco:
      dist:
        src: ["src/**/*.js"]
        dest: "lxdocs/"

  # Load tasks from plugins
  grunt.loadNpmTasks "grunt-contrib-jshint"
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-connect"
  grunt.loadNpmTasks "grunt-bumpx"
  grunt.loadNpmTasks "grunt-s3"
  grunt.loadNpmTasks "grunt-docco"

  # Task to tag a version in git
  grunt.registerTask "git-tag", "Tags a release in git", ->
    exec = require("child_process").exec
    done = this.async()
    releaseVersion = grunt.template.process("<%= pkg.version %>")

    child = exec "git ci -am \"v#{releaseVersion}\" && git tag v#{releaseVersion}", (error, stdout, stderr) ->
      console.log("Error running git tag: " + error) if error?
      done(!error?)

  # Testing
  grunt.registerTask "mocha-cloud", "Run mocha browser tests using mocha-cloud and Sauce Labs", ->
    done = this.async()
    options = grunt.config.get("mochaCloud")

    # Set up mocha-cloud
    cloud = new MochaCloud("", options.username, options.accessKey)
    cloud.url options.url
    cloud.browser b... for b in options.browsers

    # Progress hooks
    cloud.on "start", (browser) ->
      console.log "[#{browser.browserName} #{browser.version} #{browser.platform}] Starting tests"
    
    cloud.on "end", (browser, res) ->
      if res.failures > 0
        console.log "[#{browser.browserName} #{browser.version} #{browser.platform}] #{res.failures} test(s) failed:".red
        for f in res.failed
          console.log "-   #{f.fullTitle}".red
          console.log "    #{f.error.message}".red
      else
        console.log "[#{browser.browserName} #{browser.version} #{browser.platform}] All tests passed".green
    
    # Start tests
    cloud.start (err, res) ->
      console.log(err) if err?
      done(!err? && res[0].failures == 0)

  # Release meta-task
  grunt.registerTask "release", ["jshint", "concat", "uglify", "docco", "git-tag", "s3"]

  # Run a webserver for testing
  grunt.registerTask "server", ["connect:server:keepalive"]

  # Run tests
  grunt.registerTask "test", ["connect", "mocha-cloud"]

  # Default meta-task
  grunt.registerTask "default", ["jshint", "concat", "uglify", "docco"]