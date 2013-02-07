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
          port: 8888

  # Load tasks from plugins
  grunt.loadNpmTasks "grunt-contrib-jshint"
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-connect"
  grunt.loadNpmTasks "grunt-bumpx"
  grunt.loadNpmTasks "grunt-s3"

  # Task to tag a version in git
  grunt.registerTask "git-tag", "Tags a release in git", ->
    exec = require("child_process").exec
    done = this.async()
    releaseVersion = grunt.template.process("<%= pkg.version %>")

    child = exec "git tag v#{releaseVersion}", (error, stdout, stderr) ->
      console.log("Error running git tag: " + error) if error?
      done(!error?)

  # Testing
  grunt.registerTask "test", "Tests using mocha-cloud", ->
    done = this.async()

    # Set up mocha-cloud
    cloud = new MochaCloud("bugsnag", "bugsnag", "17ac72ca-9c02-4d40-a5b2-f698e512c58b")
    cloud.browser "chrome", "", "Mac 10.8"
    cloud.browser "chrome", "", "Windows 2003"
    cloud.browser "firefox", "11", "Mac 10.6"
    cloud.browser "firefox", "11", "Windows 2003"
    cloud.browser "safari", "5", "Mac 10.6"
    cloud.browser "safari", "6", "Mac 10.8"
    cloud.browser "iexplore", "9", "Windows 2008"
    # cloud.browser "opera", "12", "Windows 2008"

    cloud.url "http://localhost:8000/test/"

    # Hooks
    success = true
    cloud.on "init", (browser) ->
      console.log "[#{browser.browserName} #{browser.version} #{browser.platform}] Loading VM"

    cloud.on "start", (browser) ->
      console.log "[#{browser.browserName} #{browser.version} #{browser.platform}] Starting tests"

    cloud.on "end", (browser, res) ->
      if res.failures > 0
        success = false
        console.log "[#{browser.browserName} #{browser.version} #{browser.platform}] #{res.failures} test(s) failed:".red
        for f in res.failed
          console.log "-   #{f.fullTitle}".red
          console.log "    #{f.error.message}".red
      else
        console.log "[#{browser.browserName} #{browser.version} #{browser.platform}] All tests passed".green

    # Start tests
    cloud.start -> done(success)

  # Release meta-task
  grunt.registerTask "release", ["jshint", "concat", "uglify", "git-tag", "s3"]

  # Run a webserver for testing
  grunt.registerTask "server", ["connect:server:keepalive"]

  # Default meta-task
  grunt.registerTask "default", ["jshint", "concat", "uglify"]