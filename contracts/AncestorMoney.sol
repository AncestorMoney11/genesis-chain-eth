// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract AncestorMoney is Initializable, ERC20Upgradeable, Ownable2StepUpgradeable, PausableUpgradeable, ERC20BurnableUpgradeable, UUPSUpgradeable {
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

    function initialize(address initialOwner, address _evolutionReserve, address _vaultAddress) public initializer {
        __ERC20_init("AncestorMoney", "AMONEY");
        __Ownable2Step_init();
        __Pausable_init();
        __ERC20Burnable_init();
        __UUPSUpgradeable_init();
        
        _transferOwnership(initialOwner);
        _pause();
        evolutionReserve = _evolutionReserve;
        vaultAddress = _vaultAddress;
        currentSupply = 0;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function genesisDistribution(
        address ecosystemFund,
        address strategicReserve,
        address publicSale,
        address founders,
        address communityIncentives
    ) public onlyOwner {
        require(currentSupply == 0, "Already performed");
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
    }
    
    function decimals() public view override returns (uint8) { return 9; }
    
    function activateToken() public onlyOwner whenPaused returns (bool) {
        _unpause();
        emit TokenActivated();
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal override whenNotPaused {
        uint256 burnRate = 5; 
        uint256 burnedAmount = (amount * burnRate) / 1000;
        uint256 amountToRecipient = amount - burnedAmount;
        super._transfer(from, to, amountToRecipient);
        if (burnedAmount > 0) _burn(from, burnedAmount);
    }
    
    function setEvolutionReserve(address _evolutionReserve) public onlyOwner {
        evolutionReserve = _evolutionReserve;
        emit EvolutionReserveUpdated(_evolutionReserve);
    }
    
    function setVaultAddress(address _vaultAddress) public onlyOwner {
        vaultAddress = _vaultAddress;
        emit VaultAddressUpdated(_vaultAddress);
    }
    
    function payVaultFee(address _from, uint256 _amount) public returns (bool) {
        require(msg.sender == vaultAddress, "Unauthorized");
        _transfer(_from, address(this), _amount);
        emit VaultFeeBurned(_from, _amount);
        return true;
    }
}
