const Token = artifacts.require('ERC677BridgeTokenRewardableMock')
const constants = require("../utils/constants");

const ValidatorSetContract = require("../utils/getContract")("ValidatorSetAuRa", web3);

contract('TestToken', _accounts => {
  it('should have 2000 initial supply', async () => {
    var instance = await Token.deployed()
    var supply = await instance.totalSupply.call()
    assert.equal(supply.valueOf(), web3.utils.toWei("2000"), "the initial supply isn't 2000")
  })

  it('validatorSetContract field value should match ValidatorSet contract address', async () => {
    let instance = await Token.deployed();
    let validatorSetContractAddress = await instance.validatorSetContract.call();
    assert.equal(validatorSetContractAddress.valueOf(), ValidatorSetContract.address);
  });

  it('deployed address should match erc20TokenContract in ValidatorSet contract', async () => {
    let instance = await Token.deployed();
    let erc20TokenContract = await ValidatorSetContract.instance.methods.erc20TokenContract().call();
    assert.equal(erc20TokenContract.valueOf(), instance.address);
  });

  it('validator has 1000', async () => {
    var instance = await Token.deployed()
    var balance = await instance.balanceOf.call(constants.VALIDATOR1)
    assert.equal(balance.valueOf(), web3.utils.toWei("1000"), "the validator doesn't have 1000")
  })

  it('can stake', async () => {
    var minStake = await ValidatorSetContract.instance.methods.getCandidateMinStake().call()
    assert.equal(minStake.valueOf(), web3.utils.toWei("1"), "the min stake isn't 1")
    var allowed = await ValidatorSetContract.instance.methods.areStakeAndWithdrawAllowed().call()
    assert.equal(allowed.valueOf(), true, "not allowed")
    let opts = {
      from: constants.VALIDATOR1,
      gasPrice: "1",
      gas: "2000000",
    };
    try {
      await ValidatorSetContract.instance.methods.stake(constants.VALIDATOR1, web3.utils.toWei("1000")).send(opts);
    } catch (err) {
      console.log(err);
      assert.equal(0, 1);
    }
  });
})
