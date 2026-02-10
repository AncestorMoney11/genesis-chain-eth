// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "./ISacredVault.sol";

contract ReentrancyAttack {
    ISacredVault public immutable targetVault;
    address public immutable amoneyTokenAddress;

    constructor(address _targetVault, address _amoneyTokenAddress) {
        targetVault = ISacredVault(_targetVault);
        amoneyTokenAddress = _amoneyTokenAddress;
    }

    function attack(uint256 _vaultId, uint256 _amount) public {
        // 第一次调用 payMaintenanceFee
        targetVault.payMaintenanceFee(_vaultId, _amount);
    }

    // fallback 函数，用于接收 ETH，但在此测试中不直接使用
    receive() external payable {}

    // 如果需要接收 ERC20 代币，可以实现 onERC20Received，但此处测试重入，不涉及代币接收

    function attackInheritance(uint256 _vaultId, uint256 _conditionIndex) external {
        targetVault.distributeInheritance(_vaultId);
    }
}
