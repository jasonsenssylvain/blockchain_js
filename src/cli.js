const program     = require('commander');

const Block       = require("./block.js");
const BlockChain  = require("./blockchain.js");

program
  .version('0.1.0')
  .option('-a, --addblock', 'Default empty',)
  .option('-p, --printchain')
  .parse(process.argv);



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
  let currBlock = iterator.curr();
  console.log(currBlock);
  while(iterator.hasNext()) {
    let prev = iterator.next();
    console.log(prev);
  }
}
