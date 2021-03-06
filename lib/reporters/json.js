'use strict';
/**
 * @module JSON
 */
/**
 * Module dependencies.
 */

var Base = require('./base');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

/**
 * Expose `JSON`.
 */

exports = module.exports = JSONReporter;

/**
 * Initialize a new `JSON` reporter.
 *
 * @public
 * @class JSON
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @api public
 * @param {Runner} runner
 */
function JSONReporter(runner, options) {
  Base.call(this, runner);

  var self = this;
  var tests = [];
  var pending = [];
  var failures = [];
  var passes = [];

  if (options && options.reporterOptions) {
    if (options.reporterOptions.output) {
      if (!fs.createWriteStream) {
        throw new Error('file output not supported in browser');
      }

      mkdirp.sync(path.dirname(options.reporterOptions.output));
      self.fileStream = fs.createWriteStream(options.reporterOptions.output);
    }
  }

  function write(line) {
    if (self.fileStream) {
      self.fileStream.write(line + '\n');
    } else if (typeof process === 'object' && process.stdout) {
      process.stdout.write(line + '\n');
    } else {
      console.log(line);
    }
  }

  runner.on('test end', function(test) {
    tests.push(test);
  });

  runner.on('pass', function(test) {
    passes.push(test);
  });

  runner.on('fail', function(test) {
    failures.push(test);
  });

  runner.on('pending', function(test) {
    pending.push(test);
  });

  runner.once('end', function() {
    var obj = {
      stats: self.stats,
      tests: tests.map(clean),
      pending: pending.map(clean),
      failures: failures.map(clean),
      passes: passes.map(clean)
    };

    runner.testResults = obj;

    var repeat = options && options.repeat;

    if (repeat) {
      if (repeat.current === 0) {
        write('[\n');
      } else {
        write(',\n');
      }
    }

    write(JSON.stringify(obj, null, 2));

    if (repeat) {
      if (
        repeat.current === repeat.total - 1 ||
        (obj.failures.length > 0 && runner.suite.bail())
      ) {
        write('\n]\n');
      }
    }
  });
}

/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @api private
 * @param {Object} test
 * @return {Object}
 */
function clean(test) {
  var err = test.err || {};
  if (err instanceof Error) {
    err = errorJSON(err);
  }

  return {
    title: test.title,
    fullTitle: test.fullTitle(),
    duration: test.duration,
    currentRetry: test.currentRetry(),
    err: cleanCycles(err)
  };
}

/**
 * Replaces any circular references inside `obj` with '[object Object]'
 *
 * @api private
 * @param {Object} obj
 * @return {Object}
 */
function cleanCycles(obj) {
  var cache = [];
  return JSON.parse(
    JSON.stringify(obj, function(key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Instead of going in a circle, we'll print [object Object]
          return '' + value;
        }
        cache.push(value);
      }

      return value;
    })
  );
}

/**
 * Transform an Error object into a JSON object.
 *
 * @api private
 * @param {Error} err
 * @return {Object}
 */
function errorJSON(err) {
  var res = {};
  Object.getOwnPropertyNames(err).forEach(function(key) {
    res[key] = err[key];
  }, err);
  return res;
}
