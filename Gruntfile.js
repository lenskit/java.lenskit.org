module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= grunt.task.current.nameArgs %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        preserveComments: 'some'
      },
      lenskit: {
        src: 's/lenskit.js',
        dest: 's/lenskit.min.js'
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
