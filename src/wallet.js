const CoinKey         = require('cryptojstool').CoinKey;
const Base58Check     = require('cryptojstool').Base58Check;

const DEFAULT_VERSIONS = {
  public: 0x0,
  private: 0x80
}

const addressChecksumLen = 4;

class Wallets {
  constructor() {
    this.wallets = {};
  }


}

class Wallet {
  constructor(privateKey) {
    this.coinkey = new CoinKey(Buffer.from(privateKey, 'hex'), versions);
  }

  get address() {
    return this.coinkey.publicAddress;
  }

  get pubKeyHash() {
    return this.coinkey.pubKeyHash;
  }

  static validAddress(address) {
    let pubKeyHash = Base58Check.decode(address);
    return true;
  }
}

module.exports = {
  Wallets,
  Wallet
};