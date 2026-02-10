const { ethers } = require("hardhat");

async function main() {
    const multiSig = "0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B";
    const contracts = {
        "AMONEY Proxy": "0x37259E831460F6380c543291167D2cF0CeC170c4",
        "EvolutionReserve Proxy": "0x4b7b9D5b82A050084980F922E87abc6Bb963ac65",
        "VaultFactory Proxy": "0x1085caf9ef36f8d6d17db20d8e22052867d3c99f",
        "SacredVault Implementation": "0xA1c80a758B50AD846A401a15dE7d066c90c86680"
    };

    console.log(`--- 开始全量权限审计 ---`);
    const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");

    for (const [name, address] of Object.entries(contracts)) {
        console.log(`\n检查 ${name} (${address}):`);
        
        try {
            // 检查 AccessControl (DEFAULT_ADMIN_ROLE)
            const acAbi = ["function hasRole(bytes32,address) view returns (bool)", "function getRoleAdmin(bytes32) view returns (bytes32)"];
            const acContract = new ethers.Contract(address, acAbi, provider);
            const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
            
            const isAdmin = await acContract.hasRole(DEFAULT_ADMIN_ROLE, multiSig);
            console.log(`   - 多签是否拥有 Admin 权限: ${isAdmin ? "✅ 是" : "❌ 否"}`);
            
            if (!isAdmin) {
                // 检查当前部署者地址是否还保留权限
                const deployer = "0x2002BD9e4971A6490A49634B0579c2e83086B22c";
                const isDeployerAdmin = await acContract.hasRole(DEFAULT_ADMIN_ROLE, deployer);
                console.log(`   - 部署者是否仍拥有 Admin 权限: ${isDeployerAdmin ? "⚠️ 是" : "✅ 否"}`);
            }

            // 检查 Ownable (owner)
            const ownableAbi = ["function owner() view returns (address)"];
            const ownableContract = new ethers.Contract(address, ownableAbi, provider);
            try {
                const owner = await ownableContract.owner();
                console.log(`   - 当前 Owner 地址: ${owner}`);
                if (owner.toLowerCase() === multiSig.toLowerCase()) {
                    console.log(`   - Owner 是否为多签: ✅ 是`);
                } else {
                    console.log(`   - Owner 是否为多签: ⚠️ 否 (当前为: ${owner})`);
                }
            } catch (e) {
                console.log(`   - 该合约未实现标准的 Ownable 接口`);
            }
        } catch (error) {
            console.log(`   - 检查失败: ${error.message}`);
        }
    }
}

main().catch(console.error);
