const Hashes    = require('jshashes');

const POW       = require('./pow.js')
const Transaction = require('./transaction.js').Transaction;

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

  toJSON() {
    let obj = {};
    obj.timestamp = this.timestamp;
    obj.prevBlockHash = this.prevBlockHash;
    obj.hash = this.hash;
    obj.nonce = this.nonce;

    let txs = [];
    for (let i in this.transactions) {
      txs.push(this.transactions[i].toJSON());
    }
    obj.transactions = txs;
    return obj;
  }

  toString() {
    return JSON.stringify(
      this.toJSON()
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
    return Transaction.hashTransaction(this.transactions);
  }
}

module.exports = Block;