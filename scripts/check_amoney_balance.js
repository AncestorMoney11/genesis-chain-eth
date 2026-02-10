const { ethers } = require("hardhat");

async function main() {
    const multiSigAddress = "0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B";
    // 这是已知的旧版 AMONEY 主网合约地址（如果存在的话）
    // 如果是新部署，这里会查不到。
    const amoneyAddress = "0x89C6793A1713506B628109605481711204652A77"; // 示例地址，需根据实际情况调整

    console.log(`正在查询多签地址: ${multiSigAddress}`);
    
    try {
        const amoney = await ethers.getContractAt("IERC20", amoneyAddress);
        const balance = await amoney.balanceOf(multiSigAddress);
        const symbol = await amoney.symbol();
        console.log(`在合约 ${amoneyAddress} 中持有 ${ethers.formatEther(balance)} ${symbol}`);
    } catch (error) {
        console.log("未在已知旧合约中查询到余额，或者合约地址不正确。");
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
