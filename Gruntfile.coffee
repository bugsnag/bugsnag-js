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
        globals:
          BUGSNAG_TESTING: false

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
          src: ["src/bugsnag.js"]

    "regex-replace":
      dist:
        src:
          ["src/bugsnag.js", "README.md"]
        actions: [
          name: "version"
          search: /var NOTIFIER_VERSION =[^;]*;/
          replace: -> "var NOTIFIER_VERSION = \"#{require("./package.json").version}\";"
        ,
          name: "readme"
          search: /cloudfront.net\/bugsnag-([0-9]+\.)+[0-9]+.min.js/g
          replace: -> "cloudfront.net/bugsnag-#{require("./package.json").version}.min.js"
        ]

    # Upload to s3
    s3:
      options:
        bucket: "bugsnagcdn"
        access: "public-read"
        gzip: true
        headers: {
          'Cache-Control': 'max-age: 315360000'
        }

      release:
        upload: [{
          src: "src/bugsnag.js"
          dest: "bugsnag-<%= pkg.version %>.js"
        }, {
          src: "dist/bugsnag.min.js"
          dest: "bugsnag-<%= pkg.version %>.min.js"
        }, {
          src: "dist/bugsnag.min.map",
          dest: "bugsnag-<%= pkg.version %>.min.map"
        }]
      major:
        options: {
          headers: {
            'Cache-Control': 'max-age: 604800'
          }
        }
        upload: [{
          src: "src/bugsnag.js"
          dest: "bugsnag-<%= pkg.version.split('.')[0] %>.js"
        },
        {
          src: "dist/bugsnag.min.js"
          dest: "bugsnag-<%= pkg.version.split('.')[0] %>.min.js"
        }]

    # Version bumping
    bump:
      options:
        part: "patch"
        onBumped: ->
          grunt.task.run("regex-replace")
      files: ["package.json", "component.json"]

    watch:
      test:
        options:
          livereload: 35729
        files: ['test/*.js', 'src/*.js'],
        tasks: ['jshint']

    # Web server
    connect:
      test:
        options:
          hostname: 'localhost'
          port: 9002
          livereload: 35729
          open: true
          base: [
            'test'
            './'
          ]

    # Documentation
    docco:
      dist:
        src: ["src/**/*.js"]
        dest: "docs/"

  # Load tasks from plugins
  grunt.loadNpmTasks "grunt-contrib-jshint"
  grunt.loadNpmTasks "grunt-contrib-connect"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-bumpx"
  grunt.loadNpmTasks "grunt-s3"
  grunt.loadNpmTasks "grunt-docco"
  grunt.loadNpmTasks "grunt-regex-replace"

  # Task to tag a version in git
  grunt.registerTask "git-tag", "Tags a release in git", ->
    exec = require("child_process").exec
    done = this.async()
    releaseVersion = grunt.template.process("<%= pkg.version %>")

    child = exec "git commit -am \"v#{releaseVersion}\" && git tag v#{releaseVersion}", (error, stdout, stderr) ->
      console.log("Error running git tag: " + error) if error?
      done(!error?)

  grunt.registerTask "stats", ["uglify", "uglify-stats"]

  grunt.registerTask "uglify", "Uglifies bugsnag.js", () ->
    exec = require("child_process").exec
    done = this.async()
    child = exec "./bin/uglify.coffee", (error, stdout, stderr) ->
      console.log("Error running uglify.coffee: " + error) if error?
      done(!error?)


  grunt.registerTask "uglify-stats", "Outputs stats about uglification", ->
    exec = require("child_process").exec
    done = this.async()

    exec ['echo "Size: $(cat src/bugsnag.js | wc -c)"',
          'echo "Ugly: $(cat dist/bugsnag.min.js | wc -c)"',
          'echo "Gzip: $(cat dist/bugsnag.min.js | gzip | wc -c)"'].join(" && "), (error, stdout, stderr) ->
            grunt.log.write(stdout.toString())
            grunt.log.write(stderr.toString())
            done(!error?)

  # Release meta-task
  grunt.registerTask "release", ["jshint", "uglify", "docco", "git-tag", "s3"]

  # Run a webserver for testing
  grunt.registerTask "server", ["connect:server:keepalive"]

  # Run tests
  grunt.registerTask "test", ["jshint", "connect:test", "watch:test"]

  # Default meta-task
  grunt.registerTask "default", ["jshint", "uglify", "docco"]
