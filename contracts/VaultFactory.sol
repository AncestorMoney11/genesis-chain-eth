// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol"; // For deploying UUPS proxies
import "./ISacredVault.sol";
import "./Errors.sol"; // 导入自定义错误

contract VaultFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    address public vaultImplementation;
    address[] public allVaults;
    mapping(address => address[]) public userVaults;
    uint256 private vaultCounter;
    
    event VaultProxyCreated(address indexed proxy, address indexed implementation, address indexed creator);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialAdmin, address _vaultImplementation) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _transferOwnership(initialAdmin);
        if (_vaultImplementation == address(0)) revert InvalidAmount(); // Use InvalidAmount for zero address
        vaultImplementation = _vaultImplementation;
        vaultCounter = 0;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // 只有合约所有者可以授权升级
    }

    function createUpgradeableVault(
        address _amoneyToken,
        address[] calldata _beneficiaries,
        uint256[] calldata _shares,
        string calldata _metadataURI,
        ISacredVault.InheritanceCondition[] calldata _conditions
    ) external returns (address) {
        if (vaultImplementation == address(0)) revert InvalidAmount(); // Ensure implementation is set

        bytes memory initializeData = abi.encodeWithSelector(
            ISacredVault.initialize.selector,
            _amoneyToken,
            msg.sender // The creator of the vault becomes the initial admin of the vault proxy
        );

        ERC1967Proxy proxy = new ERC1967Proxy(vaultImplementation, initializeData);
        
        ISacredVault vault = ISacredVault(address(proxy));
        vault.createSacredVault(msg.sender, _beneficiaries, _shares, _metadataURI, _conditions);
        
        allVaults.push(address(proxy));
        userVaults[msg.sender].push(address(proxy));
        vaultCounter++;
        emit VaultProxyCreated(address(proxy), vaultImplementation, msg.sender);
        return address(proxy);
    }

    // 允许所有者更新 Vault 实现合约地址
    function setVaultImplementation(address _newVaultImplementation) external onlyOwner {
        if (_newVaultImplementation == address(0)) revert InvalidAmount(); // Use InvalidAmount for zero address
        vaultImplementation = _newVaultImplementation;
    }

    function getVaultCount() external view returns (uint256) {
        return vaultCounter;
    }

    function getUserVaultsCount(address _user) external view returns (uint256) {
        return userVaults[_user].length;
    }
}
