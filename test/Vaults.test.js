const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("SacredVault and VaultFactory", function () {
    let amoney;
    let sacredVaultImplementation;
    let vaultFactory;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const MAX_SUPPLY = ethers.parseUnits("99999999999", 9); // 99.999999999 billion AMONEY

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

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
            addrs[0].address, // founders
            addrs[1].address // communityIncentives
        );

        // Deploy EvolutionReserve (not directly used in these tests, but part of the ecosystem)
        const EvolutionReserve = await ethers.getContractFactory("EvolutionReserve");
        evolutionReserve = await upgrades.deployProxy(EvolutionReserve, [amoney.target, owner.address], { initializer: 'initialize' });
        await evolutionReserve.waitForDeployment();
        await amoney.connect(owner).setEvolutionReserve(evolutionReserve.target);

        // Deploy SacredVault implementation (not directly used, but needed for factory)
        const SacredVault = await ethers.getContractFactory("SacredVault");
        sacredVaultImplementation = await SacredVault.deploy();
        await sacredVaultImplementation.waitForDeployment();

        // Deploy VaultFactory
        const VaultFactory = await ethers.getContractFactory("VaultFactory");
        vaultFactory = await upgrades.deployProxy(VaultFactory, [owner.address, sacredVaultImplementation.target], { initializer: 'initialize' });
        await vaultFactory.waitForDeployment();

        // Set the AMONEY token address in SacredVault (if needed, or via factory)
        // For now, the factory will handle the initialization of the proxy vault
    });

    describe("VaultFactory Deployment and Creation", function () {
        it("Should deploy the VaultFactory and set the correct implementation", async function () {
            expect(await vaultFactory.vaultImplementation()).to.not.be.null;
            expect(await vaultFactory.vaultImplementation()).to.not.equal(ethers.ZeroAddress);
            expect(await vaultFactory.vaultImplementation()).to.equal(sacredVaultImplementation.target);
        });

        it("Should create a new upgradeable vault and emit an event", async function () {
            const beneficiaries = [addr1.address, addr2.address];
            const shares = [500, 500]; // 50% each
            const metadataURI = "ipfs://test/metadata";
            const conditions = [];

            await expect(vaultFactory.connect(owner).createUpgradeableVault(
                amoney.target,
                beneficiaries,
                shares,
                metadataURI,
                conditions,
                0 // Add sacrificialShare for testing
            ))
            .to.emit(vaultFactory, "VaultProxyCreated");

            const vaultCount = await vaultFactory.getVaultCount();
            expect(vaultCount).to.equal(1);

            const userVaultsCount = await vaultFactory.getUserVaultsCount(owner.address);
            expect(userVaultsCount).to.equal(1);
        });
    });

    describe("SacredVault Functionality via Proxy", function () {
        let vaultProxy;
        let sacredVaultProxy;
        let testVaultId = 0;

        beforeEach(async function () {
            const beneficiaries = [addr1.address, addr2.address];
            const shares = [500, 500];
            const metadataURI = "ipfs://test/metadata";
            const conditions = [
                { conditionType: 0, triggerValue: Math.floor(Date.now() / 1000) + 1, isActive: true } // Time condition
            ];

            const tx = await vaultFactory.connect(owner).createUpgradeableVault(
                amoney.target,
                beneficiaries,
                shares,
                metadataURI,
                conditions,
                0 // Add sacrificialShare for testing
            );
            const receipt = await tx.wait();
            const event = receipt.logs.find(e => e.fragment && e.fragment.name === 'VaultProxyCreated');
            vaultProxy = event.args.proxy;

            sacredVaultProxy = await ethers.getContractAt("SacredVault", vaultProxy);

            // Set the vaultAddress in the AMONEY token for fee payments
            await amoney.connect(owner).setVaultAddress(sacredVaultProxy.target);
        });

        it("Should have correct details after creation", async function () {
            const [creator, currentOwner, creationDate, lastMaintenance, status, metadataURI, returnedBeneficiaries, culturalEnergy] = await sacredVaultProxy.getVaultDetails(testVaultId);
            const shares0 = await sacredVaultProxy.getVaultShares(testVaultId, addr1.address);
            const shares1 = await sacredVaultProxy.getVaultShares(testVaultId, addr2.address);
            expect(creator).to.equal(owner.address);
            expect(currentOwner).to.equal(owner.address);
            expect(returnedBeneficiaries[0]).to.equal(addr1.address);
            expect(returnedBeneficiaries[1]).to.equal(addr2.address);
            expect(shares0).to.equal(500);
            expect(shares1).to.equal(500);
            expect(metadataURI).to.equal("ipfs://test/metadata");
            expect(culturalEnergy).to.equal(0);
        });

        it("Should allow adding inheritance conditions", async function () {
            const newCondition = { conditionType: 1, triggerValue: Math.floor(Date.now() / 1000) + 3600, isActive: true }; // Time condition
            await expect(sacredVaultProxy.addInheritanceCondition(testVaultId, newCondition))
                .to.emit(sacredVaultProxy, "ConditionAdded")
                .withArgs(testVaultId, newCondition.conditionType, newCondition.triggerValue);
        });

        it("Should allow paying maintenance fee", async function () {
            const feeAmount = ethers.parseUnits("100", 9);
            await amoney.connect(owner).approve(sacredVaultProxy.target, feeAmount);

            await expect(sacredVaultProxy.payMaintenanceFee(testVaultId, feeAmount))
                .to.emit(amoney, "VaultFeeBurned");

            // Check cultural energy increase
            const [, , , , , , , culturalEnergyAfterFee] = await sacredVaultProxy.getVaultDetails(testVaultId);
            expect(culturalEnergyAfterFee).to.equal(feeAmount / 10n);
        });

        it("Should execute inheritance and transfer ownership", async function () {
            const condition = { conditionType: 0, triggerValue: Math.floor(Date.now() / 1000) + 1, isActive: true }; // Time condition

            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [2]);
            await ethers.provider.send("evm_mine", []);

            await expect(sacredVaultProxy.executeInheritance(testVaultId, 0))
                .to.emit(sacredVaultProxy, "InheritanceTriggered")
                .withArgs(testVaultId, owner.address, addr1.address, condition.conditionType);

            const [, newOwner, , , status, , ,] = await sacredVaultProxy.getVaultDetails(testVaultId);
            expect(newOwner).to.equal(addr1.address);
            expect(status).to.equal(1); // Inherited status
        });

        it("Should allow unlocking vault after lock period", async function () {
            const condition = { conditionType: 0, triggerValue: Math.floor(Date.now() / 1000) + 1, isActive: true }; // Time condition

            // Execute inheritance to lock the vault
            await ethers.provider.send("evm_increaseTime", [2]);
            await ethers.provider.send("evm_mine", []);
            await sacredVaultProxy.executeInheritance(testVaultId, 0);

            // Fast forward time past unlockingTimestamp (30 days)
            await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine", []);

            await expect(sacredVaultProxy.connect(addr1).unlockVault(testVaultId))
                .to.not.be.reverted;

            const [, , , , status, , ,] = await sacredVaultProxy.getVaultDetails(testVaultId);
            expect(status).to.equal(0); // Active status
        });
    });
});
