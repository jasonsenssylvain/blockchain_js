交易（2）
========

## 引言

在这个系列文章的一开始，我们就提到了，区块链是一个分布式数据库。不过在之前的文章中，我们选择性地跳过了“分布式”这个部分，而是将注意力都放到了“数据库”部分。到目前为止，我们几乎已经实现了一个区块链数据库的所有元素。今天，我们将会分析之前跳过的一些机制。而在下一篇文章中，我们将会开始讨论区块链的分布式特性。

之前的系列文章：

1. 基本原型
2. 工作量证明
3. 持久化和命令行接口
4. 交易（1）
5. 地址

>本文的代码实现变化很大，请点击 [这里](https://github.com/jasoncodingnow/blockchain_js/compare/part5...part6#files_bucket) 查看所有的代码更改。

## 奖励

在上一篇文章中，我们略过的一个小细节是挖矿奖励。现在，我们已经可以来完善这个细节了。

挖矿奖励，实际上就是一笔 coinbase 交易。当一个挖矿节点开始挖出一个新块时，它会将交易从队列中取出，并在前面附加一笔 coinbase 交易。coinbase 交易只有一个输出，里面包含了矿工的公钥哈希。

实现奖励，非常简单，更新 `send` 即可：






## 代码实现细节：

首先，创建UTXOSet，该class用于放置所有的未花费utxo，相当于blockchain做了一层缓存。方便计算等。
因此，首先在blockchain增加方法，findUTXO，该方法用于查找到目前blockchain里面所有的为花费utxo，缓存到chainstate数据库中，给了utxo一层缓存。这个方法其实是用之前的 findUnspentTransactions 改写的，之前这个函数根据输入找出特定的unspentTransactions，目前不需要了。

具体代码如下：

```JavaScript

  // in PART5: change address to pubKeyHash
  // change to findUTXO in part6
  findUTXO() {
    let UTXO = {};  // 原本是array，修改为 map[] 

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

          // add in part6
          if (UTXO[txId] == null || UTXO[txId] == undefined)
            UTXO[txId] = [];
          let output = tx.vOut[outIdx];
          UTXO[txId].push(output);


          // remove in part6
          // let out = tx.vOut[outIdx];
          // // change in PART5
          // if (out.isLockedWithKey(pubKeyHash)) {
          //   unspentTXs.push(tx);
          // }
        }

        if (tx.isCoinbase() == false) {
          for (let k = 0; k < tx.vIn.length; k ++) {
            let vIn = tx.vIn[k];

            let inTxId = vIn.txId;
            if (spentTXOs[inTxId] == null || spentTXOs[inTxId] == undefined)
              spentTXOs[inTxId] = [];

            for (let n in vIn.vOut) {
              let out = vIn.vOut[n];
              spentTXOs[inTxId].spend(out);
            }

            // change in PART5
            // if (vIn.usersKey(pubKeyHash)) {
            //   let vInId = vIn.txId;
            //   if (!spentTXOs[vInId]) {
            //     spentTXOs[vInId] = [];
            //   }
            //   spentTXOs[vInId].push(vIn.vOut);
            // }
          }
        }
      }
    }

    return unspentTXs;
  }

```
