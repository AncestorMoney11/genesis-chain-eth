const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("AncestorMoney Security and New Features", function () {
  let AncestorMoney;
  let amoney;
  let owner;
  let addr1;
  let addr2;
  let vault;
  let ecosystemFund;
  let other;

  beforeEach(async function () {
    [owner, addr1, addr2, vault, ecosystemFund, other, ...others] = await ethers.getSigners();

    AncestorMoney = await ethers.getContractFactory("AncestorMoney");
    // 设置 vaultAddress
    amoney = await upgrades.deployProxy(AncestorMoney, [owner.address, other.address, vault.address], { initializer: 'initialize' });
    await amoney.waitForDeployment();

    // 激活代币并进行分发
    await amoney.connect(owner).activateToken();
    await amoney.connect(owner).genesisDistribution(
        ecosystemFund.address,
        other.address,
        other.address,
        other.address,
        other.address
    );
  });

  describe("payVaultFee Security Fix", function () {
    it("Should fail if vault tries to take fees without allowance", async function () {
      const amount = ethers.parseUnits("100", 9);
      // 之前版本这个会成功，现在应该失败，因为没有 allowance
      await expect(
        amoney.connect(vault).payVaultFee(ecosystemFund.address, amount)
      ).to.be.revertedWithCustomError(amoney, "InsufficientAllowance");
    });

    it("Should succeed if vault has allowance from the user", async function () {
      const amount = ethers.parseUnits("100", 9);
      // 用户授权 vault
      await amoney.connect(ecosystemFund).approve(vault.address, amount);
      
      const initialBalance = await amoney.balanceOf(ecosystemFund.address);
      const initialTotalSupply = await amoney.totalSupply();

      // 现在 vault 可以扣费了
      await amoney.connect(vault).payVaultFee(ecosystemFund.address, amount);

      expect(await amoney.balanceOf(ecosystemFund.address)).to.equal(initialBalance - amount);
      expect(await amoney.totalSupply()).to.equal(initialTotalSupply - amount);
    });

    it("Should fail if non-vault address calls payVaultFee", async function () {
      const amount = ethers.parseUnits("100", 9);
      await expect(
        amoney.connect(addr1).payVaultFee(ecosystemFund.address, amount)
      ).to.be.revertedWithCustomError(amoney, "OnlyVaultCanPayFees");
    });
  });

  describe("Tax Exempt (Whitelist) Feature", function () {
    it("Should not charge tax if sender is exempt", async function () {
      const transferAmount = ethers.parseUnits("1000", 9);
      
      // 设置 addr1 为免税地址
      await amoney.connect(owner).setTaxExempt(addr1.address, true);
      
      // 先给 addr1 点钱
      await amoney.connect(ecosystemFund).transfer(addr1.address, transferAmount);
      const balanceAfterFirstTransfer = await amoney.balanceOf(addr1.address);
      
      // addr1 转账给 addr2，不应扣税
      await amoney.connect(addr1).transfer(addr2.address, transferAmount);
      
      expect(await amoney.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should not charge tax if recipient is exempt", async function () {
      const transferAmount = ethers.parseUnits("1000", 9);
      
      // 设置 addr2 为免税地址
      await amoney.connect(owner).setTaxExempt(addr2.address, true);
      
      // ecosystemFund 转账给 addr2，不应扣税
      await amoney.connect(ecosystemFund).transfer(addr2.address, transferAmount);
      
      expect(await amoney.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should charge tax for normal users", async function () {
      const transferAmount = ethers.parseUnits("1000", 9);
      const burnRate = 5n;
      const expectedBurn = (transferAmount * burnRate) / 1000n;
      const expectedTransfer = transferAmount - expectedBurn;

      // ecosystemFund (默认不免税) 转账给 addr1 (不免税)
      await amoney.connect(ecosystemFund).transfer(addr1.address, transferAmount);
      
      expect(await amoney.balanceOf(addr1.address)).to.equal(expectedTransfer);
    });
  });
});
