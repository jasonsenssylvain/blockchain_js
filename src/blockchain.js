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

  // 根据id，依次查询所有block里面的transaction
  findTransaction(id) {
    let iterator = this.getBlockIterator();
    while(iterator.hasNext()) {
      let prev = iterator.next();
      for (let i in prev.transactions) {
        let tx = prev.transactions[i];
        if (tx.id === id) {
          return tx;
        }
      }
    }
    return null;
  }

  signTransaction(transaction, walletPrivateKey) {
    let prevTXs = {};
    for (let i in transaction.vIn) {
      let prevTX = this.findTransaction(transaction.vIn[i].txId);
      prevTXs[prevTX.id] = prevTX;
    }
    transaction.sign(walletPrivateKey, prevTXs);
  }

  verifyTransaction(transaction) {
    let prevTXs = {};
    for (let i in transaction.vIn) {
      let prevTX = this.findTransaction(transaction.vIn[i].txId);
      prevTXs[prevTX.id] = prevTX;
    }
    return transaction.verify(prevTXs);
  }

  // in PART5: change address to pubKeyHash
  findUnspentTransactions(pubKeyHash) {
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
          // change in PART5
          if (out.isLockedWithKey(pubKeyHash)) {
            unspentTXs.push(tx);
          }
        }

        if (tx.isCoinbase() == false) {
          for (let k = 0; k < tx.vIn.length; k ++) {
            let vIn = tx.vIn[k];
            // change in PART5
            if (vIn.usersKey(pubKeyHash)) {
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

  // change IN PART5
  findUTXO(pubKeyHash) {
    let UTXOs = [];
    let txs = this.findUnspentTransactions(pubKeyHash);

    for (let i = 0; i < txs.length; i ++) {
      for (let j = 0; j < txs[i].vOut.length; j ++) {
        if (txs[i].vOut[j].isLockedWithKey(pubKeyHash)) {
          UTXOs.push(txs[i].vOut[j]);
        }
      }
    }
    return UTXOs;
  }

  findSpendableOutputs(pubKeyHash, amount) {
    let unspentOutputs = {};
    let unspentTxs = this.findUnspentTransactions(pubKeyHash);
    let accumulated = 0;

    for (let key in unspentTxs) {
      let tx = unspentTxs[key];

      // 最终，unspentOutputs的id是 tx.id
      let txId = tx.id;

      let needBreak = false;
      for (let outIdx = 0; outIdx < tx.vOut.length; outIdx ++) {
        let output = tx.vOut[outIdx];
        if (output.isLockedWithKey(pubKeyHash) && accumulated < amount) {
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

  // 每个transaction都必须经过验证
  mineBlock(txs) {
    for (let i in txs) {
      let tx = txs[i];
      if (!this.verifyTransaction(tx)) {
        throw new Error('transaction verify failed');
      }
    }

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