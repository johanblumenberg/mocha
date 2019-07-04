# @johanblumenberg/mocha

Fork of [mocha](https://www.npmjs.com/package/mocha), which will be kept until the following PRs are accepted, or similar functionality is added to mocha:

- [Ensure all after hooks are executed, even if one of them fail](https://github.com/mochajs/mocha/pull/3281)
- [Support for nested options in reporterOptions](https://github.com/mochajs/mocha/pull/3487)
- Listen to events (see commit [11d96ba5](https://github.com/johanblumenberg/mocha/commit/11d96ba51d281bdaff793bcab8add0f9b5a15cb9))
- Run after hooks after failing when using `--bail` (see commit [0bfde243](https://github.com/johanblumenberg/mocha/commit/0bfde2437adc4e07468145468b2edabc8483c436))
- Run after hooks on Ctrl-C (see commit [8de7ba16](https://github.com/johanblumenberg/mocha/commit/8de7ba1653c1d4b29c0da5064372047a2838cc32))
- Support for `--repeat` option (see commit [d48474eb](https://github.com/johanblumenberg/mocha/commit/d48474ebc1b8a6d12ff8ca521935659fe11ee8c0))
- Support for `wtfnode`, to log leaked resources (see commit [f160a66c](https://github.com/johanblumenberg/mocha/commit/f160a66cfe259923241e255da537b3332f4dc257))
- Split in buckets, for parallel runs (see commit [ffe8ce7c](https://github.com/johanblumenberg/mocha/commit/ffe8ce7c806b83f77108bd5241bc2d539bd4f6d5))
- Handle unhandled rejections the same as uncaught exceptions (see commit [a59c3a81](https://github.com/johanblumenberg/mocha/commit/a59c3a817fef020431bd1ed570c4d95eb36f85c5))
- Support for async event listeners (using @johanblumenberg/EventEmitterAsync)

## Purpose

The focus of this fork is hardening of `mocha`, to make it robust enough to run in a CI environment.

If tests are aquiring external resources, it is important that those resources are always released after the test is done. This fork is making sure that all after hooks are always run, regardless of how `mocha` is terminated, and regardless if tests are failing or not.

There are also a few commits that improve troubleshooting in such environments.

## Added functionality in this fork

### Listen to events

It can be useful for a test to be able to know when a test starts, fails, passes, and so on.
The same events that are exposed to reporters are also exposed to tests to listen for.

Example:

```js
describe('test a web page', function () {
    var webdriver;

    before(function() {
        webdriver = ... // Set up a webdriver pointing to my web paage

        this.events.on('test', function (test) {
            webdriver.log('Starting test ' + test.fullTitle());
        });

        this.events.on('test end', function (test) {
            webdriver.log('Passing test ' + test.fullTitle());
        });

        this.events.on('fail', (test, err) => {
            webdriver.log('Failing test ' + test.fullTitle());

            let logs = webdriver.getLogs();
            console.log(logs);
        });
    });
});
```

This simple example is testing a web page using webdriver.
When a test starts and ends, a message is logged to the browser console, to make it easier to correlate the browser console log with the tests that are run. When a test fails, the browser console log is collected and logged to the test console.

### `--cleanup-after <ms>` option

The default behaviour is to kill the mocha process immediately when receiving SIGINT or SIGTERM. Adding `--cleanup-after` will make mocha abort the current test, run all after hooks, and then terminate.

It is useful to have all after hooks run before exiting, for example if there are after hooks that are releasing up external resources, that would otherwise leak when pressing Ctrl-C.

The argument to `--cleanup-after` is a timeout in milliseconds, after which the `mocha` process will be forcefully terminated if the after hooks still have not completed.

### `--repeat <n>` option

Used to repeat the test suite a number of times.

This is useful to catch hard to reproduce errors, together with the `--bail` option.

### `--leak-timeout <ms>` option

If there are leaked resources after the last test completes, such as timers or child processes, the `mocha` process might not terminate. This option sets the timeout value, in millisecond from when the last test completes, for when to forcefully terminate the `mocha` process.

The default value is 60s.

### `--bucket <m>:<n>` option

This option is for running tests in parallel, possibly on separate machines. This option will split the test suite in `<n>` buckets, and run the tests in bucket `#<m>`.

To spread out the tests over 3 mahines, and run a third of the tests on each machine, run the same command on each machine, but add the `--bucket` option:

```bash
# On machine 1
$ mocha spec/**/*.js --bucket 1:3

# On machine 2
$ mocha spec/**/*.js --bucket 2:3

# On machine 3
$ mocha spec/**/*.js --bucket 3:3
```
