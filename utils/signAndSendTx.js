'use strict';
const EthereumTx = require('ethereumjs-tx');
const Keythereum = require('keythereum');
const fs = require('fs');
const path = require('path');
/*
 * Expects the following structure for tx_details:
  {
    from:      "0x...",
    to:        "0x...",
    value:     1234, // defaults to 0
    gasPrice:  4321, // defaults to 1 gwei
    gasLimit:  1234, // runs estimateGas if empty
    method:    myContract.myMethod(param1, param2, ...) // optional
    nonce:     1324, // auto-calculated if empty
  }
 * If privateKey is empty, it is recovered from json file in /accounts/keystore folder
 * Returns sendSignedTransaction promise.
*/

const keysDir = path.join(__dirname, '../accounts/');
console.log('  **** pwd =', __dirname);
const keysPassword = fs.readFileSync(
  path.join(__dirname, '../config/password'),
  'utf-8'
).trim();

function getPrivateKey(address) {
  var key = Keythereum.importFromFile(address, keysDir);
  var privateKey = Keythereum.recover(keysPassword, key);
  return privateKey;
}

module.exports = async function (web3, tx_details, privateKey) {
  let from = tx_details.from;
  let to = tx_details.to;
  let value = web3.utils.toHex(tx_details.value || 0);
  console.log('  **** from =', from);
  console.log('  **** to =', to);
  console.log('  **** value =', value);

  let gasPrice = web3.utils.toWei('1', 'gwei');
  if (tx_details.gasPrice != null) {
    gasPrice = tx_details.gasPrice;
  }
  console.log('  **** gasPrice =', gasPrice);

  // defaults for plain eth-transfer transaction
  let data = '0x';
  let egas = '21000';
  if (tx_details.method != null) {
    data = tx_details.method.encodeABI();
  }
  if (tx_details.gasLimit == null) {
    egas = await tx_details.method.estimateGas({ from });
  }
  else {
    egas = tx_details.gasLimit;
  }
  console.log('  **** data =', data);
  console.log('  **** egas =', egas);

  let nonce;
  if (tx_details.nonce == null) {
    nonce = await web3.eth.getTransactionCount(from);
  }
  else {
    nonce = tx_details.nonce;
  }
  console.log('  **** nonce =', nonce);

  let chainId = await web3.eth.net.getId();
  console.log('  **** chainId =', chainId);

  if (privateKey == null) {
    privateKey = getPrivateKey(from);
  }

  let _tx = {
    from:      from,
    to:        to,
    value:     web3.utils.toHex(value),
    gasPrice:  web3.utils.toHex(gasPrice),
    data:      data,
    gasLimit:  web3.utils.toHex(egas),
    nonce:     web3.utils.toHex(nonce),
    chainId:   chainId,
  };
  console.log('  **** _tx =', _tx);
  let tx = new EthereumTx(_tx);
  console.log('  **** tx =', tx);
  tx.sign(privateKey);
  let serializedTx = tx.serialize();

  return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
}
