// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAMONEY is IERC20 {
    event VaultFeeBurned(address indexed payer, uint256 amount);
    function payVaultFee(address _from, uint256 _amount) external returns (bool);
    function setVaultAddress(address _vaultAddress) external;
    function setEvolutionReserve(address _evolutionReserve) external;
    function activateToken() external returns (bool);
    function genesisDistribution(
        address ecosystemFund,
        address strategicReserve,
        address publicSale,
        address founders,
        address communityIncentives
    ) external;
}
