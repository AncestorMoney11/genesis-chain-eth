// test/GenesisChain.test.js
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("创世链ETH版本完整测试", function() {
    let amoneyToken;
    let sacredVaultImplementation;
    let sacredVault;
    let vaultFactory;
    let evolutionReserve;
    let owner, user1, user2, beneficiary1, beneficiary2;
    
    beforeEach(async function() {
        [owner, user1, user2, beneficiary1, beneficiary2] = await ethers.getSigners();

        // Deploy SacredVault implementation (not directly used, but needed for factory)
        const SacredVaultContractFactory = await ethers.getContractFactory("SacredVault");
        sacredVaultImplementation = await SacredVaultContractFactory.deploy();
        await sacredVaultImplementation.waitForDeployment();

        // Deploy AncestorMoney (AMONEY) token with a placeholder for EvolutionReserve
        const AncestorMoneyContractFactory = await ethers.getContractFactory("AncestorMoney");
        amoneyToken = await upgrades.deployProxy(AncestorMoneyContractFactory, [owner.address, ethers.ZeroAddress, ethers.ZeroAddress], { initializer: 'initialize' });
        await amoneyToken.waitForDeployment();

        // Deploy EvolutionReserve, passing the deployed AMONEY token address
        const EvolutionReserveContractFactory = await ethers.getContractFactory("EvolutionReserve");
        evolutionReserve = await upgrades.deployProxy(EvolutionReserveContractFactory, [amoneyToken.target], { initializer: 'initialize' });
        await evolutionReserve.waitForDeployment();

        // Update AncestorMoney with the correct EvolutionReserve address
        await amoneyToken.setEvolutionReserve(evolutionReserve.target);



        // Activate token immediately after deployment
        await amoneyToken.activateToken();

        // Perform genesis distribution
        await amoneyToken.genesisDistribution(
            owner.address, // ecosystemFund
            user1.address, // strategicReserve
            user2.address, // publicSale
            beneficiary1.address, // founders
            beneficiary2.address // communityIncentives
        );

        // Deploy VaultFactory, passing the deployed SacredVault implementation address
        const VaultFactoryContractFactory = await ethers.getContractFactory("VaultFactory");
        vaultFactory = await upgrades.deployProxy(VaultFactoryContractFactory, [owner.address, sacredVaultImplementation.target], { initializer: 'initialize' });
        await vaultFactory.waitForDeployment();

        // Deploy SacredVault proxy directly for testing SacredVault functionalities
        sacredVault = await upgrades.deployProxy(SacredVaultContractFactory, [amoneyToken.target, owner.address], { initializer: 'initialize' });
        await sacredVault.waitForDeployment();

        // Update AncestorMoney with the correct Vault address
        await amoneyToken.setVaultAddress(sacredVault.target);


    });
    
    describe("AMONEY代币部署与配置", function() {
        it("应该部署AMONEY代币合约", async function() {
            expect(await amoneyToken.name()).to.equal("AncestorMoney");
            expect(await amoneyToken.symbol()).to.equal("AMONEY");
            expect(await amoneyToken.decimals()).to.equal(9);
        });
        
        it("应该铸造正确的代币总量", async function() {
            const totalSupply = await amoneyToken.totalSupply();
            expect(totalSupply).to.equal(ethers.parseUnits("99999999999", 9)); // 999亿
        });
        
        it("应该激活代币", async function() {
            expect(await amoneyToken.paused()).to.be.false;
        });
    });
    
    describe("神圣遗产保险库", function() {
        it("应该创建保险库", async function() {
            const beneficiaries = [beneficiary1.address, beneficiary2.address];
            const shares = [600, 400]; // 60% 和 40%
            
            const conditions = []; // Conditions are passed during creation, no separate add function.
            

            const tx = await sacredVault.createSacredVault(
                owner.address,
                beneficiaries,
                shares,
                "ipfs://QmTestMetadata",
                conditions
            );
            
            const receipt = await tx.wait();
            const event = receipt.logs.find(e => e.fragment && e.fragment.name === 'VaultCreated');
            const vaultId = event.args.vaultId;
            
            const vaultDetails = await sacredVault.getVaultDetails(vaultId);
            expect(vaultDetails.creator).to.equal(owner.address);
            expect(vaultDetails.beneficiaries).to.deep.equal(beneficiaries);
        });
        
        it("应该支付保险库维护费", async function() {
            // 给用户一些AMONEY
            await amoneyToken.transfer(user1.address, ethers.parseUnits("1000", 9));
            
            // 用户创建保险库
            const tx2 = await sacredVault.connect(user1).createSacredVault(
                user1.address,
                [beneficiary1.address],
                [1000],
                "ipfs://QmTest2",
                []
            );
            const receipt2 = await tx2.wait();
            const event2 = receipt2.logs.find(e => e.fragment && e.fragment.name === 'VaultCreated');
            const vaultId2 = event2.args.vaultId;

            // 支付维护费
            await amoneyToken.connect(user1).approve(
                sacredVault.target,
                ethers.parseUnits("10", 9)
            );
            
            await sacredVault.connect(user1).payMaintenanceFee(vaultId2, ethers.parseUnits("10", 9));
        });
    });
    
    describe("可升级工厂", function() {
        it("应该部署保险库工厂", async function() {
            expect(await vaultFactory.getVaultCount()).to.equal(0);
        });
        
        it("应该创建可升级保险库代理", async function() {
            const beneficiaries = [user1.address];
            const shares = [1000];
            
            const tx = await vaultFactory.createUpgradeableVault(
                amoneyToken.target,
                beneficiaries,
                shares,
                "ipfs://QmProxyVault",
                []
            );
            
            await tx.wait();
            
            expect(await vaultFactory.getVaultCount()).to.equal(1);
        });
    });
    
    describe("进化储备合约", function() {
        it("应该部署并连接进化储备", async function() {
            const stats = await evolutionReserve.getUserCulturalStats(owner.address);
            expect(stats.energy).to.equal(0);
        });
        
        it("应该转换AMONEY为文化能量", async function() {
            const convertAmount = ethers.parseUnits("100", 9);
            await amoneyToken.approve(evolutionReserve.target, convertAmount);
            
            const tx = await evolutionReserve.convertToCulturalEnergy(convertAmount);
            await tx.wait();
            
            const stats = await evolutionReserve.getUserCulturalStats(owner.address);
            expect(stats.energy).to.be.gt(0);
        });
    });
    
    describe("通缩机制", function() {
        it("应该对交易燃烧0.5%", async function() {
            const initialBalance = await amoneyToken.balanceOf(owner.address);
            const transferAmount = ethers.parseUnits("1000", 9);
            
            const tx = await amoneyToken.transfer(user1.address, transferAmount);
            await tx.wait();
            
            const finalBalance = await amoneyToken.balanceOf(owner.address);
            const expectedBurn = (transferAmount * 5n) / 1000n; // 0.5%
            
            expect(initialBalance - finalBalance).to.equal(transferAmount);
        });
    });
});
