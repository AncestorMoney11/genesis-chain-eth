// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20Revert is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000000 * 10**18); // Mint a large supply to the deployer
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // Override transfer to always revert
    function _transfer(address from, address to, uint256 amount) internal override {
        revert("MockERC20Revert: transfer always reverts");
    }
}
