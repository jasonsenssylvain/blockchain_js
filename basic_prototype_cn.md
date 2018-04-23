 ## 基本介绍 ##
 
 区块链是诞生于21世纪的非常革命性的技术，并且还在发展成熟当中，而且其潜力依然没有被充分挖掘。本质上区块链只是一个去中心话的数据集。但是它的特殊之处在于它不是一个私有的数据库，而是一个公开的数据库，也就意味着任何人都可以拥有它的完整的拷贝或者部分。数据的写入必须获得其他人的统一才行。同时，区块链让加密数字货币和智能合约得以真正实现。
 
 接下来这一系列文章当中，我们将会基于区块链的原理实现一个简单的加密数字货币系统。
 
 ## 区块 ##

 我们从“区块链”这个名词当中的“区块”解释起。区块在区块链里头起到了存储有价值的数据的作用。举个例子，比特币的区块里面存储了交易，而交易是加密数字货币的本质构成。同时，一个区块可以包含一些技术信息，比如版本号，当前时间戳以及上一个区块的哈希值。

 在这篇文章里，我们暂且不会去完整实现“区块链”定义里面的“区块”，或者是比特币里面的“区块”，目前而言我们暂且实现一个相对简单的版本，包含一些重要信息。下面就是这个区块的结构定义：

``` javascript
class Block {
  constructor(timestamp, data, prevBlockHash, hash) {
    this.timestamp = timestamp;
    this.data = data;
    this.prevBlockHash = prevBlockHash;
    this.hash = hash;
  }
}
```

其中，timestamp就是当前的时间戳（该区块被创建出来的时间），date是其中真正有存储价值信息的地方，prevBlockHash则存储了上一个区块哈希值，hash是当前这个区块的哈希值。在比特币里面，timestamp, prevBlockHash, hash是区块头，形成一个数据结构，而transactions（在我们当前实现的版本里面指的是 data）是另外一个跟区块头分开的数据架构。目前我们将这两者放在一起主要是为了简化我们的工作。

那么，我们怎么计算哈希值呢？哈希值的计算是区块链里面非常重要的一个设计，这个计算方式保证了区块链的安全性。事实上计算哈希值是一个非常消耗计算资源的操作，即使是非常快速的电脑也是需要一定时间的（这就是为什么人们买GPU来挖比特币）。这是一个刻意为之的架构设计，目的是让增加区块变得困难从而阻止区块被添加进区块链数据库之后被篡改。后续我们会详细讨论和实现这套机制。

目前，我们仅仅是拿出区块里面的字段串联起来，然后计算该SHA-256哈希值。下面就是实现的代码：

``` javascript
const Hashes    = require('jshashes');

...

  setHash() {
    let hash = "" + this.prevBlockHash + this.data + this.timestamp;
    this.hash = new Hashes.SHA256().hex(hash);
  }
````

(注：其中Hashes是github上面的一个项目，https://github.com/h2non/jshashes)

Block的介绍已经完成，接下来我们创建一个简单的函数来构造出Block

``` javascript
  static NewBlock(data, prevBlockHash) {
    let block = new Block(Date.now(), data, prevBlockHash);
    block.setHash();
    return block;
  }
```

结束！这就是区块！

 ## 区块链 ##
 
 现在，我们来实现区块链。从定义上来讲，区块链的本质就是一个有特定结构的数据库：它是一个顺序排列、串联的链表。也就是说区块链里面的区块按照插入的时间顺序排列，并且每一个区块都跟前一个区块串联起来。因此，可以非常快速的获取到最新的区块，并且很高效的根据哈希值获取到一个区块。
 
 
在js里面，我们用 array 和 map 来实现这样的结构：array 用来保证哈希值是按照顺序排列，map 则是让哈希值可以快速查找到区块。不过在目前我们即将实现的原型里面，我们暂时只使用array，因为我们目前不需要根据哈希值来查找到对应的区块。

``` javascript
class BlockChain {
  constructor() {
    this.blocks = new Array();
  }
}
```
 
很简单对吧！

现在我们实现一个增加区块的函数：

``` javascript
  addBlock(data) {
    let prevBlock = this.blocks[this.blocks.length - 1];
    let newBlock = Block.NewBlock(data, prevBlock.hash);
    this.blocks.push(newBlock);
  }
```

好了！完成了。不过，还漏了个东西。

如果当前没有区块的话，则 ``` this.blocks[this.blocks.length - 1] ```这个函数就会出错。所以，我们必须保证区块链至少有一个区块。在区块链的实现里，我们一般把第一个区块叫做“创世块”。现在来实现这个块：

``` javascript
  newGenesisBlock() {
    return Block.NewBlock(`Genesis Block`, ``);
  }
```

所以，在创建新的区块链的时候，需要同时创建创世块:

``` javascript
  static NewBlockChain() {
    let bc = new BlockChain();
    bc.blocks.push(bc.newGenesisBlock());
    return bc;
  }
```

好了。区块链的基本原型就完成了。

接下来，测试下我们的代码。

``` javascript
// block_test.js

describe('Block', function () {
  describe('#NewBlock()', function () {
    it('should create a new block', function () {
      let data = "first block";

      let prevHash = new Hashes.SHA256().hex('pretend first block');
      console.log(`prevHash: ${prevHash}`);

      let newBlock = Block.NewBlock(data, prevHash);

      console.log(newBlock);
    });
  });
});
```

``` javascript
// blockchain_test.js

describe('BlockChain', function () {
  describe('#NewBlockChain()', function () {
    it('should create a new block', function () {
      let bc = BlockChain.NewBlockChain();
      bc.addBlock(`Send 1 BTC to a friend`);
      bc.addBlock(`Send 1 BTC to another friend`);

      console.log(bc);
    });
  });
});
```

在这个nodejs程序里面，package.json里面添加mocha测试代码： ``` "scripts": {
    "test": "mocha"
  }, ``` 然后运行 ``` npm test ``` 就可以看到测试结果了。

 ## 最后 ##
 

我们建立了区块链的一个简单原型，里面包含：一个区块组成的数组，每个区块都跟前一个区块串联起来。当前，真正的区块链系统远远比这个复杂多了。在该系统里添加一个区块简单而且快速，但是真正的区块链里面添加一个区块需要进行一些复杂的操作：必须经过大量的计算资源的消耗从而获取一个权限的可以添加一个区块（该机制被称为POW）。另外，区块链也是一个没有中央决策角色的去中心化数据库。因此，一个新的区块的产生必须经过网络中的其他成员的确认和许可（该机制被称为共识）。嗯，目前我们实现的区块链还没包含交易。

其他的之后的文章再继续分析。

