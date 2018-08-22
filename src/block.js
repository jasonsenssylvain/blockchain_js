const Hashes    = require('jshashes');

const POW       = require('./pow.js')
const {Transaction} = require('./transaction.js');

class Block {

  static NewBlock(transactions, prevBlockHash) {
    let block = new Block(Date.now(), transactions, prevBlockHash);
    let pow = POW.NewProofOfWork(block);
    let powResult = pow.run();
    block.hash = powResult.hash;
    block.nonce = powResult.nonce;
    // block.setHash();
    return block;
  }

  constructor(timestamp, transactions, prevBlockHash, hash) {
    this.timestamp = timestamp;
    this.transactions = transactions;
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
    let block = new Block(payload.timestamp, payload.transactions, payload.prevBlockHash, payload.hash, payload.nonce);
    let txs = Transaction.TxsFromString(payload.transactions);
    block.transactions = txs;
    return block;
  }

  hashTransaction() {
    let txHashes = "";
    for (let i = 0; i < this.transactions.length; i++) {
      txHashes += JSON.stringify(this.transactions[i]);
    }

    let sha256 = new Hashes.SHA256();
    let hash = sha256.hex(txHashes);
    return hash;
  }
}

module.exports = Block;