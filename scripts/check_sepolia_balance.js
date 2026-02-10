const { ethers } = require("hardhat");

async function main() {
    const multiSigAddress = "0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B";
    const amoneyProxyAddress = "0xFC7A47Cd9267DCf280dAb941Fb668567128eE642";

    console.log(`正在查询 Sepolia 测试网上的余额...`);
    
    const abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function owner() view returns (address)"
    ];

    try {
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        const amoney = new ethers.Contract(amoneyProxyAddress, abi, provider);
        
        const balance = await amoney.balanceOf(multiSigAddress);
        const symbol = await amoney.symbol();
        const decimals = await amoney.decimals();
        console.log(`多签地址余额: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
        
        const owner = await amoney.owner();
        console.log(`合约 Owner: ${owner}`);

        const deployerAddress = "0x2002BD9e4971A6490A49634B0579c2e83086B22c";
        const deployerBalance = await amoney.balanceOf(deployerAddress);
        console.log(`代理钱包余额: ${ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);

    } catch (error) {
        console.log("查询失败。");
        console.error(error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
