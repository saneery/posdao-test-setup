const BN = web3.utils.BN;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(BN))
  .should();
const Token = artifacts.require('ERC677BridgeTokenRewardableMock');
const ValidatorSetContract = require('../utils/getContract')('ValidatorSetAuRa', web3);
const constants = require('../utils/constants');

contract('TestToken', async accounts => {
  let instance;

  // NOTE: This test cannot succeed twice.
  //
  // it('should have 0 initial supply', async () => {
  //   instance = await Token.deployed();
  //   let supply = await instance.totalSupply.call();
  //   assert.equal(supply.valueOf(), 0, "the initial supply isn't 0");
  // });

  it('validatorSetContract field value should match ValidatorSet contract address', async () => {
    instance = await Token.deployed();
    let validatorSetContractAddress = await instance.validatorSetContract.call();
    assert.equal(validatorSetContractAddress.valueOf(), ValidatorSetContract.address);
  });

  it('deployed address should match erc20TokenContract in ValidatorSet contract', async () => {
    instance = await Token.deployed();
    let erc20TokenContract = await ValidatorSetContract.instance.methods.erc20TokenContract().call();
    assert.equal(erc20TokenContract.valueOf(), instance.address);
  });

  it('should mint staking tokens to candidates', async () => {
    instance = await Token.deployed();
    let minStake = await ValidatorSetContract.instance.methods.getCandidateMinStake().call()
        .should.be.fulfilled;
    const candidateStake = new BN(minStake.toString());
    for (candidate of constants.CANDIDATES) {
      const balanceBefore = await instance.balanceOf(candidate);
      await instance.mint(candidate, candidateStake).should.be.fulfilled;
      const balanceAfter = await instance.balanceOf(candidate);
      balanceAfter.should.be.bignumber.equal(balanceBefore.add(candidateStake));
    }
  });

  it('candidates should make stakes on themselves', async () => {
    instance = await Token.deployed();
    let minStake = await ValidatorSetContract.instance.methods.getCandidateMinStake().call()
        .should.be.fulfilled;
    console.log('  **** minStake =', minStake);
    const gasPrice = '1000000000';
    const gas = '2000000';
    let fees = new BN(gasPrice).mul(new BN(gas));
    const send = require('../utils/signAndSendTx');
    for (var i = 0; i < 1; /*constants.CANDIDATES.length;*/ i++) {
      let candidate = constants.CANDIDATES[i];
      // let opts = {
      //   from: candidate,
      //   gasPrice: gasPrice,
      //   gas: gas
      // }
//      await ValidatorSetContract.instance.methods.stake(candidate, minStake)
//        .send(opts)
//        .should.be.fulfilled;

      let tx_details = {
	      from: candidate,
	      to:   ValidatorSetContract.address,
	      method: ValidatorSetContract.instance.methods.stake(candidate, minStake),
        gasLimit: '1000000',
      };
      console.log('  **** candidate = ', candidate);
      let ibalance = await instance.balanceOf(candidate);
      let istakeAmount = await ValidatorSetContract.instance.methods.stakeAmount(candidate, candidate).call();
      console.log('  **** ibalance =', ibalance);
      console.log('  **** istakeAmount =', istakeAmount);
      try {
        var egas = await ValidatorSetContract.instance.methods.stake(candidate, minStake).estimateGas({ from: candidate });
      }
      catch (e) {
        console.log('  **** EXCEPTION: ', e);
      }
      let status = await send(web3, tx_details, null);
      // console.log('  **** tx: status =', status.status, ' hash =', status.transactionHash, ' block number=', status.blockNumber);
      console.log('  **** tx status:', status);
      let ebalance = await instance.balanceOf(candidate);
      let stakeAmount = await ValidatorSetContract.instance.methods.stakeAmount(candidate, candidate).call();
      console.log('  **** ebalance =', ebalance);
      console.log('  **** stakeAmount =', stakeAmount);
    }
  });
})
