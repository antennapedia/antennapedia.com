#!/usr/bin/env node

var Metalsmith = require('metalsmith'),
	metadata   = require('metalsmith-metadata'),
	paths      = require('metalsmith-paths'),
	sitetitle  = require('metalsmith-page-titles'),
	buildDate  = require('metalsmith-build-date'),
	sass       = require('metalsmith-sass'),
	markdownit = require('metalsmith-markdownit'),
	timestamp  = require('metalsmith-timestamp'),
	navigation = require('metalsmith-navigation'),
	tags       = require('metalsmith-tags'),
	wordcount  = require('metalsmith-word-count'),
	layouts    = require('metalsmith-layouts'),
	beautify   = require('metalsmith-beautify'),
	static     = require('metalsmith-static'),
	changed    = require('metalsmith-changed'),
	autotoc    = require('metalsmith-autotoc')
	;

var argv = require('yargs')
	.option('c', {
		alias: 'changed',
		type: 'boolean',
		description: 'only process changed files'
	})
	.argv;

var metalsmith = new Metalsmith('.');

if (argv.changed)
{
	metalsmith
		.clean(false)
		.use(changed({ extnames: {
			'.md': '.html',
			'.sass': '.css',
		}}));
}

metalsmith
	.metadata({
		site: { title: 'Antennapedia' }
	})
	.use(metadata({
		fandoms: 'metadata/fandoms.json'
	}))
	.use(paths())
	.use(sitetitle())
	.use(buildDate())
	.use(sass({'outputStyle': 'expanded'}))
	.use(markdownit({
		'typographer': true,
		'html': true
	}))
	.use(timestamp())
	.use(navigation())
	.use(tags({
		'handle': 'tags',
		'path': 'tags/:tag.html',
		'layout': 'tag.jade',
		'sortBy': 'published'
	}))
	.use(wordcount())
	.use(autotoc({selector: 'h2, h3, h4'}))
	.use(layouts({
		'engine': 'jade',
		'default': 'story.jade',
		'pattern': ['**/*.html' ]
	}))
	.use(beautify({
		'css': true,
		'preserve_newlines': false
	}))
	.use(static({
		'src': 'static',
		'dest': '.'
	}));

metalsmith.build(function(err)
{
	if (err) throw err;
});
