// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./IAMONEY.sol";
import "./ISacredVault.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Errors.sol"; // 导入自定义错误

contract SacredVault is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant BENEFICIARY_ROLE = keccak256("BENEFICIARY_ROLE");

    IAMONEY public amoneyToken;

    struct Vault {
        address creator;
        address currentOwner;
        uint256 creationDate;
        uint256 lastMaintenance;
        VaultStatus status;
        string metadataURI;
        address[] beneficiaries;
        mapping(address => uint256) shares;
        ISacredVault.InheritanceCondition[] conditions;
        uint256 unlockingTimestamp; // For lock period after inheritance
        uint256 culturalEnergy; // Cultural Energy
    }
    
    enum VaultStatus { Active, Inherited, Dissolved }
    
    event VaultCreated(uint256 indexed vaultId, address indexed creator);
    event InheritanceTriggered(uint256 indexed vaultId, address indexed oldOwner, address indexed newOwner, ISacredVault.ConditionType conditionType);
    event MaintenanceFeePaid(uint256 indexed vaultId, uint256 amount);
    event ConditionAdded(uint256 indexed vaultId, ISacredVault.ConditionType conditionType, uint256 triggerValue);
    event VaultUnlocked(uint256 indexed vaultId);

    mapping(uint256 => Vault) public vaults;
    uint256 public vaultCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _amoneyToken, address initialAdmin) public virtual initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        amoneyToken = IAMONEY(_amoneyToken);
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }
    
    function createSacredVault(
        address _creator,
        address[] calldata _beneficiaries,
        uint256[] calldata _shares,
        string calldata _metadataURI,
        ISacredVault.InheritanceCondition[] calldata _conditions
    ) external returns (uint256) {
        if (_beneficiaries.length != _shares.length) revert ArrayLengthMismatch();
        uint256 totalShares = 0;
        for (uint i = 0; i < _shares.length; i++) {
            totalShares += _shares[i];
        }
        if (totalShares != 1000) revert TotalSharesMismatch();
        
        uint256 vaultId = vaultCounter;
        vaultCounter++;
        Vault storage newVault = vaults[vaultId];
        
        newVault.creator = _creator;
        newVault.currentOwner = _creator;
        newVault.creationDate = block.timestamp;
        newVault.lastMaintenance = block.timestamp;
        newVault.status = VaultStatus.Active;
        newVault.metadataURI = _metadataURI;
        for (uint i = 0; i < _conditions.length; i++) {
            newVault.conditions.push(_conditions[i]);
        }
        
        for (uint i = 0; i < _beneficiaries.length; i++) {
            newVault.beneficiaries.push(_beneficiaries[i]);
            newVault.shares[_beneficiaries[i]] = _shares[i];
            _grantRole(BENEFICIARY_ROLE, _beneficiaries[i]);
        }
        
        _grantRole(CREATOR_ROLE, _creator);
        
        emit VaultCreated(vaultId, _creator);
        return vaultId;
    }

    function addInheritanceCondition(uint256 _vaultId, ISacredVault.InheritanceCondition calldata _condition) external {
        Vault storage vault = vaults[_vaultId];
        if (vault.currentOwner != msg.sender) revert OnlyOwnerCanAddConditions();
        vault.conditions.push(_condition);
        emit ConditionAdded(_vaultId, _condition.conditionType, _condition.triggerValue);
    }
    
    function executeInheritance(uint256 _vaultId, uint256 _conditionIndex) external nonReentrant {
        Vault storage vault = vaults[_vaultId];
        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (_vaultId >= vaultCounter) revert InvalidVaultId(); // Added check for valid vaultId
        if (_conditionIndex >= vault.conditions.length) revert InvalidConditionIndex();

        ISacredVault.InheritanceCondition storage condition = vault.conditions[_conditionIndex];
        bool isMet = _isConditionMet(condition); 
        if (!isMet) revert InheritanceConditionNotMet();

        vault.status = VaultStatus.Inherited;
        vault.unlockingTimestamp = block.timestamp + 30 days;

        address newOwner = vault.beneficiaries[0]; // Simplified: first beneficiary inherits
        vault.currentOwner = newOwner;
        
        emit InheritanceTriggered(_vaultId, vault.creator, newOwner, condition.conditionType);
    }

    function unlockVault(uint256 _vaultId) external {
        Vault storage vault = vaults[_vaultId];
        if (vault.status != VaultStatus.Inherited) revert VaultNotInInheritedState();
        if (block.timestamp < vault.unlockingTimestamp) revert LockPeriodNotOver();
        if (vault.currentOwner != msg.sender) revert OnlyNewOwnerCanUnlock();

        vault.status = VaultStatus.Active;
        emit VaultUnlocked(_vaultId);
    }
    
    function payMaintenanceFee(uint256 _vaultId, uint256 _amount) external nonReentrant {
        Vault storage vault = vaults[_vaultId];
        if (vault.currentOwner != msg.sender) revert Unauthorized(); // Use generic Unauthorized for now
        
        if (!amoneyToken.payVaultFee(msg.sender, _amount)) revert FeePaymentFailed();
        
        vault.lastMaintenance = block.timestamp;
        vault.culturalEnergy += _amount / 10; // 10% of fee becomes cultural energy
        emit MaintenanceFeePaid(_vaultId, _amount);
    }
    
    function getVaultDetails(
        uint256 _vaultId
    ) external view returns (
        address creator,
        address currentOwner,
        uint256 creationDate,
        uint256 lastMaintenance,
        VaultStatus status,
        string memory metadataURI,
        address[] memory beneficiaries,
        uint256 culturalEnergy
    ) {
        Vault storage vault = vaults[_vaultId];
        return (
            vault.creator,
            vault.currentOwner,
            vault.creationDate,
            vault.lastMaintenance,
            vault.status,
            vault.metadataURI,
            vault.beneficiaries,
            vault.culturalEnergy
        );
    }

    function getVaultShares(uint256 _vaultId, address _beneficiary) external view returns (uint256) {
        return vaults[_vaultId].shares[_beneficiary];
    }
    
    function _isConditionMet(ISacredVault.InheritanceCondition memory _condition) internal view returns (bool) {
        if (!_condition.isActive) return false;
        
        if (_condition.conditionType == ISacredVault.ConditionType.Time) {
            return block.timestamp >= _condition.triggerValue;
        }
        return false;
    }
}
