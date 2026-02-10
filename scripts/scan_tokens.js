const { ethers } = require("hardhat");

async function main() {
    const multiSigAddress = "0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B";
    
    // 常见的 AMONEY 相关可能地址或名称
    const possibleTokens = [
        { name: "AMONEY (v1?)", address: "0x89C6793A1713506B628109605481711204652A77" },
        { name: "AMONEY (v2?)", address: "0x13119e34e140097a507b07a5564bde1bc375d9e6" },
        { name: "Ancestor Money", address: "0xbe9b3f4fcf86ec624a65ae8033950eeba20ef190" }
    ];

    console.log(`正在扫描多签地址: ${multiSigAddress} 的代币余额...\n`);

    for (const token of possibleTokens) {
        try {
            const contract = await ethers.getContractAt("IERC20", token.address);
            const balance = await contract.balanceOf(multiSigAddress);
            const decimals = await contract.decimals().catch(() => 18);
            const symbol = await contract.symbol().catch(() => "UNKNOWN");
            
            console.log(`合约 [${token.name}] (${token.address}):`);
            console.log(`- 余额: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
        } catch (error) {
            console.log(`合约 [${token.name}] (${token.address}): 无法访问或非标准 ERC20`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
