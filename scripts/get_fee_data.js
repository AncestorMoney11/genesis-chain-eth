const hre = require("hardhat");

async function main() {
    const feeData = await hre.ethers.provider.getFeeData();
    console.log("当前网络费用数据:");
    console.log(`  Gas Price: ${feeData.gasPrice ? hre.ethers.formatUnits(feeData.gasPrice, 'gwei') : 'N/A'} Gwei`);
    console.log(`  Max Fee Per Gas: ${feeData.maxFeePerGas ? hre.ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : 'N/A'} Gwei`);
    console.log(`  Max Priority Fee Per Gas: ${feeData.maxPriorityFeePerGas ? hre.ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : 'N/A'} Gwei`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
