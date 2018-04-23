const Hashes    = require('jshashes');

class Block {

  static NewBlock(data, prevBlockHash) {
    let block = new Block(Date.now(), data, prevBlockHash);
    block.setHash();
    return block;
  }

  constructor(timestamp, data, prevBlockHash, hash) {
    this.timestamp = timestamp;
    this.data = data;
    this.prevBlockHash = prevBlockHash;
    this.hash = hash;
  }

  setHash() {
    let hash = "" + this.prevBlockHash + this.data + this.timestamp;
    this.hash = new Hashes.SHA256().hex(hash);
  }
}

module.exports = Block;