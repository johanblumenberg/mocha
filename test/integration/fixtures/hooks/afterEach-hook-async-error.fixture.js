'use strict';

describe('spec 1', function () {
  afterEach(function (done) {
    console.log('after');
    process.nextTick(function () {
      throw new Error('after each hook error');
    });
  });
  it('should be called because error is in after each hook', function () {
    console.log('test 1');
  });
  it('should not be called', function () {
    console.log('test 2');
  });
});
describe('spec 2', function () {
  it('should be called, because hook error was in a sibling suite', function () {
    console.log('test 3');
  });
});
describe('spec 3', function () {
  afterEach(function (done) {
    console.log('after each 1');
    process.nextTick(function () {
      throw new Error('after each hook error');
    });
  });
  afterEach(function (done) {
    console.log('after each 2');
    done();
  });
  it('should call all after each hooks also if one fails', function () {
    console.log('test 4');
  });
});
