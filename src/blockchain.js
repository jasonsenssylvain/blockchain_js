const Block       = require('./block.js');

class BlockChain {

  static NewBlockChain() {
    let bc = new BlockChain();
    bc.blocks.push(bc.newGenesisBlock());
    return bc;
  }

  constructor() {
    this.blocks = new Array();
  }

  addBlock(data) {
    let prevBlock = this.blocks[this.blocks.length - 1];
    let newBlock = Block.NewBlock(data, prevBlock.hash);
    this.blocks.push(newBlock);
  }

  newGenesisBlock() {
    return Block.NewBlock(`Genesis Block`, ``);
  }
}

module.exports = BlockChain;