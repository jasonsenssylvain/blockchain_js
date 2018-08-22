const assert    = require('assert');

const Block     = require( __dirname + "/../src/block.js");
const BlockChain     = require( __dirname + "/../src/blockchain.js");

describe('BlockChain', function () {
  describe('#NewBlockChain()', function () {
    it('should create a new block', function () {
      let bc = BlockChain.NewBlockChain();
      bc.addBlock(`Send 1 BTC to a friend`);
      bc.addBlock(`Send 1 BTC to another friend`);

      console.log(bc);

      let iterator = bc.getBlockIterator();
      while(iterator.hasNext()) {
        let prev = iterator.next();
        console.log(prev);
      }
    });
  });
});
