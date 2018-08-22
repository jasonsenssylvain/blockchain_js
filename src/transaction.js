const Hashes    = require('jshashes');
const BigInteger = require('bigi');

const SUBSIDY = 10;

class Transaction {
  constructor() {
    this.id = null;
    this.vIn = [];
    this.vOut = [];
  }

  static TxsFromString(data) {
    if (typeof data == 'string') {
      data = JSON.parse(data);
    }

    let txs = [];
    for (let key in data) {
      let payload = data[key];
      let tx = new Transaction();
      tx.id = payload.id;
      for( let j in payload.vIn) {
        let txInput = new TXInput(payload.vIn[j].txId, payload.vIn[j].vOut, payload.vIn[j].scriptSig);
        tx.vIn.push(txInput);
      }

      for( let i in payload.vOut) {
        let txOutput = new TXOutput(payload.vOut[i].value, payload.vOut[i].scriptPubKey);
        tx.vOut.push(txOutput);
      }

      txs.push(tx);
    }

    return txs;
  }

  static NewCoinbaseTX(to, data) {
    if (!data || data == '') {
      data = `Reward to ${to}`;
    }

    let txIn = new TXInput(0, -1, data);
    let txOut = new TXOutput(SUBSIDY, to);
    let transaction = new Transaction();
    transaction.vIn.push(txIn);
    transaction.vOut.push(txOut);

    transaction.setId();

    return transaction; 
  }

  static NewUTXOTransaction(fromAddr, to, amount, bc) {
    let inputs = [];
    let outputs = [];

    let obj = bc.findSpendableOutputs(fromAddr, amount);
    let acc = obj.amount;
    let unspentOutputs = obj.unspentOutputs;

    if (acc < amount) {
      console.log(`ERROR: Not enough funds`);
      return;
    }

    for (let txId in unspentOutputs) {
      let outs = unspentOutputs[txId];
      for (let key in outs) {
        let outIdx = outs[key];
        let input = new TXInput(txId, outIdx, fromAddr);
        inputs.push(input);
      }
    }

    outputs.push(new TXOutput(amount, to));

    if (acc > amount) {
      outputs.push(new TXOutput(acc - amount, fromAddr));
    }

    let tx = new Transaction();
    tx.vIn = inputs;
    tx.vOut = outputs;
    tx.setId();

    return tx;
  }

  setId() {
    let sha256 = new Hashes.SHA256();
    let data = JSON.stringify(this);
    let hash = sha256.hex(data);
    this.id = hash;
  }

  isCoinbase() {
    return this.vIn.length == 1 && this.vIn[0].txId == 0 && this.vIn[0].vOut == -1;
  }
}

class TXOutput {
  constructor(value, scriptPubKey) {
    this.value = parseInt(value);
    this.scriptPubKey = scriptPubKey;
  }

  canBeUnlockedWith(unlockingData) {
    return this.scriptPubKey == unlockingData;
  }
}

class TXInput {
  constructor(txId, vOut, scriptSig) {
    this.txId = txId; // 一个交易输入引用了之前一笔交易的一个输出, ID 表明是之前哪笔交易
    this.vOut = vOut; // 一笔交易可能有多个输出，Vout 为输出的索引
    this.scriptSig = scriptSig;
  }

  // unlockingData 理解为地址
  canUnlockOutputWith(unlockingData) {
    return this.scriptSig == unlockingData;  
  }


}

module.exports = {
  Transaction,
  TXOutput,
  TXInput
};