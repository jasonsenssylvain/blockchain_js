const InCache     = require('incache');
const Block       = require('./block.js');

class BlockChain {

  static NewBlockChain() {
    // get db instance
    let store = new InCache({
      storeName: "blockchain",
      autoSave: true,
      autoSaveMode: "timer"
    });

    let bc;
    
    // check db
    let lastHash = store.get('l');
    if (!lastHash) {
      bc = new BlockChain();
      let block = bc.newGenesisBlock();

      store.set(block.hash, block.toString());
      store.set('l', block.hash);
      lastHash = block.hash;
    } else 
      bc = new BlockChain();
    bc.db = store;
    bc.tip = lastHash;

    return bc;
  }

  constructor() {
    // remove from part3, we dont have to keep the array anymore
    // this.blocks = new Array();

  }

  addBlock(data) {

    // modify in part3 
    // let prevBlock = this.blocks[this.blocks.length - 1];
    // let newBlock = Block.NewBlock(data, prevBlock.hash);
    // this.blocks.push(newBlock);

    // save to db
    let lastHash = this.tip;
    let newBlock = Block.NewBlock(data, lastHash);
    this.db.set(newBlock.hash, newBlock.toString());
    this.tip = newBlock.hash;
  }

  newGenesisBlock() {
    return Block.NewBlock(`Genesis Block`, ``);
  }

  getBlockIterator() {
    return new BlockChainIterator(this);
  }
}

class BlockChainIterator {
  constructor(bc) {
    this.blockchain = bc;
    this.tip = this.blockchain.tip;
  }

  curr() {
    let data = this.blockchain.db.get(this.tip);
    let block = Block.fromString(data);
    this.tip = block.hash;
    return block;
  }

  prevBlock() {
    let block = this.curr();
    this.tip = block.prevBlockHash;
    if (!this.tip)
      return null;
    return this.curr();
  }
}

module.exports = BlockChain;