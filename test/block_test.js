const Block     = require( __dirname + "/../src/block.js");

const Hashes    = require('jshashes');
const assert    = require('assert');

describe('Block', function () {
  describe('#NewBlock()', function () {
    it('should create a new block', function () {
      let data = "first block";

      let prevHash = new Hashes.SHA256().hex('pretend first block');
      console.log(`prevHash: ${prevHash}`);

      let newBlock = Block.NewBlock(data, prevHash);

      console.log(newBlock);
    });
  });
});

      
