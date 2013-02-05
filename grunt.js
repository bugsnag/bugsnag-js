var prompt = require("prompt");
var exec = require('child_process').exec;

module.exports = function (grunt) {
  // Project configuration
  grunt.initConfig({
    // Files to lint
    lint: {
      all: ["src/**/*.js", "test/**/*.js"]
    },

    // JSHint rules (see http://www.jshint.com/docs/)
    jshint: {
      options: {
        // Predefined globals
        browser: true,

        // The Good Parts
        eqeqeq: true,
        eqnull: true,
        curly: true,
        latedef: true,
        undef: true,
        forin: true,

        // Style preferences
        indent: 2,
        camelcase: true,
        trailing: true,
        quotmark: "double",
        newcap: true
      }
    },

    // Minification
    min: {
      dist: {
        src: ["src/bugsnag.js"],
        dest: "dist/bugsnag.min.js"
      }
    },

    // Text replacement
    replace: {
      version: {
        src: ["src/bugsnag.js", "component.json", "package.json"],
        overwrite: true,
        replacements: [{
          from: /NOTIFIER_VERSION = "(\d+\.\d+\.\d+)"/,
          to: function () {
            return 'NOTIFIER_VERSION = "' + grunt.task.current.args[0] + '"';
          }
        }, {
          from: /"version": "(\d+\.\d+\.\d+)"/,
          to: function () {
            return '"version": "' + grunt.task.current.args[0] + '"';
          }
        }]
      }
    }
  });



  // Task to update version numbers in the code
  grunt.registerTask("update-version", "Updates version numbers in your code", function () {
    var done = this.async();
    var schema = {
      properties: {
        version: {
          pattern: /^\d+\.\d+\.\d+$/,
          required: true,
          description: "What is the version number for this release?".green,
          message: "Version must be a valid semantic version number".red
        }
      }
    };

    prompt.start();
    prompt.message = "";
    prompt.delimiter = "";
    prompt.get(schema, function (err, result) {
      if(err) done(false);

      process.env.RELEASE_VERSION = result.version;
      grunt.task.run("replace:version:" + result.version);
      done();
    });
  });

  // Task to tag a version in git
  grunt.registerTask("git-tag", "Tags a release in git", function (version) {
    var done = this.async();
    var releaseVersion = process.env.RELEASE_VERSION || version;

    if(!releaseVersion) {
      done(false);
    }

    var child = exec("git tag v" + releaseVersion, function (error, stdout, stderr) {
      if(error !== null) {
        console.log("Error running git tag: " + error);
        done(false);
      } else {
        done();
      }
    });
  });


  // Release task
  // lint, update version, minify, tag in git, copy to s3
  grunt.registerTask("release", "lint update-version min git-tag");


  // Load tasks from plugins
  grunt.loadNpmTasks("grunt-text-replace");

  // Default task
  grunt.registerTask("default", "lint min");
};