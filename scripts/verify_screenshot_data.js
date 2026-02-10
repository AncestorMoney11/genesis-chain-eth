const { ethers } = require("hardhat");

async function main() {
    const multiSigAddress = "0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B";
    const amoneyProxyAddress = "0x37259E831460F6380c543291167D2cF0CeC170c4";

    console.log(`正在验证截图中的合约数据...`);
    console.log(`查询地址: ${amoneyProxyAddress}`);
    
    const abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function owner() view returns (address)",
        "function totalSupply() view returns (uint256)"
    ];

    try {
        const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
        const amoney = new ethers.Contract(amoneyProxyAddress, abi, provider);
        
        const balance = await amoney.balanceOf(multiSigAddress);
        const symbol = await amoney.symbol();
        const decimals = await amoney.decimals();
        const totalSupply = await amoney.totalSupply();

        console.log(`--- 查询结果 ---`);
        console.log(`代币符号: ${symbol}`);
        console.log(`总供应量: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
        console.log(`多签地址 (${multiSigAddress}) 余额: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
        
        const owner = await amoney.owner().catch(() => "N/A (Possible AccessControl)");
        console.log(`合约 Owner: ${owner}`);

    } catch (error) {
        console.log("查询失败，可能合约尚未部署或地址有误。");
        console.error(error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
