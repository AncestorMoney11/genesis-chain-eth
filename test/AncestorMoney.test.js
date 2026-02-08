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
});
