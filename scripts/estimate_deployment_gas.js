const { ethers } = require("hardhat");

async function main() {
  console.log("Starting Gas Estimation for Deployment...");

  // 1. AncestorMoney
  const AncestorMoney = await ethers.getContractFactory("AncestorMoney");
  const amoneyDeployment = await AncestorMoney.getDeployTransaction();
  const amoneyGas = await ethers.provider.estimateGas(amoneyDeployment);
  console.log(`AncestorMoney Deployment Gas: ${amoneyGas.toString()}`);

  // 2. EvolutionReserve
  const EvolutionReserve = await ethers.getContractFactory("EvolutionReserve");
  const erDeployment = await EvolutionReserve.getDeployTransaction();
  const erGas = await ethers.provider.estimateGas(erDeployment);
  console.log(`EvolutionReserve Deployment Gas: ${erGas.toString()}`);

  // 3. SacredVault (Implementation)
  const SacredVault = await ethers.getContractFactory("SacredVault");
  const svDeployment = await SacredVault.getDeployTransaction();
  const svGas = await ethers.provider.estimateGas(svDeployment);
  console.log(`SacredVault (Implementation) Deployment Gas: ${svGas.toString()}`);

  // 4. VaultFactory
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const vfDeployment = await VaultFactory.getDeployTransaction(); // No constructor args
  const vfGas = await ethers.provider.estimateGas(vfDeployment);
  console.log(`VaultFactory Deployment Gas: ${vfGas.toString()}`);

  console.log("---------------------------------------");
  const totalGas = amoneyGas + erGas + svGas + vfGas;
  console.log(`Estimated Total Gas: ${totalGas.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
