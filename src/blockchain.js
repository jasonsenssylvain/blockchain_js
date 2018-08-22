const InCache       = require('incache');
const Block         = require('./block.js');
const {Transaction} = require('./transaction.js');

const genesisCoinbaseData = "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks";

class BlockChain {

  static NewBlockChain(address) {
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
      let tx = Transaction.NewCoinbaseTX(address, genesisCoinbaseData);
      let block = bc.newGenesisBlock(tx);

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
    this.db.set('l', newBlock.hash);
    this.tip = newBlock.hash;
  }

  newGenesisBlock(tx) {
    return Block.NewBlock([tx], ``);
  }

  getBlockIterator() {
    return new BlockChainIterator(this);
  }

  findUnspentTransactions(address) {
    let unspentTXs = [];

    let spentTXOs = {};

    let iterator = this.getBlockIterator();
    while(iterator.hasNext()) {
      let block = iterator.next();

      for (let i = 0; i < block.transactions.length; i++) {
        let tx = block.transactions[i];
        let txId = tx.id;

        for (let outIdx = 0; outIdx < tx.vOut.length; outIdx++) {

          // 如果被花费掉了
          let needToBreak = false;

          // 任何tx，只要有输入，都会被放在spentTXOs里。在稍下面代码里。这里要判断是否已经花费
          if (spentTXOs[txId] != null && spentTXOs[txId] != undefined) {
            for (let j = 0; j < spentTXOs[txId].length; j++) {
              if (spentTXOs[txId][j] == outIdx) {
                needToBreak = true;
                break;
              }
            }
          }

          if (needToBreak) {
            continue;
          }

          let out = tx.vOut[outIdx];
          if (out.canBeUnlockedWith(address)) {
            unspentTXs.push(tx);
          }
        }

        if (tx.isCoinbase() == false) {
          for (let k = 0; k < tx.vIn.length; k ++) {
            let vIn = tx.vIn[k];
            if (vIn.canUnlockOutputWith(address)) {
              let vInId = vIn.txId;
              if (!spentTXOs[vInId]) {
                spentTXOs[vInId] = [];
              }
              spentTXOs[vInId].push(vIn.vOut);
            }
          }
        }
      }
    }

    return unspentTXs;
  }

  findUTXO(address) {
    let UTXOs = [];
    let txs = this.findUnspentTransactions(address);

    for (let i = 0; i < txs.length; i ++) {
      for (let j = 0; j < txs[i].vOut.length; j ++) {
        if (txs[i].vOut[j].canBeUnlockedWith(address)) {
          UTXOs.push(txs[i].vOut[j]);
        }
      }
    }
    return UTXOs;
  }

  findSpendableOutputs(address, amount) {
    let unspentOutputs = {};
    let unspentTxs = this.findUnspentTransactions(address);
    let accumulated = 0;

    for (let key in unspentTxs) {
      let tx = unspentTxs[key];
      let txId = tx.id;

      let needBreak = false;
      for (let outIdx = 0; outIdx < tx.vOut.length; outIdx ++) {
        let output = tx.vOut[outIdx];
        if (output.canBeUnlockedWith(address) && accumulated < amount) {
          accumulated += output.value;
          if (!unspentOutputs[txId]) 
            unspentOutputs[txId] = [];
          unspentOutputs[txId].push(outIdx);
          if (accumulated >= amount) {
            needBreak = true;
            break;
          }
        }
      }

      if (needBreak)
        break;
    }

    return {
      amount: accumulated,
      unspentOutputs: unspentOutputs
    };
  }

  mineBlock(txs) {
    let lastHash = this.db.get('l');
    let newBlock = Block.NewBlock(txs, lastHash);
    this.db.set(newBlock.hash, newBlock.toString());
    this.db.set('l', newBlock.hash);
    this.tip = newBlock.hash;
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
    return block;
  }

  next() {
    let block = this.curr();
    this.tip = block.prevBlockHash;
    return block;
  }

  hasNext() {
    if (!this.tip || this.tip == '')
      return false;
    return true;
  }
}

module.exports = BlockChain;