'use strict';
module.exports = function (grunt) {
	grunt.initConfig({
		// these save a bit of typing
		env: process.env,
		conf: grunt.config.get,

		config: {
			dev: {
				options: {
					variables: {
						'dist_dir': '.',
						'dist_archive': ''
					}
				}
			}
		},

		node_tap: {
			tests: {
				options: {
					outputType: 'failures',// tap, failures, stats
					outputTo: 'console' // console, file
				},
				files: {
					'tests': [
						'<%= conf("dist_dir") %>/tests/**/*.js',
						'!<%= conf("dist_dir") %>/tests/config/**/*'
					]
				}
			}
		},

		// local dev only
		watch: {
			files: [
				'./**/*.js',
				'!./node_modules/**/*',
				'!./tests/**/*',
				'!./Gruntfile.js'
			],
			tasks: ['node_tap:tests']
		},

		clean: {
			mf_node_modules: ['<%= conf("dist_dir") %>/node_modules/if-*'],
			dist_dir: ['<%= conf("dist_dir") %>'],
			dist_archive: ['<%= conf("dist_archive") %>']
		},

		exec: {
			// local dev only
			git_update: {
				cmd: 'git stash && git pull --rebase && git stash pop'
			},
			git_update_for_ci: {
				cmd: 'git checkout dev && git checkout . && git pull'
			},
			npm_install: {
				cwd: '<%= conf("dist_dir") %>',
				cmd: 'npm install'
			},
			npm_install_production: {
				cwd: '<%= conf("dist_dir") %>',
				cmd: 'npm install --production'
			}
		},

		copy: {
			for_dist: {
				files: [
					{
						expand: true,
						dest: '<%= conf("dist_dir") %>',
						src: [
							'./**/*.js',
							'./**/*.json',
							'./*.sh',
							'!./Gruntfile.js',
							'!./tests/**/*',
							'!./node_modules/**/*'
						]
					}
				]
			}
		},
		replaceTestConfig: {
			for_ci: {
			}
		}
	});

	grunt.registerMultiTask('replaceTestConfig', 'Replaces bits of the config.js file', function () {
		var d = this.data;
		var testConfigClass = grunt.util._.extend(require(d.testConfig), d.keyValuePairs);
		var fileContent = 'module.exports = ' + JSON.stringify(testConfigClass) + ';';
		grunt.file.write(d.testConfig, fileContent, {encoding: 'utf8'});
	});

	['grunt-node-tap', 'grunt-contrib-watch', 'grunt-contrib-clean', 'grunt-exec',
		'grunt-config'].forEach(grunt.loadNpmTasks);

	// local dev tasks
	grunt.registerTask('test', ['config:dev', 'node_tap:tests']);
	grunt.registerTask('update', ['config:dev', 'exec:git_update', 'clean:mf_node_modules', 'exec:npm_install']);
	grunt.registerTask('npmclean', ['config:dev', 'clean:mf_node_modules', 'exec:npm_install']);
	grunt.registerTask('dev', ['config:dev', 'watch']);

	grunt.registerTask('ci_test', ['config:dev', 'exec:git_update_for_ci', 'clean:mf_node_modules',
		'exec:npm_install', 'replaceTestConfig:for_ci', 'node_tap:tests']);
};
