#!/usr/bin/env node

var Metalsmith = require('metalsmith'),
	beautify    = require('metalsmith-beautify'),
	buildDate   = require('metalsmith-build-date'),
	changed     = require('metalsmith-changed'),
	collections = require('metalsmith-collections'),
	feed        = require('metalsmith-feed'),
	identifiers = require('metalsmith-headings-identifier'),
	layouts     = require('metalsmith-layouts'),
	markdownit  = require('metalsmith-markdownit'),
	metadata    = require('metalsmith-metadata'),
	navigation  = require('metalsmith-navigation'),
	paths       = require('metalsmith-paths'),
	sass        = require('metalsmith-sass'),
	sitetitle   = require('metalsmith-page-titles'),
	static      = require('metalsmith-static'),
	tags        = require('metalsmith-tags'),
	timestamp   = require('metalsmith-timestamp'),
	wordcount   = require('metalsmith-word-count')
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
	.concurrency(30)
	.metadata({
		site: {
			title: 'Antennapedia',
			url: 'https://antennapedia.com',
			author: 'antennapedia'
		}
	})
	.use(metadata({
		fandoms: 'metadata/fandoms.json',
		series: 'metadata/series.json'
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
	.use(wordcount())
	.use(collections({
		recent: {
			pattern: '**/*.html',
			sortBy: 'published',
			reverse: true,
			limit: 10
		}
	}))
	.use(feed({ collection: 'recent' }))
	.use(tags({
		'handle': 'tags',
		'path': 'tags/:tag.html',
		'layout': 'tag.jade',
		'sortBy': 'idtag'
	}))
	.use(layouts({
		'engine': 'jade',
		'default': 'story.jade',
		'pattern': ['**/*.html' ]
	}))
	.use(identifiers())
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
