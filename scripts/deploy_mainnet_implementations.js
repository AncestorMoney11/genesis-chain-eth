const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying implementation contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy AncestorMoney Implementation
  console.log("Deploying AncestorMoney implementation...");
  const AncestorMoney = await ethers.getContractFactory("AncestorMoney");
  const amoneyImpl = await AncestorMoney.deploy();
  await amoneyImpl.waitForDeployment();
  const amoneyImplAddress = await amoneyImpl.getAddress();
  console.log("AncestorMoney Implementation deployed to:", amoneyImplAddress);

  // 2. Deploy EvolutionReserve Implementation
  console.log("Deploying EvolutionReserve implementation...");
  const EvolutionReserve = await ethers.getContractFactory("EvolutionReserve");
  const erImpl = await EvolutionReserve.deploy();
  await erImpl.waitForDeployment();
  const erImplAddress = await erImpl.getAddress();
  console.log("EvolutionReserve Implementation deployed to:", erImplAddress);

  // 3. Deploy SacredVault Implementation
  console.log("Deploying SacredVault implementation...");
  const SacredVault = await ethers.getContractFactory("SacredVault");
  const svImpl = await SacredVault.deploy();
  await svImpl.waitForDeployment();
  const svImplAddress = await svImpl.getAddress();
  console.log("SacredVault Implementation deployed to:", svImplAddress);

  // 4. Deploy VaultFactory Implementation
  console.log("Deploying VaultFactory implementation...");
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const vfImpl = await VaultFactory.deploy();
  await vfImpl.waitForDeployment();
  const vfImplAddress = await vfImpl.getAddress();
  console.log("VaultFactory Implementation deployed to:", vfImplAddress);

  // Save the addresses
  const deploymentData = {
    network: "mainnet",
    timestamp: new Date().toISOString(),
    implementations: {
      ancestorMoney: amoneyImplAddress,
      evolutionReserve: erImplAddress,
      sacredVault: svImplAddress,
      vaultFactory: vfImplAddress
    }
  };

  fs.writeFileSync(
    "deployments/mainnet_upgrade_implementations.json",
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("All implementations deployed and addresses saved to deployments/mainnet_upgrade_implementations.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
