const POW       = require( __dirname + "/../src/pow.js");
const Block     = require( __dirname + "/../src/block.js");

const Hashes    = require('jshashes');
const assert    = require('assert');
const BigInteger = require('bigi');

describe('POW', function () {
  describe('#NewProofOfWork()', function () {
    it('should create a new pow', function () {
      let data = "first block";

      let prevHash = new Hashes.SHA256().hex('pretend first block');

      let newBlock = Block.NewBlock(data, prevHash);

      let pow = POW.NewProofOfWork(newBlock);
      console.log('finish pow');

    });

    it('compare target', function () {
      let data1 = 'I like donuts';
      let data2 = 'I like donutsca07ca';
      let targetBits = 24;
      let target = BigInteger.fromHex("01");
      target = target.shiftLeft(256 - POW.trgetBits);
      console.log(new Hashes.SHA256().hex(data1));
      console.log(target.toHex());
      console.log(new Hashes.SHA256().hex(data2));
    });
  });
});

      
