#!/usr/bin/env node

var
	_      = require('lodash'),
	Async  = require('async'),
	glob   = require('glob'),
	fs     = require('fs'),
	path   = require('path'),
	yaml   = require('js-yaml')
	;

function findNewerFiles(directory, lastmod, callback)
{
	var globpatt = path.join(directory, '**', '*.json');

	function filterFile(f, cb)
	{
		fs.stat(f, function(err, stat)
		{
			if (err) return cb(err);
			if (stat.mtime > lastmod) return cb(null, f);
			cb();
		});
	}

	glob(globpatt, {}, function(err, files)
	{
		if (err) return callback(err);
		if (!lastmod) return callback(null, files);

		var actions = _.map(files, function(f)
		{
			return function(cb) { filterFile(f, cb); };
		});

		Async.parallelLimit(actions, 100, function(err, results)
		{
			if (err) return callback(err);
			var final = _.filter(results, function(f) { if (f) return f; });
			callback(null, final);
		});
	});
}

function parseAll(files, callback)
{
	var actions = _.map(files, function(f)
	{
		return function(cb) { loadFile(f, cb); };
	});

	Async.parallelLimit(actions, 100, function(err, nested)
	{
		if (err) return callback(err);
		callback(null, _.flatten(nested));
	});
}

function loadFile(fpath, callback)
{
	fs.readFile(fpath, 'utf8', function(err, data)
	{
		if (err) return callback(err);
		var parsed = JSON.parse(data);
		callback(null, parsed);
	});
}

var outdir = __dirname + '/../markdown';

findNewerFiles(__dirname + '/../json', null, function(err, files)
{
	if (err) throw err;
	parseAll(files, function(err, results)
	{
		if (err) throw err;

		_.each(results, function(story)
		{
			console.log(story.title);
			var content = story.content;
			delete story.content;

			var output = '---\n';
			output += yaml.dump(story);
			output += '---\n';
			output += content;

			fs.writeFile(path.join(outdir, story.idtag) + '.md', output, 'utf8', function(err)
			{
				if (err) console.error(story.idtag, err.message);
			});
		});

	});
});
