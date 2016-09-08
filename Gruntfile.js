module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    eslint: {
      src: ["src/bugsnag.js", "test/test.bugsnag.js"]
    },
    "regex-replace": {
      dist: {
        src: ["src/bugsnag.js", "README.md"],
        actions: [
          {
            name: "version",
            search: /var NOTIFIER_VERSION =[^;]*;/,
            replace: function() {
              return "var NOTIFIER_VERSION = \"" + (require("./package.json").version) + "\";";
            }
          }, {
            name: "readme",
            search: /cloudfront.net\/bugsnag-([0-9]+\.)+[0-9]+.min.js/g,
            replace: function() {
              return "cloudfront.net/bugsnag-" + (require("./package.json").version) + ".min.js";
            }
          }
        ]
      }
    },
    s3: {
      options: {
        bucket: "bugsnagcdn",
        access: "public-read",
        gzip: true,
        headers: {
          "Cache-Control": "public, max-age=315360000"
        }
      },
      release: {
        upload: [
          {
            src: "src/bugsnag.js",
            dest: "bugsnag-<%= pkg.version %>.js"
          }, {
            src: "dist/bugsnag.min.js",
            dest: "bugsnag-<%= pkg.version %>.min.js"
          }, {
            src: "src/bugsnag.js",
            dest: "bugsnag-<%= pkg.version.split('.')[0] %>.js"
          }, {
            src: "dist/bugsnag.min.js",
            dest: "bugsnag-<%= pkg.version.split('.')[0] %>.min.js"
          }, {
            src: "dist/bugsnag.min.map",
            dest: "bugsnag-<%= pkg.version %>.min.map"
          }
        ]
      },
      major: {
        options: {
          headers: {
            "Cache-Control": "public, max-age=604800"
          }
        },
        upload: [
          {
            src: "src/bugsnag.js",
            dest: "bugsnag-<%= pkg.version.split('.')[0] %>.js"
          }, {
            src: "dist/bugsnag.min.js",
            dest: "bugsnag-<%= pkg.version.split('.')[0] %>.min.js"
          }
        ]
      }
    },
    "invalidate_cloudfront": {
      options: {
        key: process.env.AWS_ACCESS_KEY_ID,
        secret: process.env.AWS_SECRET_ACCESS_KEY,
        distribution: "E205JDPNKONLN7"
      },
      production: {
        files: [
          {
            dest: "bugsnag-3.min.js"
          }, {
            dest: "bugsnag-3.js"
          }
        ]
      }
    },
    bump: {
      options: {
        part: "patch",
        onBumped: function() {
          grunt.task.run("regex-replace");
        }
      },
      files: ["package.json", "component.json", "bower.json"]
    },
    watch: {
      test: {
        options: {
          livereload: 35729
        },
        files: ["test/*.js", "src/*.js"],
        tasks: ["eslint"]
      }
    },
    connect: {
      test: {
        options: {
          hostname: "localhost",
          port: 9002,
          livereload: 35729,
          open: true,
          base: ["test", "./"]
        }
      }
    },
    docco: {
      dist: {
        src: ["src/**/*.js"],
        dest: "docs/"
      }
    }
  });
  grunt.loadNpmTasks("grunt-mocha-phantomjs");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-bumpx");
  grunt.loadNpmTasks("grunt-s3");
  grunt.loadNpmTasks("grunt-docco");
  grunt.loadNpmTasks("grunt-regex-replace");
  grunt.loadNpmTasks("grunt-invalidate-cloudfront");
  grunt.loadNpmTasks("gruntify-eslint");
  grunt.registerTask("git-tag", "Tags a release in git", function() {
    var exec = require("child_process").exec;
    var done = this.async();
    var releaseVersion = grunt.template.process("<%= pkg.version %>");
    exec("git commit -am \"v" + releaseVersion + "\" && git tag --force v" + releaseVersion, function(error, stdout, stderr) {
      console.log(releaseVersion);
      if (error != null) {
        console.log("Error running git tag: " + error);
      }
      done(error == null);
    });
  });
  grunt.registerTask("git-push", "Push a release to github", function() {
    var exec = require("child_process").exec;
    var done = this.async();
    var releaseVersion = grunt.template.process("<%= pkg.version %>");
    exec("git push origin master \"v" + releaseVersion + "\"", function(error, stdout, stderr) {
      if (error != null) {
        console.log("Error running git push: " + error);
      }
      done(error == null);
    });
  });
  grunt.registerTask("npm_publish", "Publish a release to npm", function() {
    var exec = require("child_process").exec;
    var done = this.async();
    exec("npm publish", function(error, stdout, stderr) {
      if (error != null) {
        console.log("Error running npm publish: " + error);
      }
      done(error == null);
    });
  });
  grunt.registerTask("stats", ["uglify", "uglify-stats"]);
  grunt.registerTask("uglify", "Uglifies bugsnag.js", function() {
    var exec = require("child_process").exec;
    var done = this.async();
    exec("./bin/uglify.js", function(error, stdout) {
      if (error != null) {
        console.log("Error running uglify.js: " + error);
      }
      done(error == null);
    });
  });
  grunt.registerTask("uglify-stats", "Outputs stats about uglification", function() {
    var exec = require("child_process").exec;
    var done = this.async();
    exec(["echo \"Size: $(cat src/bugsnag.js | wc -c)\"", "echo \"Ugly: $(cat dist/bugsnag.min.js | wc -c)\"", "echo \"Gzip: $(cat dist/bugsnag.min.js | gzip | wc -c)\""].join(" && "), function(error, stdout, stderr) {
      grunt.log.write(stdout.toString());
      grunt.log.write(stderr.toString());
      done(error == null);
    });
  });
  grunt.registerTask("release", ["eslint", "uglify", "docco", "git-tag", "git-push", "s3", "npm_publish", "invalidate_cloudfront"]);
  grunt.registerTask("server", ["connect:server:keepalive"]);
  grunt.registerTask("default", ["eslint", "uglify", "docco"]);
};
