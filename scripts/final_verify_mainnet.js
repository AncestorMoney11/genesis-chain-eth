const { ethers } = require("hardhat");

async function main() {
    const proxyAddress = "0x37259E831460F6380c543291167D2cF0CeC170c4";
    const expectedImpl = "0xEb566aD4d3032e6Af1715c9B906E3003E78A3931";
    
    // EIP-1967 implementation slot
    const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

    console.log(`--- 开始深度核实主网升级状态 ---`);
    const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");

    try {
        // 1. 检查实现地址
        const storageValue = await provider.getStorage(proxyAddress, implementationSlot);
        const currentImpl = ethers.getAddress(ethers.dataSlice(storageValue, 12));
        console.log(`1. 实现地址核实:`);
        console.log(`   - 当前实现: ${currentImpl}`);
        console.log(`   - 预期实现: ${expectedImpl}`);

        if (currentImpl.toLowerCase() === expectedImpl.toLowerCase()) {
            console.log("   ✅ 实现地址匹配成功！");
        } else {
            console.log("   ❌ 实现地址不匹配。");
        }

        // 2. 验证新逻辑特有功能 (isTaxExempt)
        console.log(`2. 新逻辑功能验证:`);
        const abi = ["function isTaxExempt(address) view returns (bool)"];
        const contract = new ethers.Contract(proxyAddress, abi, provider);
        
        // 检查多签地址是否在免税白名单（升级脚本中应已设置或由新逻辑默认支持）
        const multiSig = "0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B";
        const isExempt = await contract.isTaxExempt(multiSig);
        console.log(`   - 多签地址免税状态查询: ${isExempt ? "已免税" : "未免税"}`);
        console.log("   ✅ 功能调用成功，证明新逻辑已生效。");

    } catch (error) {
        console.error("核实失败:", error.message);
    }
}

main().catch(console.error);
