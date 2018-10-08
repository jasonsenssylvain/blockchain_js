const Hashes          = require('jshashes');
const BigInteger      = require('bigi');
const crypto          = require('crypto');
const Base58Check     = require('cryptojstool').Base58Check;
const ECKey           = require('cryptojstool').ECKey;
const secp256k1       = require('secp256k1');

const Wallets         = require("./wallet.js").Wallets;

const SUBSIDY = 10;

class Transaction {
  constructor() {
    this.id = null;
    this.vIn = [];
    this.vOut = [];
  }

  toJSON() {
    let o = {};
    o.id = this.id;
    o.vIn = [];
    for (let i in this.vIn) {
      o.vIn.push(this.vIn[i].toJSON());
    }
    o.vOut = [];
    for (let i in this.vOut) {
      o.vOut.push(this.vOut[i].toJSON());
    }
    return o;
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
        // let txInput = new TXInput(payload.vIn[j].txId, payload.vIn[j].vOut, payload.vIn[j].scriptSig);
        // change structure
        let txInput = new TXInput(payload.vIn[j].txId, 
                                  payload.vIn[j].vOut, 
                                  Buffer.from(payload.vIn[j].signature, 'hex'), 
                                  Buffer.from(payload.vIn[j].pubKey, 'hex'));
        tx.vIn.push(txInput);
      }

      for (let i in payload.vOut) {
        let txOutput = new TXOutput(payload.vOut[i].value, Buffer.from(payload.vOut[i].pubKeyHash, 'hex'));
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

    let txIn = new TXInput(0, -1, null, Buffer.from(data));
    let txOut = TXOutput.newTXOutput(SUBSIDY, to);
    let transaction = new Transaction();
    transaction.vIn.push(txIn);
    transaction.vOut.push(txOut);

    transaction.setId();

    return transaction; 
  }

  static NewUTXOTransaction(fromAddr, to, amount, bc) {
    let inputs = [];
    let outputs = [];

    // add in PART5
    // 获取钱包文件，接着获取对应的人的具体钱包
    let wallets = Wallets.newWallets(); // return wallets instance, not really new wallets
    let fromWallet = wallets.getWallet(fromAddr);
    let pubKeyHash = fromWallet.pubKeyHash;

    let obj = bc.findSpendableOutputs(pubKeyHash, amount);
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
        let input = new TXInput(txId, outIdx, null, fromWallet.publicKey);  // 这个地方不做签名处理。
        inputs.push(input);
      }
    }

    outputs.push(TXOutput.newTXOutput(amount, to));

    if (acc > amount) {
      outputs.push(TXOutput.newTXOutput(acc - amount, fromAddr));
    }

    let tx = new Transaction();
    tx.vIn = inputs;
    tx.vOut = outputs;
    tx.setId();
    bc.signTransaction(tx, fromWallet.privateKey);  //做具体签名处理

    return tx;
  }

  static hashTransaction(tx) {
    let txHashes = "";
    for (let i = 0; i < tx.length; i++) {
      txHashes += JSON.stringify(tx[i]);
    }

    let sha256 = new Hashes.SHA256();
    let hash = sha256.hex(txHashes);
    return hash;
  }

  setId() {
    let sha256 = new Hashes.SHA256();
    let data = JSON.stringify(this.toJSON());
    let hash = sha256.hex(data);
    this.id = hash;
  }

  isCoinbase() {
    return this.vIn.length == 1 && this.vIn[0].txId == 0 && this.vIn[0].vOut == -1;
  }

  // Sign signs each input of a Transaction
  sign(walletPrivateKey, prevTXs) {

    // coinbase没有输入源，所以不需要签名
    if (this.isCoinbase())
      return;

    // 确认输入是正确的，TXInput都有对应的源头
    for (let i in this.vIn) {
      let txId = this.vIn[i].txId;
      if (!prevTXs[txId])
        throw new Error(`cannot find txId( ${txId} ) in prevTXs`);
    }

    let txCopy = this.trimmedCopy();

    // 取出每个TXInput，进行hash，最终用对应的privateKey进行签名保存
    for (let i in txCopy.vIn) {
      let vIn = txCopy.vIn[i];
      let txId = vIn.txId;
      let prevTx = prevTXs[txId];
      txCopy.vIn[i].signature = null;
      txCopy.vIn[i].pubKey = prevTx.vOut[vIn.vOut].pubKeyHash;
      txCopy.id = Transaction.hashTransaction(txCopy);
      txCopy.vIn[i].pubKey = null;  //`Hash` 方法对交易进行序列化，并使用 SHA-256 算法进行哈希。哈希后的结果就是我们要签名的数据。在获取完哈希，我们应该重置 `PubKey` 字段，以便于它不会影响后面的迭代。


      let signatureBuf = secp256k1.sign(Buffer.from(txCopy.id, 'hex'), walletPrivateKey); //我们通过 `privKey` 对 `txCopy.ID` 进行签名。一个 ECDSA 签名就是一对数字，我们对这对数字连接起来，并存储在输入的 `Signature` 字段。
      this.vIn[i].signature = signatureBuf.signature;
    }
  }

  verify(prevTXs) {
    if (this.isCoinbase())
      return;

    for (let i in this.vIn) {
      let txId = this.vIn[i].txId;
      if (!prevTXs[txId].id)
        throw new Error(`ERROR: Previous transaction is not correct`);
    }

    let txCopy = this.trimmedCopy();

    for (let i in this.vIn) {
      let vIn = this.vIn[i];
      let txId = vIn.txId;
      let prevTx = prevTXs[txId];

      txCopy.vIn[i].signature = null;
      txCopy.vIn[i].pubKey = prevTx.vOut[vIn.vOut].pubKeyHash;
      txCopy.id = Transaction.hashTransaction(txCopy);
      txCopy.vIn[i].pubKey = null;

      let pubKey = vIn.pubKey;
      console.log(vIn)
      let verifyResult = secp256k1.verify(Buffer.from(txCopy.id, 'hex'), vIn.signature, vIn.pubKey);
      if (!verifyResult)
        return false;
    }
    return true;
  }



  // 可以理解为 copy 整个transaction
  // 因为在sign和verify过程中，需要对数据进行修改。但是我们不希望真正的修改数据，只是为了提取出来使用
  trimmedCopy() {
    let inputs = [];
    let outputs = [];

    for (let i in this.vIn) {
      let input = new TXInput(this.vIn[i].txId, this.vIn[i].vOut, null, null);
      inputs.push(input);
    }

    for (let o in this.vOut) {
      let output = new TXOutput(this.vOut[o].value, this.vOut[o].pubKeyHash);
      outputs.push(output);
    }

    let newTransaction = new Transaction();
    newTransaction.id = this.id;
    newTransaction.vIn = inputs;
    newTransaction.vOut = outputs;
    return newTransaction;
  }
}

class TXOutput {
  constructor(value, pubKeyHash) {
    // change in PART5
    this.value = parseInt(value);
    // this.scriptPubKey = scriptPubKey;
    this.pubKeyHash = pubKeyHash; // 注意，这里是pubKeyHash，不同于TXInput的pubKey
  }

  canBeUnlockedWith(unlockingData) {
    return this.scriptPubKey == unlockingData;
  }

  static newTXOutput(value, toAddress) {
    let output = new TXOutput(value, null);
    output.lock(toAddress);
    return output;
  }

  // 传入地址，转化为 pubKeyHash
  lock(address) {
    let pubkeyHash = Base58Check.decode(address, Wallets.getDefaultVersioin().public);
    this.pubKeyHash = pubkeyHash;
  }

  isLockedWithKey(pubkeyHash) {
    if (pubkeyHash.toString('hex') === this.pubKeyHash.toString('hex'))
      return true;
    return false;
  }

  toJSON() {
    return {
      value: this.value,
      pubKeyHash: this.pubKeyHash ? this.pubKeyHash.toString('hex') : ""
    }
  }

  static fromJSON(data) {
    let txOutput = new TXOutput(data.value, Buffer.from(data.pubKeyHash, 'hex'));
    return txOutput;
  }
}

class TXInput {
  constructor(txId, vOut, signature, pubKey) {
    // change in PART5
    this.txId = txId; // 一个交易输入引用了之前一笔交易的一个输出, ID 表明是之前哪笔交易
    this.vOut = vOut; // 一笔交易可能有多个输出，Vout 为输出的索引
    // this.scriptSig = scriptSig;
    // add in PART5
    this.signature = signature; //signature是一个Buffer
    this.pubKey = pubKey; //pubKey
  }

  // remove in PART5
  // unlockingData 理解为地址
  // canUnlockOutputWith(unlockingData) {
  //   return this.scriptSig == unlockingData;  
  // }

  usersKey(pubKeyHash) {
    let pkHash = ECKey.hashPubKey(this.pubKey);
    if (pubKeyHash.toString('hex') === pkHash.toString('hex'))
      return true;
    return false;
  }

  // 其中有2个地方把buffer转化为hex的string，为了本地保存，以及读取之后可以还原回来
  toJSON() {
    return {
      txId: this.txId,
      vOut: this.vOut,
      signature: this.signature ? this.signature.toString('hex') : "",
      pubKey: this.pubKey ? this.pubKey.toString('hex') : ""
    }
  }
}

module.exports = {
  Transaction,
  TXOutput,
  TXInput
};