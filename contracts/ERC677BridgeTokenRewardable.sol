pragma solidity ^0.5.0;

import "./ERC677BridgeToken.sol";

contract ERC677BridgeTokenRewardable is ERC677BridgeToken {

    address public blockRewardContract;
    address public validatorSetContract;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) public ERC677BridgeToken(_name, _symbol, _decimals) {}

    function setBlockRewardContract(address _blockRewardContract) onlyOwner public {
        require(_blockRewardContract != address(0) && isContract(_blockRewardContract));
        blockRewardContract = _blockRewardContract;
    }

    function setValidatorSetContract(address _validatorSetContract) onlyOwner public {
        require(_validatorSetContract != address(0) && isContract(_validatorSetContract));
        validatorSetContract = _validatorSetContract;
    }

    modifier onlyBlockRewardContract() {
        require(msg.sender == blockRewardContract);
        _;
    }

    modifier onlyValidatorSetContract() {
        require(msg.sender == validatorSetContract);
        _;
    }

    function mintReward(
        address[] calldata _receivers,
        uint256[] calldata _rewards
    ) external onlyBlockRewardContract {
        for (uint256 i = 0; i < _receivers.length; i++) {
            address to = _receivers[i];
            uint256 amount = _rewards[i];
            _mint(to, amount);
        }
    }

    function stake(address _staker, uint256 _amount) external onlyValidatorSetContract {
        // Transfer `_amount` from `_staker` to `validatorSetContract`
        ERC20 token = ERC20(this);
        uint256 balance = token.balanceOf(_staker);
        require(_amount <= balance);

        token.transferFrom(_staker, validatorSetContract, _amount);
    }

    function withdraw(address _staker, uint256 _amount) external onlyValidatorSetContract {
        // Transfer `_amount` from `validatorSetContract` to `_staker`
        ERC20 token = ERC20(this);
        uint256 balance = token.balanceOf(validatorSetContract);
        require(_amount <= balance);

        token.transferFrom(validatorSetContract, _staker, _amount);
    }
}
