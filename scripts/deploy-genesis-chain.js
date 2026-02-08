const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const SAFE_MULTISIG_ADDRESS = "0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B";

    console.log("🚀 开始部署创世链ETH版本...");
    console.log(`部署者: ${deployer.address}`);
    console.log(`目标 Safe 多签地址: ${SAFE_MULTISIG_ADDRESS}`);

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    const filename = path.join(deploymentsDir, "genesis-chain-mainnet.json");

    let deploymentInfo = { contracts: {} };
    if (fs.existsSync(filename)) {
        deploymentInfo = JSON.parse(fs.readFileSync(filename, "utf8"));
    }

    // 1. Deploy AncestorMoney (upgradeable)
    let amoneyAddress = deploymentInfo.contracts.ancestorMoneyProxy;
    let amoneyToken;
    const AncestorMoney = await hre.ethers.getContractFactory("AncestorMoney");
    if (!amoneyAddress) {
        console.log("1. 部署AncestorMoney代币...");
        amoneyToken = await hre.upgrades.deployProxy(AncestorMoney, [
            deployer.address,
            hre.ethers.ZeroAddress, // temp vault
            hre.ethers.ZeroAddress  // temp evolution
        ], { initializer: 'initialize', kind: 'uups' });
        await amoneyToken.waitForDeployment();
        amoneyAddress = await amoneyToken.getAddress();
        deploymentInfo.contracts.ancestorMoneyProxy = amoneyAddress;
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
        console.log(`   AMONEY (Proxy) 部署成功: ${amoneyAddress}`);
    } else {
        console.log(`1. AncestorMoney 已部署: ${amoneyAddress}`);
        amoneyToken = AncestorMoney.attach(amoneyAddress);
    }

    // 2. Deploy EvolutionReserve (upgradeable)
    let evolutionAddress = deploymentInfo.contracts.evolutionReserveProxy;
    let evolutionReserve;
    const EvolutionReserve = await hre.ethers.getContractFactory("EvolutionReserve");
    if (!evolutionAddress) {
        console.log("\n2. 部署进化储备合约...");
        evolutionReserve = await hre.upgrades.deployProxy(EvolutionReserve, [amoneyAddress], { initializer: 'initialize', kind: 'uups' });
        await evolutionReserve.waitForDeployment();
        evolutionAddress = await evolutionReserve.getAddress();
        deploymentInfo.contracts.evolutionReserveProxy = evolutionAddress;
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
        console.log(`   进化储备 (Proxy) 部署成功: ${evolutionAddress}`);
    } else {
        console.log(`2. EvolutionReserve 已部署: ${evolutionAddress}`);
        evolutionReserve = EvolutionReserve.attach(evolutionAddress);
    }

    // 3. Deploy SacredVault implementation (logic contract)
    let vaultImplAddress = deploymentInfo.contracts.sacredVaultImpl;
    if (!vaultImplAddress) {
        console.log("\n3. 部署神圣遗产保险库实现合约...");
        const SacredVault = await hre.ethers.getContractFactory("SacredVault");
        const sacredVaultImpl = await SacredVault.deploy();
        await sacredVaultImpl.waitForDeployment();
        vaultImplAddress = await sacredVaultImpl.getAddress();
        deploymentInfo.contracts.sacredVaultImpl = vaultImplAddress;
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
        console.log(`   保险库实现部署成功: ${vaultImplAddress}`);
    } else {
        console.log(`3. SacredVault 实现已部署: ${vaultImplAddress}`);
    }

    // 4. Deploy VaultFactory (upgradeable)
    let factoryAddress = deploymentInfo.contracts.vaultFactoryProxy;
    let vaultFactory;
    const VaultFactory = await hre.ethers.getContractFactory("VaultFactory");
    if (!factoryAddress) {
        console.log("\n4. 部署可升级保险库工厂...");
        vaultFactory = await hre.upgrades.deployProxy(VaultFactory, [
            deployer.address,
            vaultImplAddress
        ], { initializer: 'initialize', kind: 'uups' });
        await vaultFactory.waitForDeployment();
        factoryAddress = await vaultFactory.getAddress();
        deploymentInfo.contracts.vaultFactoryProxy = factoryAddress;
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
        console.log(`   工厂 (Proxy) 部署成功: ${factoryAddress}`);
    } else {
        console.log(`4. VaultFactory 已部署: ${factoryAddress}`);
        vaultFactory = VaultFactory.attach(factoryAddress);
    }

    // 5. Configure contract relationships
    console.log("\n5. 配置合约间关系...");
    const currentVault = await amoneyToken.vaultAddress();
    const currentEvolution = await amoneyToken.evolutionReserve();

    if (currentVault.toLowerCase() !== factoryAddress.toLowerCase()) {
        console.log("   正在设置 AncestorMoney 的 Vault 地址...");
        await amoneyToken.setVaultAddress(factoryAddress);
    } else {
        console.log("   AncestorMoney 的 Vault 地址已配置。");
    }

    if (currentEvolution.toLowerCase() !== evolutionAddress.toLowerCase()) {
        console.log("   正在设置 AncestorMoney 的 EvolutionReserve 地址...");
        await amoneyToken.setEvolutionReserve(evolutionAddress);
    } else {
        console.log("   AncestorMoney 的 EvolutionReserve 地址已配置。");
    }

    // 6. Genesis Distribution
    console.log("\n6. 执行创世分发...");
    const currentSupply = await amoneyToken.currentSupply();
    if (currentSupply.toString() === "0") {
        const testAddresses = [
            SAFE_MULTISIG_ADDRESS, // ecosystemFund (Safe)
            SAFE_MULTISIG_ADDRESS, // strategicReserve (Safe)
            SAFE_MULTISIG_ADDRESS, // publicSale (Safe)
            SAFE_MULTISIG_ADDRESS, // founders (Safe)
            SAFE_MULTISIG_ADDRESS  // communityIncentives (Safe)
        ];
        await amoneyToken.genesisDistribution(...testAddresses);
        console.log("   ✓ 创世分发执行成功");
    } else {
        console.log("   创世分发已执行。");
    }

    // 7. Activate Token
    console.log("\n7. 激活代币...");
    const PAUSER_ROLE = await amoneyToken.PAUSER_ROLE();
    const isPaused = await amoneyToken.paused();
    if (isPaused) {
        if (await amoneyToken.hasRole(PAUSER_ROLE, deployer.address)) {
            await amoneyToken.activateToken();
            console.log("   ✓ 代币已激活");
        } else {
            console.log("   部署者没有 PAUSER_ROLE，无法在此脚本中激活代币。");
        }
    } else {
        console.log("   代币已处于激活状态。");
    }

    // 8. Transfer Admin Rights to Safe Multisig
    console.log("\n8. 转移管理员权限至 Safe 多签...");
    const DEFAULT_ADMIN_ROLE = await amoneyToken.DEFAULT_ADMIN_ROLE();

    // AncestorMoney (AccessControl)
    if (await amoneyToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)) {
        console.log("   转移 AncestorMoney 权限...");
        await amoneyToken.grantRole(DEFAULT_ADMIN_ROLE, SAFE_MULTISIG_ADDRESS);
        await amoneyToken.grantRole(PAUSER_ROLE, SAFE_MULTISIG_ADDRESS);
        
        // Revoke deployer roles
        if (await amoneyToken.hasRole(PAUSER_ROLE, deployer.address)) {
            await amoneyToken.revokeRole(PAUSER_ROLE, deployer.address);
        }
        await amoneyToken.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
        console.log("   ✓ AncestorMoney 权限已转移");
    } else {
        console.log("   AncestorMoney 权限已转移或不归部署者所有，跳过。");
    }

    // EvolutionReserve (Ownable)
    if (await evolutionReserve.owner() === deployer.address) {
        console.log("   转移 EvolutionReserve 所有权...");
        await evolutionReserve.transferOwnership(SAFE_MULTISIG_ADDRESS);
        console.log("   ✓ EvolutionReserve 所有权已转移");
    }

    // VaultFactory (Ownable)
    if (await vaultFactory.owner() === deployer.address) {
        console.log("   转移 VaultFactory 所有权...");
        await vaultFactory.transferOwnership(SAFE_MULTISIG_ADDRESS);
        console.log("   ✓ VaultFactory 所有权已转移");
    }

    // 9. Finalize
    deploymentInfo.network = hre.network.name;
    deploymentInfo.timestamp = new Date().toISOString();
    deploymentInfo.safeMultisigAddress = SAFE_MULTISIG_ADDRESS;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n📁 部署信息已保存至: ${filename}`);
    console.log("\n✅ 创世链ETH版本部署及配置完成!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
