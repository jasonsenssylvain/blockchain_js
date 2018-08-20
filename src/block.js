const Hashes    = require('jshashes');

const POW       = require('./pow.js')

class Block {

  static NewBlock(data, prevBlockHash) {
    let block = new Block(Date.now(), data, prevBlockHash);
    let pow = POW.NewProofOfWork(block);
    let powResult = pow.run();
    block.hash = powResult.hash;
    block.nonce = powResult.nonce;
    // block.setHash();
    return block;
  }

  constructor(timestamp, data, prevBlockHash, hash) {
    this.timestamp = timestamp;
    this.data = data;
    this.prevBlockHash = prevBlockHash;
    this.hash = hash;
    this.nonce = 0;
  }

  // 在part2里面，就可以直接移除掉这个函数了
  // setHash() {
  //   let hash = "" + this.prevBlockHash + this.data + this.timestamp;
  //   this.hash = new Hashes.SHA256().hex(hash);
  // }

  toString() {
    return JSON.stringify(
      this
    );
  }

  static fromString(data) {
    let payload = JSON.parse(data);
    let block = new Block(payload.timestamp, payload.data, payload.prevBlockHash, payload.hash, payload.nonce);
    return block;
  }
}

module.exports = Block;