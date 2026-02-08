// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

interface ISacredVault {
    enum ConditionType { Time, OraclePrice, Manual }

    struct InheritanceCondition {
        ConditionType conditionType;
        uint256 triggerValue;
        bool isActive;
    }

    // Add any external functions that VaultFactory needs to call on SacredVault here
    function initialize(address _amoneyToken, address initialAdmin) external;
    function createSacredVault(
        address _creator,
        address[] calldata _beneficiaries,
        uint256[] calldata _shares,
        string calldata _metadataURI,
        InheritanceCondition[] calldata _conditions
    ) external returns (uint256);
}
