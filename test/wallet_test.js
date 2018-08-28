const Wallet     = require( __dirname + "/../src/wallet.js").Wallet;

const assert    = require('assert');

describe('Wallet', function () {
  describe('#validAddress()', function () {
    it('should valid address', function () {
      let addr = "16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS";
      let result = Wallet.validAddress(addr);
      assert.equal(result, true);
    });
  });
});

      
