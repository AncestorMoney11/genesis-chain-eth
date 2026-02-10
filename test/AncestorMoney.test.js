const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("AncestorMoney", function () {
  let AncestorMoney;
  let amoney;
  let owner;
  let addr1;
  let addr2;
  let safeMultisig;
  let ecosystemFund;
  let strategicReserve;
  let publicSale;
  let founders;
  let communityIncentives;

  const MAX_SUPPLY = ethers.parseUnits("99999999999", 9); // 999亿，9位小数

  beforeEach(async function () {
    [owner, addr1, addr2, safeMultisig, ecosystemFund, strategicReserve, publicSale, founders, communityIncentives] = await ethers.getSigners();

    AncestorMoney = await ethers.getContractFactory("AncestorMoney");
    amoney = await upgrades.deployProxy(AncestorMoney, [owner.address, ethers.ZeroAddress, ethers.ZeroAddress], { initializer: 'initialize' });
    await amoney.waitForDeployment();

    // Unpause the token for transfer tests
    await amoney.connect(owner).activateToken();

    // Perform genesis distribution
    await amoney.connect(owner).genesisDistribution(
        ecosystemFund.address,
        strategicReserve.address,
        publicSale.address,
        founders.address,
        communityIncentives.address
    );

  });

  describe("Deployment and Genesis Distribution", function () {
    it("Should have the correct name, symbol, and decimals", async function () {
      expect(await amoney.name()).to.equal("AncestorMoney");
      expect(await amoney.symbol()).to.equal("AMONEY");
      expect(await amoney.decimals()).to.equal(9);
    });

    it("Should pause the token initially", async function () {
      // The constructor calls _pause(), so it should be paused initially
      // We can test this by deploying a new instance and checking immediately.
      const tempAmoney = await upgrades.deployProxy(AncestorMoney, [owner.address, ethers.ZeroAddress, ethers.ZeroAddress], { initializer: 'initialize' });
      await tempAmoney.waitForDeployment();
      expect(await tempAmoney.paused()).to.be.true;
    });

    it("Should perform genesis distribution correctly", async function () {
        expect(await amoney.totalSupply()).to.equal(MAX_SUPPLY);
        expect(await amoney.balanceOf(ecosystemFund.address)).to.equal(ethers.parseUnits("30000000000", 9));
        expect(await amoney.balanceOf(strategicReserve.address)).to.equal(ethers.parseUnits("20000000000", 9));
        expect(await amoney.balanceOf(publicSale.address)).to.equal(ethers.parseUnits("15000000000", 9));
        expect(await amoney.balanceOf(founders.address)).to.equal(ethers.parseUnits("10000000000", 9));
        expect(await amoney.balanceOf(communityIncentives.address)).to.equal(ethers.parseUnits("24999999999", 9));
    });
  });

  describe("Transfer and Burn Mechanism", function () {
    it("Should burn 0.5% on transfer and transfer the rest", async function () {
      const initialBalance = await amoney.balanceOf(ecosystemFund.address);
      const transferAmount = ethers.parseUnits("1000", 9); // Transfer 1000 AMONEY
      const burnRate = 5n; // 0.5% = 5/1000
      const expectedBurn = (transferAmount * burnRate) / 1000n;
      const expectedTransfer = transferAmount - expectedBurn;

      await amoney.connect(ecosystemFund).transfer(addr1.address, transferAmount);

      expect(await amoney.balanceOf(ecosystemFund.address)).to.equal(initialBalance - transferAmount);
      expect(await amoney.balanceOf(addr1.address)).to.equal(expectedTransfer);
    });

    it("Should allow burning tokens by the holder", async function () {
      const initialBalance = await amoney.balanceOf(ecosystemFund.address);
      const burnAmount = ethers.parseUnits("100", 9);

      await amoney.connect(ecosystemFund).burn(burnAmount);

      expect(await amoney.balanceOf(ecosystemFund.address)).to.equal(initialBalance - burnAmount);
    });
  });

  describe("Tax Exemption Scenarios", function () {
    let exemptUser;
    let nonExemptUser;
    let transferAmount;
    const burnRate = 5n; // 0.5% = 5/1000

    beforeEach(async function () {
      [, exemptUser, nonExemptUser] = await ethers.getSigners();
      transferAmount = ethers.parseUnits("1000", 9);

      // 确保 exemptUser 初始不是免税的，然后设置为免税
      await amoney.connect(owner).setTaxExempt(exemptUser.address, false);
      await amoney.connect(owner).setTaxExempt(nonExemptUser.address, false);
      await amoney.connect(owner).setTaxExempt(exemptUser.address, true);

      // 给用户分发代币
      // 先给 owner 足够的代币，因为 ecosystemFund 可能会被征税
      const amountForOwner = ethers.parseUnits("10000", 9); // Give owner 10000 AMONEY for transfers
      await amoney.connect(ecosystemFund).transfer(owner.address, amountForOwner);

      await amoney.connect(owner).transfer(exemptUser.address, transferAmount * 2n);
      await amoney.connect(owner).transfer(nonExemptUser.address, transferAmount * 2n);
    });

    it("Should allow admin to set tax exempt status", async function () {
      expect(await amoney.isTaxExempt(exemptUser.address)).to.be.true;
      expect(await amoney.isTaxExempt(nonExemptUser.address)).to.be.false;

      // 尝试非管理员设置，应该失败
      await expect(amoney.connect(nonExemptUser).setTaxExempt(nonExemptUser.address, true))
        .to.be.revertedWith(`AccessControl: account ${nonExemptUser.address.toLowerCase()} is missing role ${await amoney.DEFAULT_ADMIN_ROLE()}`);
    });

    it("Should not charge tax if sender is exempt", async function () {
      const initialExemptUserBalance = await amoney.balanceOf(exemptUser.address);
      const initialNonExemptUserBalance = await amoney.balanceOf(nonExemptUser.address);

      await amoney.connect(exemptUser).transfer(nonExemptUser.address, transferAmount);

      expect(await amoney.balanceOf(exemptUser.address)).to.equal(initialExemptUserBalance - transferAmount);
      expect(await amoney.balanceOf(nonExemptUser.address)).to.equal(initialNonExemptUserBalance + transferAmount);
    });

    it("Should not charge tax if recipient is exempt", async function () {
      const initialNonExemptUserBalance = await amoney.balanceOf(nonExemptUser.address);
      const initialExemptUserBalance = await amoney.balanceOf(exemptUser.address);

      await amoney.connect(nonExemptUser).transfer(exemptUser.address, transferAmount);

      expect(await amoney.balanceOf(nonExemptUser.address)).to.equal(initialNonExemptUserBalance - transferAmount);
      expect(await amoney.balanceOf(exemptUser.address)).to.equal(initialExemptUserBalance + transferAmount);
    });

    it("Should not charge tax if both sender and recipient are exempt", async function () {
      const initialExemptUserBalance1 = await amoney.balanceOf(exemptUser.address);
      const initialExemptUserBalance2 = await amoney.balanceOf(owner.address); // owner 也是免税的

      await amoney.connect(exemptUser).transfer(owner.address, transferAmount);

      expect(await amoney.balanceOf(exemptUser.address)).to.equal(initialExemptUserBalance1 - transferAmount);
      expect(await amoney.balanceOf(owner.address)).to.equal(initialExemptUserBalance2 + transferAmount);
    });

    it("Should charge tax if neither sender nor recipient is exempt", async function () {
      const initialNonExemptUserBalance = await amoney.balanceOf(nonExemptUser.address);
      const initialOwnerBalance = await amoney.balanceOf(owner.address);

      // 暂时将 owner 设置为非免税，以便测试双方都不免税的情况
      await amoney.connect(owner).setTaxExempt(owner.address, false);

      const expectedBurn = (transferAmount * burnRate) / 1000n;
      const expectedTransfer = transferAmount - expectedBurn;

      await amoney.connect(nonExemptUser).transfer(owner.address, transferAmount);

      expect(await amoney.balanceOf(nonExemptUser.address)).to.equal(initialNonExemptUserBalance - transferAmount);
      expect(await amoney.balanceOf(owner.address)).to.equal(initialOwnerBalance + expectedTransfer);

      // 恢复 owner 的免税状态
      await amoney.connect(owner).setTaxExempt(owner.address, true);
    });

    it("Should reflect changes in tax exempt status immediately", async function () {
      // 初始 exemptUser 是免税的
      const initialExemptUserBalance = await amoney.balanceOf(exemptUser.address);
      const initialNonExemptUserBalance = await amoney.balanceOf(nonExemptUser.address);

      // 取消 exemptUser 的免税状态
      await amoney.connect(owner).setTaxExempt(exemptUser.address, false);
      expect(await amoney.isTaxExempt(exemptUser.address)).to.be.false;

      // 再次转账，现在应该收取税费
      const expectedBurn = (transferAmount * burnRate) / 1000n;
      const expectedTransfer = transferAmount - expectedBurn;

      await amoney.connect(exemptUser).transfer(nonExemptUser.address, transferAmount);

      expect(await amoney.balanceOf(exemptUser.address)).to.equal(initialExemptUserBalance - transferAmount);
      expect(await amoney.balanceOf(nonExemptUser.address)).to.equal(initialNonExemptUserBalance + expectedTransfer);
    });
  });
});
