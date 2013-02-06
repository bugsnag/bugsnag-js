MochaCloud = require "mocha-cloud"

module.exports = (grunt) ->

  #
  # Configuration
  #
  
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
      server: {}


  #
  # Tasks
  #

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

  # Release meta-task
  grunt.registerTask "release", ["jshint", "concat", "uglify", "git-tag", "s3"]

  # Default meta-task
  grunt.registerTask "default", ["jshint", "concat", "uglify"]