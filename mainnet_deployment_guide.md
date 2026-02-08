## 创世链（AMONEY Genesis）项目主网部署安全指南与操作手册

尊敬的用户，

本指南旨在为您提供将创世链（AMONEY Genesis）项目安全部署到以太坊主网的详细步骤和最佳实践。请务必仔细阅读并严格遵循本指南中的所有建议，因为主网操作涉及真实资产，且交易不可逆。

### 1. 部署前最终核查清单

在执行任何主网部署操作之前，请再次确认以下所有项：

*   **代码审计**：**强烈建议**在主网部署前，由专业的第三方安全审计公司对所有合约代码进行全面审计。AI 优化和自动化测试可以发现大部分问题，但人工审计能发现更深层次的逻辑漏洞和经济攻击向量。
*   **多签钱包**：您已成功创建并验证了 **`0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B`** 这个 3/5 Safe 多签钱包。所有核心合约的管理员权限将在部署后自动移交给此地址，确保去中心化治理。
*   **硬件钱包**：您将使用 OneKey 或其他硬件钱包作为部署账户，并且该硬件钱包的私钥从未以任何形式离开过设备。
*   **部署资金**：您的部署账户（即 `MAINNET_PRIVATE_KEY` 对应的地址）中拥有足够的 ETH 来支付部署 Gas 费用（根据估算，约 **0.136 ETH**，请预留更多以应对 Gas 波动）。
*   **API 密钥**：您的 `.env` 文件已正确配置 `ALCHEMY_MAINNET_RPC_URL`、`ETHERSCAN_API_KEY` 和 `COINMARKETCAP_API_KEY`。
*   **主网私钥**：您已在 `.env` 文件中设置了 `MAINNET_PRIVATE_KEY`。**此私钥必须是您用于主网部署的硬件钱包或安全隔离的软件钱包的私钥。**

### 2. Hardhat 配置与环境变量

您的项目 `hardhat.config.js` 已更新，包含了主网部署配置和 `gasReporter`。您的 `.env` 文件现在应该包含以下关键变量：

```dotenv
SEPOLIA_RPC="..."
PRIVATE_KEY="..." # 用于测试网，主网部署不使用

ALCHEMY_MAINNET_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/G4dGND_2mKe1-Y8MdtH4o"
ETHERSCAN_API_KEY="SJPJV535H34G49NFR86IH3X7W9A1Q5AMM8"
COINMARKETCAP_API_KEY="9c8f27122da941578f11f09fb7d4a6bb"
MAINNET_PRIVATE_KEY="YOUR_MAINNET_PRIVATE_KEY" # 替换为您的主网部署私钥
```

**重要提示：** `MAINNET_PRIVATE_KEY` 必须是您用于主网部署的钱包私钥。**请勿将任何敏感私钥直接写入代码或提交到版本控制系统。** 如果您使用硬件钱包，通常不需要直接在 `.env` 中放置私钥，而是通过 Hardhat 的插件（如 `hardhat-ethers` 配合 `ethers` 库的 `Wallet.fromMnemonic` 或 `Wallet.fromEncryptedJson`）在运行时安全地加载。但为了简化，我们在此使用环境变量。

### 3. 主网部署操作步骤

**请在安全、稳定的网络环境下执行以下操作。**

1.  **打开终端**：导航到您的项目根目录 `/home/ubuntu/genesis-chain-eth`。

2.  **安装依赖**：确保所有 Hardhat 依赖都已安装。
    ```bash
    cd /home/ubuntu/genesis-chain-eth
    npm install
    ```

3.  **执行部署脚本**：运行以下命令，将合约部署到以太坊主网。
    ```bash
    cd /home/ubuntu/genesis-chain-eth
    npx hardhat run scripts/deploy-genesis-chain.js --network mainnet
    ```
    *   **`--network mainnet`**：指定部署到 Hardhat 配置中的 `mainnet` 网络。
    *   脚本将自动部署所有合约，配置相互关系，执行创世分发，激活代币，并将所有可升级合约的 `DEFAULT_ADMIN_ROLE` 移交给您的 Safe 多签地址 `0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B`。

4.  **监控部署过程**：终端会输出部署进度和合约地址。请仔细核对每个合约的部署地址。

5.  **保存部署信息**：部署完成后，所有合约地址和部署详情将自动保存到 `deployments/genesis-chain-mainnet.json` 文件中。

### 4. 部署后验证与操作

1.  **Etherscan 验证**：
    *   访问 [Etherscan](https://etherscan.io/)，搜索您部署的每个合约地址。
    *   **验证合约源码**：使用 `hardhat verify` 命令或 Etherscan 界面手动验证合约源码，确保链上代码与您的代码库一致。
    *   **检查权限**：在 Etherscan 上查看每个合约的 `DEFAULT_ADMIN_ROLE` 是否已成功转移到您的 Safe 多签地址。

2.  **Safe 多签操作**：
    *   访问 [Safe.global](https://app.safe.global/)，连接您的 Safe 多签钱包。
    *   您将看到 Safe 钱包中列出了所有被移交权限的合约。未来所有涉及管理员权限的操作（如合约升级、暂停、修改参数等）都需要通过 Safe 多签提案，并由至少 3/5 的持有者签名确认。

### 5. 风险与免责声明

*   **不可逆性**：区块链交易是不可逆的。一旦部署到主网，合约代码和数据将永久存在，无法撤销。
*   **资金安全**：请务必妥善保管您的硬件钱包和所有私钥。任何私钥泄露都可能导致资产损失。
*   **Gas 波动**：主网 Gas 价格波动剧烈，请在部署前再次确认当前 Gas 价格，并确保账户余额充足。
*   **AI 协助**：我作为 AI 助手，已尽力提供最佳实践和安全建议。但最终的部署决策和风险承担由您负责。在执行任何主网操作前，请务必进行独立判断和尽职调查。

祝您的创世链项目主网部署顺利成功！
