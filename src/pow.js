const BigInteger = require('bigi');
const Hashes    = require('jshashes');

class POW {
  constructor(block, target) {
    this.block = block;
    this.target = target;
  }

  static NewProofOfWork(block) {
    let target = BigInteger.fromHex("01");
    target = target.shiftLeft(256 - POW.trgetBits);
    let pow = new POW(block, target);
    return pow;
  }

  prepareData(nonce) {
    return this.block.prevBlockHash + "" 
    + this.block.data + "" 
    + this.block.timestamp + "" 
    + POW.trgetBits + "" 
    + nonce;
  }

  run() {
    let hashInt;
    let hash;

    let nonce = 0;
    let sha256 = new Hashes.SHA256();
    console.log(`Mining the block: ${this.block.data}`);

    while(nonce < POW.maxNonce) {
      let data = this.prepareData(nonce);
      hash = sha256.hex(data);
      hashInt = BigInteger.fromHex(hash);
      if (hashInt.compareTo(this.target) < 0) {
        console.log(`Mining end! hash: ${hash}`)
        break;
      } else {
        nonce ++;
      }
    }
    return {nonce: nonce, hash:hash};
  }

  validate() {
    let hashInt;
    let data = this.prepareData(this.block.nonce);
    let hash = new Hashes.SHA256().hex(data);
    return hashInt.compareTo(this.target) < 0 ;
  }
}

POW.trgetBits = 8;  //测试下来，如果为8很快就出块了。
POW.maxNonce = Number.MAX_SAFE_INTEGER;

module.exports = POW;