pragma solidity ^0.5.0;

contract ERC677Receiver {
    function onTokenTransfer(address, uint, bytes calldata) external returns(bool);
}
