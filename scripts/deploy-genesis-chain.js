// scripts/deploy-genesis-chain.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 开始部署创世链ETH版本...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log(`部署者: ${deployer.address}\n`);
    
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    // 1. Deploy AncestorMoney (upgradeable)
    console.log("1. 部署AncestorMoney代币...");
    const AncestorMoney = await hre.ethers.getContractFactory("AncestorMoney");
    const amoneyToken = await hre.upgrades.deployProxy(AncestorMoney, [
        deployer.address,
        hre.ethers.ZeroAddress, // temp vault
        hre.ethers.ZeroAddress  // temp evolution
    ], { initializer: 'initialize', kind: 'uups' });
    await amoneyToken.waitForDeployment();
    const amoneyAddress = await amoneyToken.getAddress();
    console.log(`   AMONEY (Proxy) 地址: ${amoneyAddress}`);

    // 2. Deploy EvolutionReserve (upgradeable)
    console.log("\n2. 部署进化储备合约...");
    const EvolutionReserve = await hre.ethers.getContractFactory("EvolutionReserve");
    const evolutionReserve = await hre.upgrades.deployProxy(EvolutionReserve, [amoneyAddress], { initializer: 'initialize', kind: 'uups' });
    await evolutionReserve.waitForDeployment();
    const evolutionAddress = await evolutionReserve.getAddress();
    console.log(`   进化储备 (Proxy) 地址: ${evolutionAddress}`);

    // 3. Deploy SacredVault implementation (logic contract)
    console.log("\n3. 部署神圣遗产保险库实现合约...");
    const SacredVault = await hre.ethers.getContractFactory("SacredVault");
    const sacredVaultImpl = await SacredVault.deploy();
    await sacredVaultImpl.waitForDeployment();
    const vaultImplAddress = await sacredVaultImpl.getAddress();
    console.log(`   保险库实现地址: ${vaultImplAddress}`);

    // 4. Deploy VaultFactory (upgradeable)
    console.log("\n4. 部署可升级保险库工厂...");
    const VaultFactory = await hre.ethers.getContractFactory("VaultFactory");
    const vaultFactory = await hre.upgrades.deployProxy(VaultFactory, [
        deployer.address,
        vaultImplAddress
    ], { initializer: 'initialize', kind: 'uups' });
    await vaultFactory.waitForDeployment();
    const factoryAddress = await vaultFactory.getAddress();
    console.log(`   工厂 (Proxy) 地址: ${factoryAddress}`);

    // 5. Configure contract relationships
    console.log("\n5. 配置合约间关系...");
    await amoneyToken.setVaultAddress(factoryAddress); // Factory is the entry point for vaults
    await amoneyToken.setEvolutionReserve(evolutionAddress);
    console.log("   ✓ AMONEY 设置 vault and evolution reserve 地址完成");

    // 6. Genesis Distribution
    console.log("\n6. 执行创世分发...");
    const testAddresses = [
        deployer.address, // Ecosystem Fund
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Strategic Reserve
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Public Sale
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Founders
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"  // Community Incentives
    ];
    await amoneyToken.genesisDistribution(...testAddresses);
    console.log("   ✓ 创世分发完成");

    // 7. Activate Token
    await amoneyToken.activateToken();
    console.log("   ✓ 代币已激活");

    // 8. Save deployment information
    const deploymentInfo = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        contracts: {
            ancestorMoneyProxy: amoneyAddress,
            evolutionReserveProxy: evolutionAddress,
            sacredVaultImplementation: vaultImplAddress,
            vaultFactoryProxy: factoryAddress,
        }
    };
    
    const filename = path.join(deploymentsDir, `genesis-chain-${hre.network.name}.json`);
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📁 部署信息已保存至: ${filename}`);
    console.log("\n✅ 创世链ETH版本部署完成!");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
