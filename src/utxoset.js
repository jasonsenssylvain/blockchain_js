const TXOutput        = require('./transaction.js').TXOutput;

const utxoBucket      = 'chainstate';

class UTXOSet {
  constructor(bc) {
    this.blockchain = bc;

    let store = new InCache({
      filePath: utxoBucket + ".json",
      storeName: utxoBucket,
      autoSave: true,
      autoSaveMode: "timer",
      autoSavePeriod: "2"
    });
    this.db = store;
  }

  // FindSpendableOutputs finds and returns unspent outputs to reference in inputs
  findSpendableOutputs(pubKeyHash, amount) {
    let unspentOutputs = {};
    let accumulated = 0;

    let records = this.db.all();
    for (let txId in records) {
      let record = records[txId];
      let arr = JSON.parse(record);
      for (let k in arr) {
        let txOutput = TXOutput.fromJSON(arr[k]);
        if (txOutput.isLockedWithKey(pubKeyHash) && accumulated < amount) {
          accumulated += txOutput.value;
          if (unspentOutputs[txId] == null || unspentOutputs[txId] == undefined)
            unspentOutputs[txId] = [];
          unspentOutputs[txId].push(k);
        }
      }
    }
    return {
      amount: accumulated,
      unspentOutputs: unspentOutputs
    };
  }

  reindex() {
    let UTXO = this.blockchain.findUTXO();

    this.db.clear();

    for (let txId in UTXS) {
      let outs = UTXS[txId];
      let arr = [];
      for (let i in outs) {
        let out = outs[i];
        let outString = out.toJSON();
        arr.push(outString);
      }
      arr = JSON.stringify(arr);
      this.db.set(txId, arr);
    }
  }

  findUTXO(pubKeyHash) {
    let UTXOs = [];

    let records = this.db.all();
    for (let txId in records) {
      let record = records[txId];
      let arr = JSON.parse(record);
      for (let k in arr) {
        let txOutput = TXOutput.fromJSON(arr[k]);
        if (txOutput.isLockedWithKey(pubKeyHash)) {
          UTXOs.push(txOutput);
        }
      }
    }
    return UTXOs;
  } 

  update(block) {
    
  }
}

module.exports = UTXOSet;