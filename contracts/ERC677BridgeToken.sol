pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "./IBurnableMintableERC677Token.sol";
import "./ERC677Receiver.sol";

contract Owned {
    event NewOwner(address indexed old, address indexed current);

    address public owner = msg.sender;

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function setOwner(address _new) external onlyOwner {
        emit NewOwner(owner, _new);
        owner = _new;
    }
}

contract ERC677BridgeToken is
    Owned,
    IBurnableMintableERC677Token,
    ERC20Detailed,
    ERC20Burnable,
    ERC20Mintable {

    address public bridgeContract;

    event ContractFallbackCallFailed(address from, address to, uint value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals)
            public ERC20Detailed(_name, _symbol, _decimals) {}

    function setBridgeContract(address _bridgeContract) public onlyOwner {
        require(_bridgeContract != address(0) && isContract(_bridgeContract));
        bridgeContract = _bridgeContract;
    }

    modifier validRecipient(address _recipient) {
        require(_recipient != address(0) && _recipient != address(this));
        _;
    }

    function transferAndCall(address _to, uint _value, bytes calldata _data)
        external validRecipient(_to) returns (bool)
    {
        require(superTransfer(_to, _value));
        emit Transfer(msg.sender, _to, _value, _data);

        if (isContract(_to)) {
            require(contractFallback(_to, _value, _data));
        }
        return true;
    }

    function getTokenInterfacesVersion() public pure returns(uint64 major, uint64 minor, uint64 patch) {
        return (2, 0, 0);
    }

    function superTransfer(address _to, uint256 _value) internal returns(bool)
    {
        return super.transfer(_to, _value);
    }

    function transfer(address _to, uint256 _value) public returns (bool)
    {
        require(superTransfer(_to, _value));
        if (isContract(_to) && !contractFallback(_to, _value, new bytes(0))) {
            if (_to == bridgeContract) {
                revert();
            } else {
                emit ContractFallbackCallFailed(msg.sender, _to, _value);
            }
        }
        return true;
    }

    function contractFallback(address _to, uint _value, bytes memory _data)
        private
        returns(bool)
    {
        // FIXME
        /* return _to.call(abi.encodeWithSignature( */
        /*     "onTokenTransfer(address,uint,bytes calldata)", */
        /*     msg.sender, _value, _data)); */
        return false;
    }

    function isContract(address _addr)
        internal
        view
        returns (bool)
    {
        uint length;
        assembly { length := extcodesize(_addr) }
        return length > 0;
    }

    function finishMinting() public returns (bool) {
        revert();
    }

    function renounceOwnership() public onlyOwner {
        revert();
    }

    function claimTokens(address _token, address _to) public onlyOwner {
        require(_to != address(0));
        if (_token == address(0)) {
            ERC20(_token).transfer(_to, address(this).balance);
            return;
        }

        ERC20Detailed token = ERC20Detailed(_token);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(_to, balance));
    }
}
