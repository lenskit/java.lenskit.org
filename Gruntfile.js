module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! LensKit JS and dependencies <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        preserveComments: 'some'
      },
      lenskit: {
        files: {
          's/lenskit.min.js': ['s/ender.js', 's/lenskit.js']
        }
      }
    },
    ender: {
      options: {
        output: "s/ender.js",
        dependencies: ["bonzo", "qwery", "bean"]
      }
    }
  });

  grunt.loadNpmTasks('grunt-ender');
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'ender']);
};
