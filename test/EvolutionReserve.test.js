const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("EvolutionReserve", function () {
    let amoney;
    let evolutionReserve;
    let owner;
    let addr1;
    let addr2;

    const MIN_DEPOSIT_AMOUNT = ethers.parseUnits("1", 9); // 1 AMONEY
    const BURN_RATE_BPS = 5; // 0.5% burn rate in basis points (5/1000)

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy AncestorMoney (AMONEY) token
        const AncestorMoney = await ethers.getContractFactory("AncestorMoney");
        amoney = await upgrades.deployProxy(AncestorMoney, [owner.address, ethers.ZeroAddress, ethers.ZeroAddress], { initializer: 'initialize' });
        await amoney.waitForDeployment();

        // Activate token and perform genesis distribution
        await amoney.connect(owner).activateToken();
        await amoney.connect(owner).genesisDistribution(
            owner.address, // ecosystemFund
            addr1.address, // strategicReserve
            addr2.address, // publicSale
            owner.address, // founders
            owner.address // communityIncentives
        );

        // Deploy EvolutionReserve
        const EvolutionReserve = await ethers.getContractFactory("EvolutionReserve");
        evolutionReserve = await upgrades.deployProxy(EvolutionReserve, [amoney.target], { initializer: 'initialize' });
        await evolutionReserve.waitForDeployment();

        // Set EvolutionReserve address in AMONEY token
        await amoney.connect(owner).setEvolutionReserve(evolutionReserve.target);
    });

    describe("Deployment", function () {
        it("Should set the correct AMONEY token address", async function () {
            expect(await evolutionReserve.amoneyToken()).to.equal(amoney.target);
        });

        it("Should have the owner as the deployer", async function () {
            expect(await evolutionReserve.owner()).to.equal(owner.address);
        });
    });

    describe("Deposit", function () {
        it("Should allow users to deposit AMONEY", async function () {
            const depositAmount = ethers.parseUnits("10", 9);
            await amoney.connect(owner).approve(evolutionReserve.target, depositAmount);

            const expectedAmountInReserve = depositAmount - (depositAmount * BigInt(BURN_RATE_BPS) / BigInt(1000));

            await expect(evolutionReserve.connect(owner).deposit(depositAmount))
                .to.emit(evolutionReserve, "Deposit")
                .withArgs(owner.address, depositAmount);

            expect(await amoney.balanceOf(evolutionReserve.target)).to.equal(expectedAmountInReserve);
        });

        it("Should revert if deposit amount is too small", async function () {
            const depositAmount = ethers.parseUnits("0.5", 9);
            await amoney.connect(owner).approve(evolutionReserve.target, depositAmount);

            await expect(evolutionReserve.connect(owner).deposit(depositAmount))
                .to.be.revertedWithCustomError(evolutionReserve, "DepositTooSmall");
        });

        it("Should revert if transfer fails (insufficient allowance)", async function () {
            const depositAmount = ethers.parseUnits("10", 9);
            // Do not approve, so transferFrom will fail with insufficient allowance
            await expect(evolutionReserve.connect(owner).deposit(depositAmount))
                .to.be.revertedWith("ERC20: insufficient allowance");
        });
    });

    describe("Withdrawal", function () {
        let initialReserveBalanceAfterDeposit;
        let initialOwnerBalanceBeforeWithdrawal;

        beforeEach(async function () {
            const depositAmount = ethers.parseUnits("100", 9);
            await amoney.connect(owner).approve(evolutionReserve.target, depositAmount);
            await evolutionReserve.connect(owner).deposit(depositAmount);
            initialReserveBalanceAfterDeposit = await amoney.balanceOf(evolutionReserve.target);
            initialOwnerBalanceBeforeWithdrawal = await amoney.balanceOf(owner.address);
        });

        it("Should allow owner to withdraw AMONEY", async function () {
            const withdrawAmount = ethers.parseUnits("50", 9);
            const expectedAmountReceivedByOwner = withdrawAmount - (withdrawAmount * BigInt(BURN_RATE_BPS) / BigInt(1000));

            await expect(evolutionReserve.connect(owner).withdraw(withdrawAmount))
                .to.emit(evolutionReserve, "Withdrawal")
                .withArgs(owner.address, withdrawAmount);

            expect(await amoney.balanceOf(evolutionReserve.target)).to.equal(initialReserveBalanceAfterDeposit - withdrawAmount);
            expect(await amoney.balanceOf(owner.address)).to.equal(initialOwnerBalanceBeforeWithdrawal + expectedAmountReceivedByOwner);
        });

        it("Should revert if non-owner tries to withdraw", async function () {
            const withdrawAmount = ethers.parseUnits("10", 9);
            await expect(evolutionReserve.connect(addr1).withdraw(withdrawAmount))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert if withdraw amount is zero", async function () {
            await expect(evolutionReserve.connect(owner).withdraw(0))
                .to.be.revertedWithCustomError(evolutionReserve, "InvalidAmount");
        });

        it("Should revert if insufficient balance", async function () {
            const withdrawAmount = ethers.parseUnits("200", 9);
            await expect(evolutionReserve.connect(owner).withdraw(withdrawAmount))
                .to.be.revertedWithCustomError(evolutionReserve, "InsufficientBalance");
        });

        it("Should revert if transfer fails during withdrawal", async function () {
            // Deploy a mock ERC20 that reverts on transfer with a custom error
            const MockERC20Revert = await ethers.getContractFactory("MockERC20Revert");
            const mockAmoneyRevert = await MockERC20Revert.deploy("Mock AMONEY Revert", "MAMR");
            await mockAmoneyRevert.waitForDeployment();

            await evolutionReserve.connect(owner).setAMoneyToken(mockAmoneyRevert.target);
            // Mint some mock tokens to EvolutionReserve
            await mockAmoneyRevert.mint(evolutionReserve.target, ethers.parseUnits("100", 9));

            // Now try to withdraw, it should fail with TransferFailed
            await expect(evolutionReserve.connect(owner).withdraw(ethers.parseUnits("10", 9)))
                .to.be.revertedWithCustomError(evolutionReserve, "TransferFailed");
        });
    });

    describe("setAMoneyToken", function () {
        it("Should allow owner to set a new AMONEY token address", async function () {
            const newAMoneyTokenAddress = addr1.address;
            await expect(evolutionReserve.connect(owner).setAMoneyToken(newAMoneyTokenAddress))
                .to.emit(evolutionReserve, "AMoneyTokenUpdated")
                .withArgs(newAMoneyTokenAddress);
            expect(await evolutionReserve.amoneyToken()).to.equal(newAMoneyTokenAddress);
        });

        it("Should revert if non-owner tries to set AMONEY token address", async function () {
            await expect(evolutionReserve.connect(addr1).setAMoneyToken(addr2.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert if new AMONEY token address is zero", async function () {
            await expect(evolutionReserve.connect(owner).setAMoneyToken(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(evolutionReserve, "InvalidAddress");
        });
    });

    describe("getContractBalance", function () {
        it("Should return the correct balance of AMONEY in the contract", async function () {
            const depositAmount = ethers.parseUnits("75", 9);
            await amoney.connect(owner).approve(evolutionReserve.target, depositAmount);
            await evolutionReserve.connect(owner).deposit(depositAmount);

            const expectedAmountInReserve = depositAmount - (depositAmount * BigInt(BURN_RATE_BPS) / BigInt(1000));

            expect(await evolutionReserve.getContractBalance()).to.equal(expectedAmountInReserve);
        });
    });
});
