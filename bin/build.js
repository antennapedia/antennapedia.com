#!/usr/bin/env node

var Metalsmith = require('metalsmith'),
	archive       = require('metalsmith-archive'),
	autotoc       = require('metalsmith-autotoc'),
	beautify      = require('metalsmith-beautify'),
	buildDate     = require('metalsmith-build-date'),
	changed       = require('metalsmith-changed'),
	collections   = require('metalsmith-collections'),
	dateFormatter = require('metalsmith-date-formatter'),
	feed          = require('metalsmith-feed'),
	humanize      = require('humanize-number'),
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
	.option('s', {
		alias: 'static',
		type: 'boolean',
		description: 'only process static files'
	})
	.argv;

if (argv.static)
{
	new Metalsmith('.')
		.clean(false)
		.use(static({
			'src': 'static',
			'dest': '.'
		}))
		.build(function(err)
		{
			console.log('static files moved in ' + Math.round((Date.now() - start) / 1000) + 's');
			if (err) throw err;
			process.exit(0);
		});
}

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
	.use(sitetitle({ separator: ' :: ' }))
	.use(buildDate())
	.use(sass({outputStyle: 'expanded'}))
	.use(markdownit({
		typographer: true,
		html: true
	}))
	.use(wordcount())
	.use(dupePubDate)
	.use(dateFormatter({
		dates: [{ key: 'published', format: 'YYYY/MM/DD' }]
	}))
	.use(archive({
		dateFields: ['publishedRaw'],
		collections: ['who', 'thick', 'rpf', 'hour', 'btvs', 'holmes']
	}))
	.use(totalWords)
	.use(autotoc({selector: 'h2, h3, h4'}))
	.use(collections({
		recent: {
			pattern: '*/*.html',
			sortBy: 'published',
			reverse: true,
			limit: 15,
			refer: false
		},
		all: {
			pattern: '*/*.html',
			sortBy: 'published',
			reverse: true,
			refer: false
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
	.use(beautify())
	.use(static({
		'src': 'static',
		'dest': '.'
	}));

function emitTags(files, ms, done)
{
	var metadata = metalsmith.metadata();
	console.log(JSON.stringify(Object.keys(metadata.tags).sort()));
	done();
}

function dupePubDate(files, ms, done)
{
	var metadata = metalsmith.metadata();
	var total = 0;
	var fnames = Object.keys(files);
	fnames.forEach(function(f)
	{
		var story = files[f];
		if (story.published)
		{
			story.publishedRaw = story.published;
		}
	});

	done();
}

function totalWords(files, ms, done)
{
	var metadata = metalsmith.metadata();
	var total = 0;
	var fnames = Object.keys(files);
	fnames.forEach(function(f)
	{
		total += parseInt(files[f].wordCount || 0, 10);
	});
	metadata.storycount = fnames.length - 6; // magic number
	metadata.wordcount = humanize(total);

	var archive = metadata.archive;
	archive.forEach(function(year)
	{
		year.wordcount = 0;
		year.data.forEach(function(s)
		{
			year.wordcount += parseInt(s.wordCount || 0, 10);
		});
		year.wordcount = humanize(year.wordcount);
	});

	done();
}

if (!argv.static && !argv.year)
{
	metalsmith.build(function(err)
	{
		console.log('site built in ' + Math.round((Date.now() - start) / 1000) + 's');
		if (err) throw err;
	});
}
