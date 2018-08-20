持久化和命令行接口
==================

## 引言

到目前为止，我们已经构建了一个有工作量证明机制的区块链。有了工作量证明，挖矿也就有了着落。虽然目前距离一个有着完整功能的区块链越来越近了，但是它仍然缺少了一些重要的特性。在今天的内容中，我们会将区块链持久化到一个数据库中，然后会提供一个简单的命令行接口，用来完成一些与区块链的交互操作。本质上，区块链是一个分布式数据库，不过，我们暂时先忽略 “分布式” 这个部分，仅专注于 “存储” 这一点。

## 选择数据库

目前，我们的区块链实现里面并没有用到数据库，而是在每次运行程序时，简单地将区块链存储在内存中。那么一旦程序退出，所有的内容就都消失了。我们没有办法再次使用这条链，也没有办法与其他人共享，所以我们需要把它存储到磁盘上。

那么，我们要用哪个数据库呢？实际上，任何一个数据库都可以。在 [比特币原始论文](https://bitcoin.org/bitcoin.pdf) 中，并没有提到要使用哪一个具体的数据库，它完全取决于开发者如何选择。 [Bitcoin Core](https://github.com/bitcoin/bitcoin) ，最初由中本聪发布，现在是比特币的一个参考实现，它使用的是  [LevelDB](https://github.com/google/leveldb)。而我们将要使用的是...


## incache

因为它：

1. 非常简洁
2. 用 JavaScript 实现
3. 不需要运行一个服务器
4. 能够允许我们构造想要的数据结构

当然，如果想要承担更复杂的功能，该db将不在考虑范围之内。该DB仅仅作为参考使用，不建议在production环境使用。但是因为该DB支持，key value的存储结构，非常适合用于教程。


## 数据库结构

在开始实现持久化的逻辑之前，我们首先需要决定到底要如何在数据库中进行存储。为此，我们可以参考 Bitcoin Core 的做法：

简单来说，Bitcoin Core 使用两个 “bucket” 来存储数据：

1. 其中一个 bucket 是 **blocks**，它存储了描述一条链中所有块的元数据
2. 另一个 bucket 是 **chainstate**，存储了一条链的状态，也就是当前所有的未花费的交易输出，和一些元数据


此外，出于性能的考虑，Bitcoin Core 将每个区块（block）存储为磁盘上的不同文件。如此一来，就不需要仅仅为了读取一个单一的块而将所有（或者部分）的块都加载到内存中。但是，为了简单起见，我们并不会实现这一点。


在 **blocks** 中，**key -> value** 为：

key                                                | value
:----:                                             | :----:
`b` + 32 字节的 block hash                         | block index record
`f` + 4 字节的 file number                         | file information record
`l` + 4 字节的 file number                         | the last block file number used
`R` + 1 字节的 boolean                             | 是否正在 reindex
`F` + 1 字节的 flag name length + flag name string | 1 byte boolean: various flags that can be on or off
`t` + 32 字节的 transaction hash                   | transaction index record

在 **chainstate**，**key -> value** 为：

key                              | value
:----:                           | :----:
`c` + 32 字节的 transaction hash | unspent transaction output record for that transaction
`B`                              | 32 字节的 block hash: the block hash up to which the database represents the unspent transaction outputs

详情可见 **[这里](https://en.bitcoin.it/wiki/Bitcoin_Core_0.11_(ch_2):_Data_Storage)**。

因为目前还没有交易，所以我们只需要 **blocks** bucket。另外，正如上面提到的，我们会将整个数据库存储为单个文件，而不是将区块存储在不同的文件中。所以，我们也不会需要文件编号（file number）相关的东西。最终，我们会用到的键值对有：

1. 32 字节的 block-hash -> block 结构
2. `l` -> 链中最后一个块的 hash

这就是实现持久化机制所有需要了解的内容了。

## 准备工作

``` shell
  $ npm install --save incache
```

## 序列化

因为采用的是纯JS的key value数据库，所以很方便存储。
在Block增加以下代码：
``` JavaScript
 toString() {
    return JSON.stringify(
      this
    );
  }

  static fromString(data) {
    let payload = JSON.parse(data);
    let block = new Block(payload.timestamp, payload.data, payload.prevBlockHash, payload.hash, payload.nonce);
    return block;
  }
```

## 持久化

让我们从 `NewBlockchain` 函数开始。在之前的实现中，`NewBlockchain` 会创建一个新的 `Blockchain` 实例，并向其中加入创世块。而现在，我们希望它做的事情有：

1. 打开一个数据库文件
2. 检查文件里面是否已经存储了一个区块链
3. 如果已经存储了一个区块链：
    1. 创建一个新的 `Blockchain` 实例
    2. 设置 `Blockchain` 实例的 tip 为数据库中存储的最后一个块的哈希
4. 如果没有区块链：
    1. 创建创世块
    2. 存储到数据库
    3. 将创世块哈希保存为最后一个块的哈希
    4. 创建一个新的 `Blockchain` 实例，初始时 tip 指向创世块（tip 有尾部，尖端的意思，在这里 tip 存储的是最后一个块的哈希）

代码大概是这样：

``` JavaScript 
  
  static NewBlockChain() {
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
      let block = bc.newGenesisBlock();

      store.set(block.hash, block.toString());
      store.set('l', block.hash);
      lastHash = block.hash;
    } else 
      bc = new BlockChain();
    bc.db = store;
    bc.tip = lastHash;

    return bc;
  }

```

相对之前的代码，修改了几个部分
    1. Blockchain这个class不保存block的array
    2. Blockchain每次创建实例都会检查本地数据
    3. Blockchain只存储最后一个block的hash，以及对应的db实例

因为修改了数据结构和存储方式，所以对应的 addBlock 方法也必须做修改

``` JavaScript 

  addBlock(data) {

    // modify in part3 
    // let prevBlock = this.blocks[this.blocks.length - 1];
    // let newBlock = Block.NewBlock(data, prevBlock.hash);
    // this.blocks.push(newBlock);

    // save to db
    let lastHash = this.tip;
    let newBlock = Block.NewBlock(data, lastHash);
    this.db.set(newBlock.hash, newBlock.toString());
    this.tip = newBlock.hash;
  }

```

## 检查区块链

现在，产生的所有块都会被保存到一个数据库里面，所以我们可以重新打开一个链，然后向里面加入新块。但是在实现这一点后，我们失去了之前一个非常好的特性：再也无法打印区块链的区块了，因为现在不是将区块存储在一个数组，而是放到了数据库里面。让我们来解决这个问题！

先上代码：
``` JavaScript

class BlockChainIterator {
  constructor(bc) {
    this.blockchain = bc;
    this.tip = this.blockchain.tip;
  }

  curr() {
    let data = this.blockchain.db.get(this.tip);
    let block = Block.fromString(data);
    this.tip = block.hash;
    return block;
  }

  prevBlock() {
    let block = this.curr();
    this.tip = block.prevBlockHash;
    if (!this.tip)
      return null;
    return this.curr();
  }
}

```

通过BlockChain里面的方法获取到Iterator实例，可以调用 ```curr()``` 以及 ```prevBlock()``` 获取对应的block。注意，迭代器的初始状态为链中的 tip，因此区块将从尾到头（创世块为头），也就是从最新的到最旧的进行获取。实际上，**选择一个 tip 就是意味着给一条链“投票”**。一条链可能有多个分支，最长的那条链会被认为是主分支。在获得一个 tip （可以是链中的任意一个块）之后，我们就可以重新构造整条链，找到它的长度和需要构建它的工作。这同样也意味着，一个 tip 也就是区块链的一种标识符。

这就是数据库部分的内容了！