const assert = require('assert')
const Web3Utils = require('web3-utils')
const env = require('../loadEnv')

const { deployContract, privateKeyToAddress, sendRawTxForeign } = require('../utils')

const ERC677BridgeToken = require('../../build/contracts/ERC677BridgeToken.json')

const {
  DEPLOYMENT_ACCOUNT_PRIVATE_KEY,
  BRIDGEABLE_TOKEN_NAME,
  BRIDGEABLE_TOKEN_SYMBOL,
  BRIDGEABLE_TOKEN_DECIMALS,
  FOREIGN_RPC_URL
} = env

const DEPLOYMENT_ACCOUNT_ADDRESS = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)
const deploymentPrivateKey = Buffer.from(DEPLOYMENT_ACCOUNT_PRIVATE_KEY, 'hex')

const foreignProvider = new Web3.providers.HttpProvider(FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

async function deployToken () {
  let foreignNonce = await web3Foreign.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS)
  console.log('\n[Foreign] deploying ERC677 token')
  const erc677token = await deployContract(
    ERC677BridgeToken,
    [BRIDGEABLE_TOKEN_NAME, BRIDGEABLE_TOKEN_SYMBOL, BRIDGEABLE_TOKEN_DECIMALS],
    { from: DEPLOYMENT_ACCOUNT_ADDRESS, network: 'foreign', nonce: foreignNonce }
  )
  foreignNonce++
  console.log('[Foreign] ERC677 Token: ', erc677token.options.address)

  console.log('[Foreign] minting 100 tokens and transfer them to ', DEPLOYMENT_ACCOUNT_ADDRESS)
  const mintData = await erc677token.methods
        .mint(DEPLOYMENT_ACCOUNT_ADDRESS, '100000000000000000000')
        .encodeABI({ from: DEPLOYMENT_ACCOUNT_ADDRESS })
  const txMint = await sendRawTxForeign({
    data: mintData,
    nonce: foreignNonce,
    to: erc677token.options.address,
    privateKey: deploymentPrivateKey,
    url: FOREIGN_RPC_URL
  })
  assert.strictEqual(Web3Utils.hexToNumber(txMint.status), 1, 'Transaction Failed')

  console.log('\nToken deployment completed\n')
  return {
    erc677tokenAddress: erc677token.options.address
  }
}
module.exports = deployToken
