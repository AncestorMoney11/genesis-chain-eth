const { ethers } = require("hardhat");

async function main() {
    const multiSigAddress = "0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B";
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    
    const balance = await provider.getBalance(multiSigAddress);
    console.log(`多签地址 Sepolia ETH 余额: ${ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
