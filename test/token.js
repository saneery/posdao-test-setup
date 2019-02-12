const Token = artifacts.require('ERC677BridgeTokenRewardableMock')
const constants = require("../utils/constants");
const BN = web3.utils.BN;

const ValidatorSetContract = require("../utils/getContract")("ValidatorSetAuRa", web3);

contract('TestToken', _accounts => {
  console.log(_accounts);
  let has_correct_account = false;
  for (const i of _accounts) {
    assert.equal(typeof i, 'string');
    if (constants.OWNER === i) {
      has_correct_account = true;
      break;
    }
  }
  // assert.equal(has_correct_account, true);
  it('should have 2000 initial supply', async () => {
    var instance = await Token.deployed()
    var supply = await instance.totalSupply.call()
    assert.equal(supply.valueOf().toString(), web3.utils.toWei("2000000000"), "the initial supply isn't 2000")
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
    assert.equal(balance.valueOf().toString(), web3.utils.toWei("1000000000"), "the validator doesn't have 1000")
  })

  it('can stake', async () => {
    const minStake = await ValidatorSetContract.instance.methods.getCandidateMinStake().call()
    assert.equal(minStake.valueOf(), web3.utils.toWei("1"), "the min stake isn't 1")
    const allowed = await ValidatorSetContract.instance.methods.areStakeAndWithdrawAllowed().call()
    assert.equal(allowed.valueOf(), true, "not allowed")
    let opts = {
      from: constants.OWNER,
      gasPrice: "1",
      gas: "2000000",
    };

    try {
      await ValidatorSetContract.instance.methods.stake(constants.OWNER, web3.utils.toWei("100000")).send(opts);
    } catch (err) {
      console.log(err);
      assert.equal(0, 1);
    }
  });
})
