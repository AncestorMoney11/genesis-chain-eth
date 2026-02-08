// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

// 定义项目通用的自定义错误，以提高代码可读性、Gas 效率和错误处理的清晰度。
error Unauthorized();
error InvalidAmount();
error MaxSupplyExceeded();
error GenesisDistributionAlreadyPerformed();
error TokenNotPaused();
error TokenPaused();
error InvalidVaultId();
error ArrayLengthMismatch();
error TotalSharesMismatch();
error OnlyOwnerCanAddConditions();
error VaultNotActive();
error InvalidConditionIndex();
error InheritanceConditionNotMet();
error VaultNotInInheritedState();
error LockPeriodNotOver();
error OnlyNewOwnerCanUnlock();
error FeePaymentFailed();
error OnlyEvolutionReserveCanRecordCulturalEvents();
error OnlyVaultCanPayFees();
error OnlyProxyAdminOwner();
error NotUUPSProxy();
error InvalidAddress();
error DepositTooSmall();
error TransferFailed();
error InsufficientBalance();
