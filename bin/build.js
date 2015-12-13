#!/usr/bin/env node

var Metalsmith = require('metalsmith'),
	autotoc       = require('metalsmith-autotoc'),
	beautify      = require('metalsmith-beautify'),
	buildDate     = require('metalsmith-build-date'),
	changed       = require('metalsmith-changed'),
	collections   = require('metalsmith-collections'),
	dateFormatter = require('metalsmith-date-formatter'),
	feed          = require('metalsmith-feed'),
	identifiers   = require('metalsmith-headings-identifier'),
	layouts       = require('metalsmith-layouts'),
	markdownit    = require('metalsmith-markdownit'),
	metadata      = require('metalsmith-metadata'),
	paths         = require('metalsmith-paths'),
	rootpath      = require('metalsmith-rootpath'),
	sass          = require('metalsmith-sass'),
	sitetitle     = require('metalsmith-page-titles'),
	static        = require('metalsmith-static'),
	tags          = require('metalsmith-tags'),
	wordcount     = require('metalsmith-word-count')
	;

var start = Date.now();

var argv = require('yargs')
	.option('c', {
		alias:       'changed',
		type:        'boolean',
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
	.concurrency(40)
	.metadata({
		site: {
			title: 'Antennapedia',
			url: 'https://antennapedia.com',
			author: 'antennapedia'
		}
	})
	.use(metadata({
		fandoms: 'metadata/fandoms.json',
		series: 'metadata/series.json',
		archive: 'metadata/archive.json'
	}))
	.use(paths())
	.use(rootpath())
	.use(sitetitle())
	.use(buildDate())
	.use(sass({'outputStyle': 'expanded'}))
	.use(markdownit({
		'typographer': true,
		'html': true
	}))
	.use(dateFormatter({
		dates: [{ key: 'published', format: 'YYYY/MM/DD' }]
	}))
	.use(autotoc({selector: 'h2, h3, h4'}))
	.use(wordcount())
	.use(totalWords)
	.use(collections({
		recent: {
			pattern: '*/*.html',
			sortBy: 'published',
			reverse: true,
			limit: 15
		},
		all: {
			pattern: '*/*.html',
			sortBy: 'published',
			reverse: true
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

function totalWords(files, ms, done)
{
	var metadata = metalsmith.metadata();
	var total = 0;
	var fnames = Object.keys(files);
	fnames.forEach(function(f)
	{
		total += parseInt(files[f].wordCount || 0, 10);
	});
	metadata.storycount = fnames.length - 4; // magic number
	metadata.wordcount = total;
	done();
}

metalsmith.build(function(err)
{
	console.log('site built in ' + Math.round((Date.now() - start) / 1000) + 's');
	if (err) throw err;
});
