'use strict';
/**
 * @module XUnit
 */
/**
 * Module dependencies.
 */

var Base = require('./base');
var utils = require('../utils');
var inherits = utils.inherits;
var fs = require('fs');
var escape = utils.escape;
var mkdirp = require('mkdirp');
var path = require('path');
var StdioWrapper = require('../stdio');
var stdio = new StdioWrapper();

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */

/* eslint-disable no-unused-vars, no-native-reassign */
var Date = global.Date;
var setTimeout = global.setTimeout;
var setInterval = global.setInterval;
var clearTimeout = global.clearTimeout;
var clearInterval = global.clearInterval;
/* eslint-enable no-unused-vars, no-native-reassign */

/**
 * Expose `XUnit`.
 */

exports = module.exports = XUnit;

/**
 * Initialize a new `XUnit` reporter.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @api public
 * @param {Runner} runner
 */
function XUnit(runner, options) {
  Base.call(this, runner);

  var stats = this.stats;
  var tests = [];
  var self = this;

  // the name of the test suite, as it will appear in the resulting XML file
  var suiteName;

  // the default name of the test suite if none is provided
  var DEFAULT_SUITE_NAME = 'Mocha Tests';

  var stdout;
  var stderr;
  var hookStdout;
  var hookStderr;

  function onStdout(data) {
    if (stdout) {
      stdout.push(data);
    }
    if (hookStdout) {
      hookStdout.push(data);
    }
  }

  function onStderr(data) {
    if (stderr) {
      stderr.push(data);
    }
    if (hookStderr) {
      hookStderr.push(data);
    }
  }

  if (options && options.reporterOptions) {
    if (options.reporterOptions.output) {
      if (!fs.createWriteStream) {
        throw new Error('file output not supported in browser');
      }

      mkdirp.sync(path.dirname(options.reporterOptions.output));
      self.fileStream = fs.createWriteStream(options.reporterOptions.output);
    }

    // get the suite name from the reporter options (if provided)
    suiteName = options.reporterOptions.suiteName;
  }

  // fall back to the default suite name
  suiteName = suiteName || DEFAULT_SUITE_NAME;

  runner.on('start', function() {
    stdio.on(onStdout, onStderr);
  });

  runner.on('test', function(test) {
    stdout = [];
    stderr = [];
  });

  runner.on('test end', function(test) {
    test.stdout = stdout;
    test.stderr = stderr;
    stdout = undefined;
    stderr = undefined;
  });

  runner.on('hook', function(hook) {
    hookStdout = [];
    hookStderr = [];
  });

  runner.on('hook end', function(hook) {
    hook.stdout = stdout || hookStdout;
    hook.stderr = stderr || hookStderr;
    hookStdout = undefined;
    hookStderr = undefined;
  });

  runner.on('pending', function(test) {
    tests.push(test);
  });

  runner.on('pass', function(test) {
    tests.push(test);
  });

  runner.on('fail', function(test) {
    tests.push(test);
  });

  runner.once('end', function() {
    stdio.off(onStdout, onStderr);

    self.write(
      tag(
        'testsuite',
        {
          name: suiteName,
          tests: stats.tests,
          failures: stats.failures,
          errors: stats.failures,
          skipped: stats.tests - stats.failures - stats.passes,
          timestamp: new Date().toUTCString(),
          time: stats.duration / 1000 || 0
        },
        false
      )
    );

    tests.forEach(function(t) {
      self.test(t);
    });

    self.write('</testsuite>');
  });
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(XUnit, Base);

/**
 * Override done to close the stream (if it's a file).
 *
 * @param failures
 * @param {Function} fn
 */
XUnit.prototype.done = function(failures, fn) {
  if (this.fileStream) {
    this.fileStream.end(function() {
      fn(failures);
    });
  } else {
    fn(failures);
  }
};

/**
 * Write out the given line.
 *
 * @param {string} line
 */
XUnit.prototype.write = function(line) {
  if (this.fileStream) {
    this.fileStream.write(line + '\n');
  } else if (typeof process === 'object' && process.stdout) {
    process.stdout.write(line + '\n');
  } else {
    console.log(line);
  }
};

/**
 * Output tag for the given `test.`
 *
 * @param {Test} test
 */
XUnit.prototype.test = function(test) {
  var attrs = {
    classname: test.parent.fullTitle().replace(/\./g, '\uff0e'),
    name: test.title,
    time: test.duration / 1000 || 0
  };

  if (test.state === 'failed') {
    var err = test.err;
    this.write(tag('testcase', attrs, false));
    this.write(
      tag('failure', {}, false, escape(err.message) + '\n' + escape(err.stack))
    );
    this.write(
      tag('system-out', {}, false, escape((test.stdout || []).join('\n')))
    );
    this.write(
      tag('system-err', {}, false, escape((test.stderr || []).join('\n')))
    );
    this.write('</testcase>');
  } else if (test.isPending()) {
    this.write(tag('testcase', attrs, false, tag('skipped', {}, true)));
  } else {
    this.write(tag('testcase', attrs, true));
  }
};

/**
 * HTML tag helper.
 *
 * @param name
 * @param attrs
 * @param close
 * @param content
 * @return {string}
 */
function tag(name, attrs, close, content) {
  var end = close ? '/>' : '>';
  var pairs = [];
  var tag;

  for (var key in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, key)) {
      pairs.push(key + '="' + escape(attrs[key]) + '"');
    }
  }

  tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
  if (content !== undefined) {
    tag += content + '</' + name + end;
  }
  return tag;
}
