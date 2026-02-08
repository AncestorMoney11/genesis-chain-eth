// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol"; // Using AccessControl instead of Ownable2Step
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Errors.sol"; // 导入自定义错误

contract AncestorMoney is Initializable, ERC20Upgradeable, AccessControlUpgradeable, PausableUpgradeable, ERC20BurnableUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // For genesis distribution

    uint256 public constant MAX_SUPPLY = 99_999_999_999 * (10**9);
    uint256 public currentSupply;
    address public evolutionReserve;
    address public vaultAddress;

    event TokenActivated();
    event EvolutionReserveUpdated(address indexed newAddress);
    event VaultAddressUpdated(address indexed newAddress);
    event VaultFeeBurned(address indexed payer, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialAdmin, address _evolutionReserve, address _vaultAddress) public initializer {
        // Following C3 Linearization for initializer calls
        __ERC20_init("AncestorMoney", "AMONEY");
        __ERC20Burnable_init(); // ERC20Burnable depends on ERC20
        __Pausable_init();
        __AccessControl_init(); // Initialize AccessControl
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin); // Grant MINTER_ROLE to initialAdmin for genesis distribution

        _pause();
        evolutionReserve = _evolutionReserve;
        vaultAddress = _vaultAddress;
        currentSupply = 0;
    }

    // UUPS 升级授权，只有拥有 DEFAULT_ADMIN_ROLE 的地址可以授权升级
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function genesisDistribution(
        address ecosystemFund,
        address strategicReserve,
        address publicSale,
        address founders,
        address communityIncentives
    ) public onlyRole(MINTER_ROLE) {
        if (currentSupply != 0) revert GenesisDistributionAlreadyPerformed();
        uint256 ecosystemFundAmount = 30_000_000_000 * (10**9);
        uint256 strategicReserveAmount = 20_000_000_000 * (10**9);
        uint256 publicSaleAmount = 15_000_000_000 * (10**9);
        uint256 foundersAmount = 10_000_000_000 * (10**9);
        uint256 communityIncentivesAmount = 24_999_999_999 * (10**9);

        _mint(ecosystemFund, ecosystemFundAmount);
        _mint(strategicReserve, strategicReserveAmount);
        _mint(publicSale, publicSaleAmount);
        _mint(founders, foundersAmount);
        _mint(communityIncentives, communityIncentivesAmount);

        currentSupply = MAX_SUPPLY;
        _revokeRole(MINTER_ROLE, _msgSender()); // Revoke MINTER_ROLE after distribution
    }
    
    // 将 decimals() 函数改为 pure，因为它不读取或修改状态变量
    function decimals() public pure override returns (uint8) { return 9; }
    
    function activateToken() public onlyRole(PAUSER_ROLE) whenPaused returns (bool) {
        _unpause();
        emit TokenActivated();
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal override {
        if (paused()) revert TokenPaused(); // 使用自定义错误替换 whenNotPaused 内部检查
        uint256 burnRate = 5; // 0.5% 销毁率
        uint256 burnedAmount = (amount * burnRate) / 1000;
        uint256 amountToRecipient = amount - burnedAmount;
        
        // 确保销毁金额不会导致 amountToRecipient 溢出或为负
        if (amountToRecipient > amount) revert InvalidAmount(); 

        super._transfer(from, to, amountToRecipient);
        if (burnedAmount > 0) _burn(from, burnedAmount);
    }
    
    function setEvolutionReserve(address _evolutionReserve) public onlyRole(DEFAULT_ADMIN_ROLE) {
        evolutionReserve = _evolutionReserve;
        emit EvolutionReserveUpdated(_evolutionReserve);
    }
    
    function setVaultAddress(address _vaultAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        vaultAddress = _vaultAddress;
        emit VaultAddressUpdated(_vaultAddress);
    }
    
    function payVaultFee(address _from, uint256 _amount) public returns (bool) {
        if (msg.sender != vaultAddress) revert OnlyVaultCanPayFees();
        _transfer(_from, address(this), _amount);
        emit VaultFeeBurned(_from, _amount);
        return true;
    }
}
