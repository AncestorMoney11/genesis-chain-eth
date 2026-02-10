const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("DEPLOYER_START:", deployer.address);

  // 1. AncestorMoney
  console.log("DEPLOYING_AMONEY...");
  const AncestorMoney = await ethers.getContractFactory("AncestorMoney");
  const amoney = await AncestorMoney.deploy();
  await amoney.waitForDeployment();
  console.log("AMONEY_ADDR:", await amoney.getAddress());

  // 2. EvolutionReserve
  console.log("DEPLOYING_ER...");
  const EvolutionReserve = await ethers.getContractFactory("EvolutionReserve");
  const er = await EvolutionReserve.deploy();
  await er.waitForDeployment();
  console.log("ER_ADDR:", await er.getAddress());

  // 3. SacredVault
  console.log("DEPLOYING_SV...");
  const SacredVault = await ethers.getContractFactory("SacredVault");
  const sv = await SacredVault.deploy();
  await sv.waitForDeployment();
  console.log("SV_ADDR:", await sv.getAddress());

  // 4. VaultFactory
  console.log("DEPLOYING_VF...");
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const vf = await VaultFactory.deploy();
  await vf.waitForDeployment();
  console.log("VF_ADDR:", await vf.getAddress());

  console.log("DEPLOYMENT_FINISHED");
}

main().catch((error) => {
  console.error("DEPLOYMENT_ERROR:", error);
  process.exit(1);
});
