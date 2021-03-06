// Assumes network is started

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const constants = require('../utils/constants');
const SnS = require('../utils/signAndSendTx.js');
const web3 = new Web3('http://localhost:8541');
const BN = web3.utils.BN;
const BlockRewardAuRa = require(path.join(__dirname, '../utils/getContract'))('BlockRewardAuRa', web3);
const StakingAuRa = require(path.join(__dirname, '../utils/getContract'))('StakingAuRa', web3);
const OWNER = constants.OWNER;
const expect = require('chai')
    .use(require('chai-bn')(BN))
    .use(require('chai-as-promised'))
    .expect;
const pp = require('../utils/prettyPrint');
let tokenName = 'POSDAO';
let tokenSymbol = 'POS';
let tokenDecimals = 18;

function compileContract() {
    let input = {
        language: 'Solidity',
        sources: {
            'token.sol': {
                content: fs.readFileSync(path.join(__dirname, '../contracts/ERC677BridgeTokenRewardableMock.sol'), 'utf8'),
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };
    let compiledContract = JSON.parse( solc.compile(JSON.stringify(input)) );
    return compiledContract.contracts['token.sol']['ERC677BridgeTokenRewardableMock'];
}

async function main() {
    let compiledContract = compileContract();
    let abi = compiledContract.abi;
    let bytecode = compiledContract.evm.bytecode.object;

    let contract = new web3.eth.Contract(abi);
    console.log('**** Deploying StakingToken');
    let StakingTokenInstance = await contract
        .deploy({
            data: '0x' + bytecode,
            arguments: [tokenName, tokenSymbol, tokenDecimals],
        })
        .send({
            from: OWNER,
            gas: '4700000',
            gasPrice: '0',
        });
    let address = StakingTokenInstance.options.address;
    console.log('**** StakingToken deployed at:', address);

    console.log('**** Saving output to parity-data');
    let runtimeData = { abi, address };
    fs.writeFileSync(path.join(__dirname, '../parity-data/StakingToken.json'), JSON.stringify(runtimeData, null, 4));

    let tx;

    console.log('**** Set StakingAuRa address in StakingToken contract');
    tx = await SnS(web3, {
        from: OWNER,
        to: address,
        method: StakingTokenInstance.methods.setStakingContract(StakingAuRa.address),
        gasPrice: '0',
    });
    pp.tx(tx);
    expect(tx.status).to.equal(true);

    console.log('**** Set BlockRewardAuRa address in StakingToken contract');
    tx = await SnS(web3, {
        from: OWNER,
        to: address,
        method: StakingTokenInstance.methods.setBlockRewardContract(BlockRewardAuRa.address),
        gasPrice: '0',
    });
    pp.tx(tx);
    expect(tx.status).to.equal(true);

    console.log('**** Set StakingToken address in StakingAuRa');
    tx = await SnS(web3, {
        from: OWNER,
        to: StakingAuRa.address,
        method: StakingAuRa.instance.methods.setErc20TokenContract(address),
        gasPrice: '0',
    });
    pp.tx(tx);
    expect(tx.status).to.equal(true);

    let contractAddress;

    console.log('**** Check that StakingAuRa address in StakingToken contract is correct');
    contractAddress = await StakingTokenInstance.methods.stakingContract().call();
    expect(contractAddress).to.equal(StakingAuRa.address);

    console.log('**** Check that BlockRewardAuRa address in StakingToken contract is correct');
    contractAddress = await StakingTokenInstance.methods.blockRewardContract().call();
    expect(contractAddress).to.equal(BlockRewardAuRa.address);

    console.log('**** Check that StakingToken address in StakingAuRa is correct');
    contractAddress = await StakingAuRa.instance.methods.erc20TokenContract().call();
    expect(contractAddress).to.equal(address);
}

main();
