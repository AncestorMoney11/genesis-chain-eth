const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const filePath = "deployments/mainnet_progress.json";
  if (!fs.existsSync(filePath)) {
    console.error("Progress file not found!");
    return;
  }
  const progress = JSON.parse(fs.readFileSync(filePath));

  console.log("Verifying contracts on Etherscan...");

  // 1. AncestorMoney
  try {
    console.log("Verifying AncestorMoney...");
    await hre.run("verify:verify", {
      address: progress.amoney,
      constructorArguments: [],
    });
  } catch (e) { console.log("AMONEY verify failed:", e.message); }

  // 2. EvolutionReserve
  try {
    console.log("Verifying EvolutionReserve...");
    await hre.run("verify:verify", {
      address: progress.er,
      constructorArguments: [],
    });
  } catch (e) { console.log("ER verify failed:", e.message); }

  // 3. SacredVault
  try {
    console.log("Verifying SacredVault...");
    await hre.run("verify:verify", {
      address: progress.sv,
      constructorArguments: [],
    });
  } catch (e) { console.log("SV verify failed:", e.message); }

  // 4. VaultFactory
  try {
    console.log("Verifying VaultFactory...");
    await hre.run("verify:verify", {
      address: progress.vf,
      constructorArguments: [],
    });
  } catch (e) { console.log("VF verify failed:", e.message); }

  console.log("Verification process finished.");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
