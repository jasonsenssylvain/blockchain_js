const Wallets     = require( __dirname + "/../src/wallet.js").Wallets;

const assert      = require('assert');

describe('Wallets', function () {
  describe('#newWallets()', function () {
    it('should create new wallets', function () {
      let wallets = Wallets.newWallets();
      let addr = wallets.createWallet();
      wallets.save();
    });
  });
});

      
