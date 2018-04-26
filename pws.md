## 基本介绍 ##

在 [之前的文章](https://github.com/jasoncodingnow/blockchain_js/blob/part1/basic_prototype_cn.md)的文章里我们写了一个包含非常简单的基本数据结构的区块链。在该文章里我们实现了给该区块链添加区块，让每个区块都关联到上一个区块。但是，我们的区块链有一个非常重大的缺陷：添加新的区块非常容易而且成本很低。区块链，比如比特币，有一个非常重要的特性就是添加区块是一件非常难的事情。这篇文章里，我们要解决这个问题。

## POW 工作量证明 ##

区块链非常重要的一个特性就是数据的写入消耗一定的计算资源。正是这个特性让区块链安全和一致。此外，完成这个工作的人，也会获得相应奖励（这也就是通过挖矿获得币）。

这个机制与生活现象非常类似：一个人必须通过努力工作，才能够获得回报或者奖励，用以支撑他们的生活。在区块链中，是通过网络中的参与者（矿工）不断的工作来支撑起了整个网络。矿工不断地向区块链中加入新块，然后获得相应的奖励。在这种机制的作用下，新生成的区块能够被安全地加入到区块链中，它维护了整个区块链数据库的稳定性。值得注意的是，完成了这个工作的人必须要证明这一点，即他必须要证明他的确完成了这些工作。

整个 “努力工作并进行证明” 的机制，就叫做工作量证明（proof-of-work）。要想完成工作非常地不容易，因为这需要大量的计算能力：即便是高性能计算机，也无法在短时间内快速完成。另外，这个工作的困难度会随着时间不断增长，以保持每 10 分钟出 1 个新块的速度。在比特币中，这个工作就是找到一个块的哈希，同时这个哈希满足了一些必要条件。这个哈希，也就充当了证明的角色。因此，寻求证明（寻找有效哈希），就是矿工实际要做的事情。

 ## 哈希计算 ##
在本节，我们会讨论哈希计算。如果你已经熟悉了这个概念，可以直接跳过。

获得指定数据的一个哈希值的过程，就叫做哈希计算。一个哈希，就是对所计算数据的一个唯一表示。对于一个哈希函数，输入任意大小的数据，它会输出一个固定大小的哈希值。下面是哈希的几个关键特性：

无法从一个哈希值恢复原始数据。也就是说，哈希并不是加密。
对于特定的数据，只能有一个哈希，并且这个哈希是唯一的。
即使是仅仅改变输入数据中的一个字节，也会导致输出一个完全不同的哈希。

![hash](https://camo.githubusercontent.com/ca8d13dd8a2604e5f523c66332bdce9af10a3a84/687474703a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f3132373331332d653962303733306231373938373034642e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430)

哈希函数被广泛用于检测数据的一致性。软件提供者常常在除了提供软件包以外，还会发布校验和。当下载完一个文件以后，你可以用哈希函数对下载好的文件计算一个哈希，并与作者提供的哈希进行比较，以此来保证文件下载的完整性。

在区块链中，哈希被用于保证一个块的一致性。哈希算法的输入数据包含了前一个块的哈希，因此使得不太可能（或者，至少很困难）去修改链中的一个块：因为如果一个人想要修改前面一个块的哈希，那么他必须要重新计算这个块以及后面所有块的哈希。

 ## Hashcash ##
 
 比特币使用 Hashcash ，一个最初用来防止垃圾邮件的工作量证明算法。它可以被分解为以下步骤：

取一些公开的数据（比如，如果是 email 的话，它可以是接收者的邮件地址；在比特币中，它是区块头）
给这个公开数据添加一个计数器。计数器默认从 0 开始
将 data(数据) 和 counter(计数器) 组合到一起，获得一个哈希
检查哈希是否符合一定的条件：
如果符合条件，结束
如果不符合，增加计数器，重复步骤 3-4
因此，这是一个暴力算法：改变计数器，计算新的哈希，检查，增加计数器，计算哈希，检查，如此往复。这也是为什么说它的计算成本很高，因为这一步需要如此反复不断地计算和检查。

![hash](https://camo.githubusercontent.com/b17a342e79bbc89f4152ff968c763d837b7e0e56/687474703a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f3132373331332d393866613664343461616433373031662e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430)



现在，让我们来仔细看一下一个哈希要满足的必要条件。在原始的 Hashcash 实现中，它的要求是 “一个哈希的前 20 位必须是 0”。在比特币中，这个要求会随着时间而不断变化。因为按照设计，必须保证每 10 分钟生成一个块，而不论计算能力会随着时间增长，或者是会有越来越多的矿工进入网络，所以需要动态调整这个必要条件。

为了阐释这一算法，我从前一个例子（“I like donuts”）中取得数据，并且找到了一个前 3 个字节是全是 0 的哈希。

ca07ca 是计数器的 16 进制值，十进制的话是 13240266.


## 实现 ##

好了，完成了理论层面，来动手写代码吧！首先，定义挖矿的难度值：

```javascript
// POW.js

class POW {
  
}

POW.trgetBits = 24;

module.exports = POW;
```

在比特币中，当一个块被挖出来以后，“target bits” 代表了区块头里存储的难度，也就是开头有多少个 0。这里的 24 指的是算出来的哈希前 24 位必须是 0，如果用 16 进制表示，就是前 6 位必须是 0，这一点从最后的输出可以看出来。目前我们并不会实现一个动态调整目标的算法，所以将难度定义为一个全局的常量即可。

24 其实是一个可以任意取的数字，其目的只是为了有一个目标（target）而已，这个目标占据不到 256 位的内存空间。同时，我们想要有足够的差异性，但是又不至于大的过分，因为差异性越大，就越难找到一个合适的哈希。

(在javascript里面，采用 [bigi](https://github.com/blixt/js-bigint) 来做big int相关的运算)

```javascript
// POW.js
const BigInteger = require('bigi');

class POW {
  constructor(block, target) {
    this.block = block;
    this.target = target;
  }

  static NewProofOfWork(block) {
    let target = BigInteger.fromHex("01");
    target = target.shiftLeft(256 - POW.trgetBits);
    let pow = new POW(block, target);
    return pow;
  }
}

POW.trgetBits = 24;

module.exports = POW;
```

这里，我们构建了POW的类，存储了一个block以及一个target。这里的target，也就是前面一小节中提到的必要条件。这里使用 big Int，我们会将该数值和哈希值进行比较：先将哈希值转化为一个big Int，然后监测它是否小于目标。

在 NewProofOfWork 函数中，我们将 big Int 初始化为 1，然后左移 256 - targetBits 位。256 是一个 SHA-256 哈希的位数，我们将要使用的是 SHA-256 哈希算法。target（目标） 的 16 进制形式为：

```
0x10000000000000000000000000000000000000000000000000000000000
```

它在内存上占据了 29 个字节。下面是与前面例子哈希的形式化比较：

```
0fac49161af82ed938add1d8725835cc123a1a87b1b196488360e58d4bfb51e3
0000010000000000000000000000000000000000000000000000000000000000
0000008b0f41ec78bab747864db66bcb9fb89920ee75f43fdaaeb5544f7f76ca
```

第一个哈希（基于 “I like donuts” 计算）比目标要大，因此它并不是一个有效的工作量证明。第二个哈希（基于 “I like donutsca07ca” 计算）比目标要小，所以是一个有效的证明。

译者注：上面的形式化比较有些“言不符实”，其实它应该并非由 “I like donuts” 而来，但是原文表达的意思是没问题的，可能是疏忽而已。下面是我做的一个小实验：

``` javascript
// test/pow_test.js

const POW       = require( __dirname + "/../src/pow.js");
const Block     = require( __dirname + "/../src/block.js");

const Hashes    = require('jshashes');
const assert    = require('assert');
const BigInteger = require('bigi');

describe('POW', function () {
  describe('#NewProofOfWork()', function () {
    it('should create a new pow', function () {
      let data = "first block";

      let prevHash = new Hashes.SHA256().hex('pretend first block');

      let newBlock = Block.NewBlock(data, prevHash);

      let pow = POW.NewProofOfWork(newBlock);
      console.log(pow);

    });

    // 实验部分看这里代码
    it('compare target', function () {
      let data1 = 'I like donuts';
      let data2 = 'I like donutsca07ca';
      let targetBits = 24;
      let target = BigInteger.fromHex("01");
      target = target.shiftLeft(256 - POW.trgetBits);
      console.log(new Hashes.SHA256().hex(data1));
      console.log(target.toHex());
      console.log(new Hashes.SHA256().hex(data2));
    });
  });
});

```

你可以把目标想象为一个范围的上界：如果一个数（由哈希转换而来）比上界要小，那么是有效的，反之无效。因为要求比上界要小，所以会导致有效数字并不会很多。因此，也就需要通过一些困难的工作（一系列反复地计算），才能找到一个有效的数字。

现在，我们需要有数据来进行哈希，准备数据：

``` javascript
  prepareData(nonce) {
    return this.block.prevBlockHash + "" 
    + this.block.data + "" 
    + this.block.timestamp + "" 
    + POW.trgetBits + "" 
    + nonce;
  }
```

这个部分比较直观：只需要将 target ，nonce 与 Block 进行合并。这里的 nonce，就是上面 Hashcash 所提到的计数器，它是一个密码学术语。

很好，到这里，所有的准备工作就完成了，下面来实现 PoW 算法的核心：

``` javascript

// 注意：javascript是单线程，所以这里会造成堵塞。但是目前我们先这么放着。
  run() {
    let hashInt;
    let hash;

    let nonce = 0;
    let sha256 = new Hashes.SHA256();
    console.log(`Mining the block: ${this.block.data}`);

    while(nonce < POW.maxNonce) {
      let data = this.prepareData(nonce);
      hash = sha256.hex(data);
      hashInt = BigInteger.fromHex(hash);
      if (hashInt.compareTo(this.target) < 0) {
        console.log(`Mining end! hash: ${hash}`)
        break;
      } else {
        nonce ++;
      }
    }
    return {nonce: nonce, hash:hash};
  }
```

首先我们对变量进行初始化：

HashInt 是 hash 的整形表示；
nonce 是计数器。
然后开始一个 “无限” 循环：maxNonce 对这个循环进行了限制, 它等于 bigInt.max，这是为了避免 nonce 可能出现的溢出。尽管我们 PoW 的难度很小，以至于计数器其实不太可能会溢出，但最好还是以防万一检查一下。

在这个循环中，我们做的事情有：

 * 准备数据
 * 用 SHA-256 对数据进行哈希
 * 将哈希转换成一个大整数
 * 将这个大整数与目标进行比较

跟之前所讲的一样简单。现在我们可以移除 Block 的 SetHash 方法，然后修改 NewBlock 函数：

``` javascript
  static NewBlock(data, prevBlockHash) {
    let block = new Block(Date.now(), data, prevBlockHash);
    let pow = POW.NewProofOfWork(block);
    let powResult = pow.run();
    block.hash = powResult.hash;
    block.nonce = powResult.nonce;
    // block.setHash();
    return block;
  }
```

在这里，你可以看到 nonce 被保存为 Block 的一个属性。这是十分有必要的，因为待会儿我们对这个工作量进行验证时会用到 nonce 。

还剩下一件事情需要做，对工作量证明进行验证：

``` javascript
  validate() {
    let hashInt;
    let data = this.prepareData(this.block.nonce);
    let hash = new Hashes.SHA256().hex(data);
    return hashInt.compareTo(this.target) < 0 ;
  }
```

OK！基本完成了！接下去先看下目前所有的代码：

``` javascript

// block.js 

const Hashes    = require('jshashes');

const POW       = require('./pow.js')

class Block {

  static NewBlock(data, prevBlockHash) {
    let block = new Block(Date.now(), data, prevBlockHash);
    let pow = POW.NewProofOfWork(block);
    let powResult = pow.run();
    block.hash = powResult.hash;
    block.nonce = powResult.nonce;
    // block.setHash();
    return block;
  }

  constructor(timestamp, data, prevBlockHash, hash) {
    this.timestamp = timestamp;
    this.data = data;
    this.prevBlockHash = prevBlockHash;
    this.hash = hash;
    this.nonce = 0;
  }

  // 在part2里面，就可以直接移除掉这个函数了
  // setHash() {
  //   let hash = "" + this.prevBlockHash + this.data + this.timestamp;
  //   this.hash = new Hashes.SHA256().hex(hash);
  // }
}

module.exports = Block;



// pow.js

const BigInteger = require('bigi');
const Hashes    = require('jshashes');

class POW {
  constructor(block, target) {
    this.block = block;
    this.target = target;
  }

  static NewProofOfWork(block) {
    let target = BigInteger.fromHex("01");
    target = target.shiftLeft(256 - POW.trgetBits);
    let pow = new POW(block, target);
    return pow;
  }

  prepareData(nonce) {
    return this.block.prevBlockHash + "" 
    + this.block.data + "" 
    + this.block.timestamp + "" 
    + POW.trgetBits + "" 
    + nonce;
  }

  run() {
    let hashInt;
    let hash;

    let nonce = 0;
    let sha256 = new Hashes.SHA256();
    console.log(`Mining the block: ${this.block.data}`);

    while(nonce < POW.maxNonce) {
      let data = this.prepareData(nonce);
      hash = sha256.hex(data);
      hashInt = BigInteger.fromHex(hash);
      if (hashInt.compareTo(this.target) < 0) {
        console.log(`Mining end! hash: ${hash}`)
        break;
      } else {
        nonce ++;
      }
    }
    return {nonce: nonce, hash:hash};
  }

  validate() {
    let hashInt;
    let data = this.prepareData(this.block.nonce);
    let hash = new Hashes.SHA256().hex(data);
    return hashInt.compareTo(this.target) < 0 ;
  }
}

POW.trgetBits = 8;  //测试下来，如果为8很快就出块了。
POW.maxNonce = Number.MAX_SAFE_INTEGER;

module.exports = POW;
```

好了，开始修改之前写的测试代码

``` javascript

// test/pow_test.js

const POW       = require( __dirname + "/../src/pow.js");
const Block     = require( __dirname + "/../src/block.js");

const Hashes    = require('jshashes');
const assert    = require('assert');
const BigInteger = require('bigi');

describe('POW', function () {
  describe('#NewProofOfWork()', function () {
    it('should create a new pow', function () {
      let data = "first block";

      let prevHash = new Hashes.SHA256().hex('pretend first block');

      let newBlock = Block.NewBlock(data, prevHash);

      let pow = POW.NewProofOfWork(newBlock);
      console.log('finish pow');

    });

    it('compare target', function () {
      let data1 = 'I like donuts';
      let data2 = 'I like donutsca07ca';
      let targetBits = 24;
      let target = BigInteger.fromHex("01");
      target = target.shiftLeft(256 - POW.trgetBits);
      console.log(new Hashes.SHA256().hex(data1));
      console.log(target.toHex());
      console.log(new Hashes.SHA256().hex(data2));
    });
  });
});

      
```

接着在命令行直接运行 ``` npm test ``` 即可。测试下来target为8可以立即看到出块，到了12就开始变慢速度了。

## 总结 ##

我们离真正的区块链又进了一步：现在需要经过一些困难的工作才能加入新的块，因此挖矿就有可能了。但是，它仍然缺少一些至关重要的特性：区块链数据库并不是持久化的，没有钱包，地址，交易，也没有共识机制。不过，所有的这些，我们都会在接下来的文章中实现，现在，愉快地挖矿吧！