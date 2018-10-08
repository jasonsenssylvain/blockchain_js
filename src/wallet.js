const CoinKey         = require('cryptojstool').CoinKey;
const Base58Check     = require('cryptojstool').Base58Check;
const InCache         = require('incache');

const DEFAULT_VERSIONS = {
  public: 0x0,
  private: 0x80
}

const addressChecksumLen = 4;

class Wallets {
  constructor() {
    this.wallets = {};  // key: address, value: wallet
    let store = new InCache({
      filePath: "wallets.json",
      storeName: "wallets",
      autoSave: true,
      autoSaveMode: "timer",
      autoSavePeriod: "2"
    });
    this.store = store;
  }

  static getDefaultVersioin() {
    return DEFAULT_VERSIONS;
  }

  // load from files if exists
  static newWallets() {
    let wallets = new Wallets();
    let data = wallets.store.get("wallets");  // wallets as default wallet name
    if (data) {
      data = JSON.parse(data);

      for (let addr in data) {
        let w = data[addr];
        let privateWif = w.privateWif;
        let wallet = Wallet.newWalletFromPrivateWif(privateWif);
        wallets.wallets[addr] = wallet;
      }
    }

    return wallets;
  }

  createWallet() {
    let wallet = Wallet.newWallet();
    this.wallets[wallet.address] = wallet;
    return wallet.address;
  }

  get addresses() {
    let addresses = [];
    for (let addr in this.wallets) {
      addresses.push(addr);
    }
    return addresses;
  }

  getWallet(addr) {
    return this.wallets[addr];
  }

  save() {
    let data = this.toString();

    this.store.set("wallets", data);
  }

  toString() {
    let data = {};
    for (let addr in this.wallets) {
      let w = this.wallets[addr];
      data[addr] = w.toString();
    }
    data = JSON.stringify(data);
    return data;
  }
}

class Wallet {
  constructor(privateKey) {
    if (privateKey)
      this.coinkey = new CoinKey(Buffer.from(privateKey, 'hex'), versions);
  }

  get address() {
    return this.coinkey.publicAddress;
  }

  get pubKeyHash() {
    return this.coinkey.pubKeyHash;
  }

  get publicKey() {
    return this.coinkey.publicKey;
  }

  get privateKey() {
    return this.coinkey.privateKey;
  }

  toString() {
    return {
      address: this.address,
      privateWif: this.coinkey.privateWif
    };
  }

  static newWallet() {
    let coinkey = CoinKey.createRandom(DEFAULT_VERSIONS);
    let wallet = new Wallet();
    wallet.coinkey = coinkey;
    return wallet;
  }

  static newWalletFromPrivateWif(privateWif) {
    let coinkey = CoinKey.fromWif(privateWif, DEFAULT_VERSIONS);
    let wallet = new Wallet();
    wallet.coinkey = coinkey;
    return wallet;
  }

  static checksum(payloadBuf) {
    let checksum = Base58Check.sha256x2(payloadBuf).slice(0, 4);
    return checksum;
  }

  static validAddress(address) {
    return Base58Check.isValid(address);
  }
}

module.exports = {
  Wallets,
  Wallet
};