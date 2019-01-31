const Web3 = require('web3')
const env = require('./loadEnv')

const {
  HOME_RPC_URL,
  FOREIGN_RPC_URL,
  DEPLOYMENT_ACCOUNT_PRIVATE_KEY
} = env

const homeProvider = new Web3.providers.HttpProvider(HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

const deploymentPrivateKey = Buffer.from(DEPLOYMENT_ACCOUNT_PRIVATE_KEY, 'hex')

module.exports = {
  web3Home,
  web3Foreign,
  deploymentPrivateKey
}
