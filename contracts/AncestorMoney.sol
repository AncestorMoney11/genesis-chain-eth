// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Errors.sol";

contract AncestorMoney is Initializable, ERC20Upgradeable, AccessControlUpgradeable, PausableUpgradeable, ERC20BurnableUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_SUPPLY = 99_999_999_999 * (10**9);
    uint256 public currentSupply;
    address public evolutionReserve;
    address public vaultAddress;

    // 新增：转账税白名单
    mapping(address => bool) public isTaxExempt;

    event TokenActivated();
    event EvolutionReserveUpdated(address indexed newAddress);
    event VaultAddressUpdated(address indexed newAddress);
    event VaultFeeBurned(address indexed payer, uint256 amount);
    event TaxExemptUpdated(address indexed account, bool exempt);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialAdmin, address _evolutionReserve, address _vaultAddress) public initializer {
        __ERC20_init("AncestorMoney", "AMONEY");
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);

        // 初始管理员和金库地址默认免税
        isTaxExempt[initialAdmin] = true;
        isTaxExempt[_vaultAddress] = true;

        _pause();
        evolutionReserve = _evolutionReserve;
        vaultAddress = _vaultAddress;
        currentSupply = 0;
    }

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
        _revokeRole(MINTER_ROLE, _msgSender());
    }
    
    function decimals() public pure override returns (uint8) { return 9; }
    
    function activateToken() public onlyRole(PAUSER_ROLE) whenPaused returns (bool) {
        _unpause();
        emit TokenActivated();
        return true;
    }

    // 新增：设置地址免税状态
    function setTaxExempt(address account, bool exempt) public onlyRole(DEFAULT_ADMIN_ROLE) {
        isTaxExempt[account] = exempt;
        emit TaxExemptUpdated(account, exempt);
    }

    function _transfer(address from, address to, uint256 amount) internal override {
        if (paused()) revert TokenPaused(); // 检查暂停状态

        // 如果发送方或接收方免税，则不收取销毁税
        if (isTaxExempt[from] || isTaxExempt[to]) {
            super._transfer(from, to, amount);
            return;
        }

        uint256 burnRate = 5; // 0.5% 销毁率
        uint256 burnedAmount = (amount * burnRate) / 1000;
        uint256 amountToRecipient = amount - burnedAmount;
        
        if (amountToRecipient > amount) revert InvalidAmount();

        super._transfer(from, to, amountToRecipient);
        if (burnedAmount > 0) _burn(from, burnedAmount);
    }
    
    // 修复 payVaultFee 漏洞：现在它要求调用者（vaultAddress）必须从用户（_from）那里获得明确的授权（allowance）
    function payVaultFee(address _from, uint256 _amount) public returns (bool) {
        if (msg.sender != vaultAddress) revert OnlyVaultCanPayFees();
        
        // 消耗 _from 对 msg.sender (vaultAddress) 的授权
        uint256 currentAllowance = allowance(_from, msg.sender);
        if (currentAllowance < _amount) revert InsufficientAllowance();
        _spendAllowance(_from, msg.sender, _amount);
        
        // 直接从 _from 地址销毁代币
        _burn(_from, _amount);
        
        emit VaultFeeBurned(_from, _amount);
        return true;
    }

    function setEvolutionReserve(address _evolutionReserve) public onlyRole(DEFAULT_ADMIN_ROLE) {
        evolutionReserve = _evolutionReserve;
        emit EvolutionReserveUpdated(_evolutionReserve);
    }
    
    function setVaultAddress(address _vaultAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        vaultAddress = _vaultAddress;
        emit VaultAddressUpdated(_vaultAddress);
    }
}
