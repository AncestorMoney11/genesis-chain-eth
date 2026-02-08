const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`部署者地址: ${deployer.address}`);
    console.log(`当前余额: ${hre.ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
