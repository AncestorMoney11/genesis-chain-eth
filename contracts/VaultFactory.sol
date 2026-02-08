// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ISacredVault.sol";

contract VaultFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    ProxyAdmin public proxyAdmin;
    address public vaultImplementation;
    address[] public allVaults;
    mapping(address => address[]) public userVaults;
    
    event VaultProxyCreated(address indexed proxy, address indexed implementation, address indexed creator);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialAdmin, address _vaultImplementation) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _transferOwnership(initialAdmin);
        
        proxyAdmin = new ProxyAdmin();
        proxyAdmin.transferOwnership(initialAdmin);
        vaultImplementation = _vaultImplementation;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function createUpgradeableVault(
        address _amoneyToken,
        address[] calldata _beneficiaries,
        uint256[] calldata _shares,
        string calldata _metadataURI,
        ISacredVault.InheritanceCondition[] calldata _conditions
    ) external returns (address) {
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            vaultImplementation,
            address(proxyAdmin),
            abi.encodeWithSelector(ISacredVault.initialize.selector, _amoneyToken, msg.sender)
        );
        
        ISacredVault vault = ISacredVault(address(proxy));
        vault.createSacredVault(msg.sender, _beneficiaries, _shares, _metadataURI, _conditions);
        
        allVaults.push(address(proxy));
        userVaults[msg.sender].push(address(proxy));
        emit VaultProxyCreated(address(proxy), vaultImplementation, msg.sender);
        return address(proxy);
    }
}
