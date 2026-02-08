// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract EvolutionReserve is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    mapping(address => uint256) public culturalEnergy;
    mapping(address => bytes32[]) public culturalEvents;
    address public neuralField;
    address public amoneyToken;
    
    event CulturalEventRecorded(address indexed user, bytes32 eventHash, uint256 energy);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _amoneyToken) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        amoneyToken = _amoneyToken;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    function recordCulturalEvent(address _user, uint256 _amount, bytes32 _context) external returns (bool) {
        require(msg.sender == amoneyToken || msg.sender == neuralField, "Unauthorized");
        uint256 energy = _amount / 10**9;
        culturalEnergy[_user] += energy;
        bytes32 eventHash = keccak256(abi.encodePacked(block.timestamp, _user, _amount, _context));
        culturalEvents[_user].push(eventHash);
        emit CulturalEventRecorded(_user, eventHash, energy);
        return true;
    }
}
