// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./Errors.sol";

contract EvolutionReserve is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    mapping(address => uint256) public culturalEnergy;
    mapping(address => bytes32[]) public culturalEvents;
    address public neuralField;
    IERC20Upgradeable public amoneyToken;
    uint256 public constant MIN_DEPOSIT_AMOUNT = 1 * (10**9); // 1 AMONEY

    event CulturalEventRecorded(address indexed user, bytes32 eventHash, uint256 energy);
    event NeuralFieldConnected(address indexed neuralField);
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event AMoneyTokenUpdated(address indexed newAddress);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _amoneyToken) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        if (_amoneyToken == address(0)) revert InvalidAddress();
        amoneyToken = IERC20Upgradeable(_amoneyToken);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    function recordCulturalEvent(address _user, uint256 _amount, bytes32 _context) external returns (bool) {
        if (msg.sender != address(amoneyToken) && msg.sender != neuralField) revert Unauthorized();
        uint256 energy = _amount / 10**9;
        culturalEnergy[_user] += energy;
        bytes32 eventHash = keccak256(abi.encodePacked(block.timestamp, _user, _amount, _context));
        culturalEvents[_user].push(eventHash);
        emit CulturalEventRecorded(_user, eventHash, energy);
        return true;
    }

    function connectNeuralField(address _neuralField) external onlyOwner {
        if (_neuralField == address(0)) revert InvalidAddress();
        neuralField = _neuralField;
        emit NeuralFieldConnected(_neuralField);
    }

    function deposit(uint256 _amount) public nonReentrant {
        if (_amount < MIN_DEPOSIT_AMOUNT) revert DepositTooSmall();
        if (!amoneyToken.transferFrom(msg.sender, address(this), _amount)) revert TransferFailed();
        emit Deposit(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) public nonReentrant onlyOwner {
        if (_amount == 0) revert InvalidAmount();
        if (amoneyToken.balanceOf(address(this)) < _amount) revert InsufficientBalance();
        try amoneyToken.transfer(msg.sender, _amount) {
            // Transfer successful
        } catch Error(string memory /*reason*/) {
            revert TransferFailed();
        } catch (bytes memory) {
            revert TransferFailed();
        }
        emit Withdrawal(msg.sender, _amount);
    }

    function setAMoneyToken(address _newAMoneyToken) public onlyOwner {
        if (_newAMoneyToken == address(0)) revert InvalidAddress();
        amoneyToken = IERC20Upgradeable(_newAMoneyToken);
        emit AMoneyTokenUpdated(_newAMoneyToken);
    }

    function getContractBalance() public view returns (uint256) {
        return amoneyToken.balanceOf(address(this));
    }
}
