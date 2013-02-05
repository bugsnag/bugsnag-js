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
    }
  });

  // Load tasks from plugins

  // Default task
  grunt.registerTask("default", "lint min");
};