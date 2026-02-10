pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./SacredVault.sol";
import "./AncestorMoney.sol";

contract ReentrantAttacker is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    AncestorMoney public amoney;
    SacredVault public sacredVault;
    uint256 public vaultId;

    event Attacked(uint256 balance);

    function initialize(address _amoney, address _sacredVault, uint256 _vaultId) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        amoney = AncestorMoney(_amoney);
        sacredVault = SacredVault(_sacredVault);
        vaultId = _vaultId;
    }

    function attackPayMaintenanceFee(address _vault, address _amoney, uint256 _vaultId, uint256 _feeAmount) public nonReentrant {
        // Set the amoney and sacredVault addresses for this attack instance
        amoney = AncestorMoney(_amoney);
        sacredVault = SacredVault(_vault);
        vaultId = _vaultId;

        // Approve the vault to spend AMONEY from this attacker contract
        amoney.approve(address(sacredVault), _feeAmount);

        // Call payMaintenanceFee, which will then call back into this contract
        sacredVault.payMaintenanceFee(vaultId, _feeAmount);
    }

    function attackDistributeInheritance(address _vault, uint256 _vaultId) public nonReentrant {
        // Set the sacredVault address for this attack instance
        sacredVault = SacredVault(_vault);
        vaultId = _vaultId;

        // Call distributeInheritance, which will then call back into this contract
        sacredVault.distributeInheritance(_vaultId);
    }

    // Fallback function to receive Ether and attempt reentrancy
    receive() external payable {
        if (address(sacredVault).balance > 0) {
            // Attempt to re-enter payMaintenanceFee
            // This part is tricky because payMaintenanceFee expects AMONEY, not Ether.
            // The reentrancy test for distributeInheritance is more direct.
        }
    }

    // Function to receive AMONEY tokens
    function tokenFallback(address _from, uint256 _value, bytes memory _data) public {
        // This function is called when AMONEY tokens are transferred to this contract.
        // We can use this to trigger a reentrancy attack on distributeInheritance.
        if (msg.sender == address(amoney)) {
            // Attempt to re-enter distributeInheritance
            sacredVault.distributeInheritance(vaultId);
        }
    }

    function withdrawAttackerTokens(address _token) public {
        IERC20(_token).transfer(msg.sender, IERC20(_token).balanceOf(address(this)));
    }

    function withdrawEther() public {
        payable(msg.sender).transfer(address(this).balance);
    }
}
