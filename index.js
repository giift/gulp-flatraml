/*jshint node:true,strict:true,undef:true,unused:true*/
'use strict';

let flatten = require('flat-raml');
let through2 = require('through2');
let gutil = require('gulp-util');
let util = require('util');
let path = require('path');

const PLUGIN_NAME = 'gulp-flatraml';

let PluginError = gutil.PluginError;
let File = gutil.File;

function flattenRaml(filename, source, callback) {
  var cwd = process.cwd();
  var nwd = path.resolve(path.dirname(filename));
  process.chdir(nwd);
  flatten.asString(filename)
    .then((newRaml) => {
      process.chdir(cwd);
      process.nextTick(function () {
        callback(null, newRaml);
      });
    })
    .catch((ramlError) => {
      process.chdir(cwd);
      process.nextTick(function () {
        var mark = ramlError.problem_mark;
        mark = mark ? ':' + (mark.line + 1) + ':' + (mark.column + 1) : '';
        var context = ('' + [ramlError.context]).trim();
        context = context ? ' ' + context : '';
        var message = util.format('%s%s: Parse error%s: %s', filename, mark, context, ramlError.message);
        callback(new Error(message));
      });
    });
}

function convertFile(file, source, self, callback) {
  flattenRaml(file.path, source, function (error, flatRaml) {
    if (error) {
      self.emit('error', new PluginError(PLUGIN_NAME, error));
    } else {
      var flatFile = new File({
        base: file.base,
        cwd: file.cwd,
        path: gutil.replaceExtension(file.path, '.raml'),
        contents: new Buffer(flatRaml)
      });
      self.push(flatFile);
    }
    callback();
  });
}

function parseJSON(buffer) {
  try {
    return JSON.parse('' + buffer);
  } catch (error) {
    return undefined;
  }
}

function gulpFlatRaml(options) {
  options = options || {};
  var supportJsonInput = !!options.supportJsonInput;

  return through2.obj(function (file, enc, callback) {

    if (file.isNull()) {
      // do nothing if no contents
    } else if (file.isBuffer()) {
      if (file.contents.slice(0, 11).toString('binary') === '#%RAML 0.8\n' ||
        file.contents.slice(0, 12).toString('binary') === '#%RAML 0.8\r\n') {
        return convertFile(file, file.contents, this, callback); // got RAML signature
      } else if (supportJsonInput) {
        var json = parseJSON(file.contents);
        if (json) {
          return convertFile(file, json, this, callback); // valid JSON
        }
      }
    } else if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
    }

    this.push(file);
    return callback();
  });
}

module.exports = gulpFlatRaml;