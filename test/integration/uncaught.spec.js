'use strict';

var assert = require('assert');
var run = require('./helpers').runMochaJSON;
var args = [];

describe('uncaught exceptions', function() {
  it('handles uncaught exceptions from hooks', function(done) {
    run('uncaught-hook.fixture.js', args, function(err, res) {
      if (err) {
        done(err);
        return;
      }
      assert.equal(res.stats.pending, 0);
      assert.equal(res.stats.passes, 0);
      assert.equal(res.stats.failures, 1);

      assert.equal(
        res.failures[0].fullTitle,
        'uncaught "before each" hook for "test"'
      );
      assert.equal(res.code, 1);
      done();
    });
  });

  it('handles uncaught exceptions from async specs', function(done) {
    run('uncaught.fixture.js', args, function(err, res) {
      if (err) {
        done(err);
        return;
      }
      assert.equal(res.stats.pending, 0);
      assert.equal(res.stats.passes, 0);
      assert.equal(res.stats.failures, 3);

      assert.equal(
        res.failures[0].title,
        'fails exactly once when a global error is thrown first'
      );
      assert.equal(
        res.failures[1].title,
        'fails exactly once when a global error is thrown second'
      );
      assert.equal(
        res.failures[2].title,
        'fails exactly once when a promise rejection is not handled'
      );
      assert.equal(res.code, 3);
      done();
    });
  });
});
