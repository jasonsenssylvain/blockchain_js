const program     = require('commander');

const Block       = require("./block.js");
const BlockChain  = require("./blockchain.js");
const {Transaction} = require('./transaction.js');

program
  .version('0.1.0')
  .option('--addblock', 'Default empty',)
  .option('--printchain')
  .parse(process.argv);

program
  .command('addblockchain')
  .description('addblockchain for address')
  .option("-s, --address [addr]", "Which address to use")
  .action(function(options){
    var addr = options.address || "";
    let bc = BlockChain.NewBlockChain(addr);

    let iterator = bc.getBlockIterator();
    let currBlock = iterator.curr();
    console.log(currBlock);
    while(iterator.hasNext()) {
      let prev = iterator.next();
      console.log(prev);
    }
  });

program
  .command('getBalance')
  .description('getBalance for address')
  .option("-s, --address [addr]", "Which address to use")
  .action(function(options){
    var addr = options.address || "";
    let bc = BlockChain.NewBlockChain(addr);

    let UTXOs = bc.findUTXO(addr);
    let amount = 0;
    for (let i = 0; i < UTXOs.length; i ++) {
      amount += UTXOs[i].value;
    }

    console.log(`Balance of ${addr}: ${amount}`);
  });

program
  .command('send')
  .description('send value')
  .option("-s, --sendAddress [sendAddress]", "Which address to use")
  .option("-t, --toAddress [toAddress]", "Which address to use")
  .option("-v, --value [value]", "Value")
  .action(function(options){
    let sendAddr = options.sendAddress;
    let toAddr = options.toAddress;
    let value = options.value;

    let bc = BlockChain.NewBlockChain();
    let tx = Transaction.NewUTXOTransaction(sendAddr, toAddr, value, bc);
    bc.mineBlock([tx]);

    console.log(`Success!`);
  });

program.parse(process.argv);


let addblock = program.addblock;
console.log(`addBlock: ${addblock}`);
if (addblock && addblock != '') {
  let bc = BlockChain.NewBlockChain();
  bc.addBlock(addblock);

  let iterator = bc.getBlockIterator();
  let currBlock = iterator.curr();
  console.log(currBlock);
}

let printchain = program.printchain; 
console.log(`printchain: ${printchain}`);
if (printchain && printchain != '') {
  let bc = BlockChain.NewBlockChain();
  let iterator = bc.getBlockIterator();
  while(iterator.hasNext()) {
    let prev = iterator.next();
    console.log(JSON.stringify(prev));
  }
}
