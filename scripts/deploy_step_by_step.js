const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const filePath = "deployments/mainnet_progress.json";
  
  let progress = {};
  if (fs.existsSync(filePath)) {
    progress = JSON.parse(fs.readFileSync(filePath));
  }

  console.log("Deployer:", deployer.address);

  // 1. AncestorMoney
  if (!progress.amoney) {
    console.log("Deploying AncestorMoney...");
    const AncestorMoney = await ethers.getContractFactory("AncestorMoney");
    const amoney = await AncestorMoney.deploy();
    await amoney.waitForDeployment();
    progress.amoney = await amoney.getAddress();
    fs.writeFileSync(filePath, JSON.stringify(progress, null, 2));
    console.log("AMONEY_ADDR:", progress.amoney);
  } else {
    console.log("AMONEY already deployed at:", progress.amoney);
  }

  // 2. EvolutionReserve
  if (!progress.er) {
    console.log("Deploying EvolutionReserve...");
    const EvolutionReserve = await ethers.getContractFactory("EvolutionReserve");
    const er = await EvolutionReserve.deploy();
    await er.waitForDeployment();
    progress.er = await er.getAddress();
    fs.writeFileSync(filePath, JSON.stringify(progress, null, 2));
    console.log("ER_ADDR:", progress.er);
  } else {
    console.log("ER already deployed at:", progress.er);
  }

  // 3. SacredVault
  if (!progress.sv) {
    console.log("Deploying SacredVault...");
    const SacredVault = await ethers.getContractFactory("SacredVault");
    const sv = await SacredVault.deploy({ gasLimit: 3000000 });
    await sv.waitForDeployment();
    progress.sv = await sv.getAddress();
    fs.writeFileSync(filePath, JSON.stringify(progress, null, 2));
    console.log("SV_ADDR:", progress.sv);
  } else {
    console.log("SV already deployed at:", progress.sv);
  }

  // 4. VaultFactory
  if (!progress.vf) {
    console.log("Deploying VaultFactory...");
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    const vf = await VaultFactory.deploy({ gasLimit: 3000000 });
    await vf.waitForDeployment();
    progress.vf = await vf.getAddress();
    fs.writeFileSync(filePath, JSON.stringify(progress, null, 2));
    console.log("VF_ADDR:", progress.vf);
  } else {
    console.log("VF already deployed at:", progress.vf);
  }

  console.log("DEPLOYMENT_COMPLETE");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
