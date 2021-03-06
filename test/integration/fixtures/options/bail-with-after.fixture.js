'use strict';

describe('outer', function () {
  describe('inner', function () {
    afterEach(function () {
      console.log('inner afterEach hook 1 should be displayed');
    });
  
    afterEach(function () {
      console.log('inner afterEach hook 2 should be displayed');
    });
  
    after(function () {
      console.log('inner after hook 1 should be displayed');
    });
  
    after(function () {
      console.log('inner after hook 2 should be displayed');
    });
  
    it('this test should fail', function () {
      throw new Error('test error should be displayed');
    });
  });

  afterEach(function () {
    console.log('outer afterEach hook 1 should be displayed');
  });

  afterEach(function () {
    console.log('outer afterEach hook 2 should be displayed');
  });

  after(function () {
    console.log('outer after hook 1 should be displayed');
  });

  after(function () {
    console.log('outer after hook 2 should be displayed');
  });
});
