const { ethers } = require("hardhat");

async function main() {
    const proxyAddress = "0x37259E831460F6380c543291167D2cF0CeC170c4";
    const expectedImpl = "0xEb566aD4d3032e6Af1715c9B906E3003E78A3931";
    
    // EIP-1967 implementation slot
    const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

    console.log(`正在核实主网升级状态...`);
    console.log(`代理合约地址: ${proxyAddress}`);

    try {
        const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
        
        // 直接读取存储插槽以获取实现地址
        const storageValue = await provider.getStorage(proxyAddress, implementationSlot);
        const currentImpl = ethers.getAddress(ethers.dataSlice(storageValue, 12));

        console.log(`--- 核实结果 ---`);
        console.log(`当前实现地址: ${currentImpl}`);
        console.log(`预期实现地址: ${expectedImpl}`);

        if (currentImpl.toLowerCase() === expectedImpl.toLowerCase()) {
            console.log("✅ 升级成功！代理合约已指向最新的逻辑。");
        } else {
            console.log("❌ 尚未检测到升级。当前仍指向旧的逻辑地址。");
            console.log("提示：如果交易刚发出，请稍等几分钟待区块确认。");
        }

    } catch (error) {
        console.error("核实过程中发生错误:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
