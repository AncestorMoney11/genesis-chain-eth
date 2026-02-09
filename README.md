# AMONEY - 数字文明创世协议

![AMONEY Logo](assets/amoney_logo.png)


[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen?style=for-the-badge&logo=github)](https://AncestorMoney11.github.io/genesis-chain-eth/)



## 项目简介

**AMONEY** 是一个开创性的数字文明创世协议，旨在构建一个去中心化、自治且可持续的数字生态系统。我们通过创新的区块链技术和智能合约，为数字资产的发行、管理和价值流转提供安全、透明且高效的基础设施。

## 核心理念

*   **去中心化**：通过智能合约和多签机制，确保协议的去中心化治理和操作。
*   **自治性**：协议的核心功能由代码自动执行，减少人为干预。
*   **可持续性**：设计长期的经济模型和社区激励机制，确保生态的持续发展。
*   **透明性**：所有链上操作公开可查，增加信任度。

## 主要特性

*   **AMONEY 代币**：协议的原生代币，用于生态治理、价值捕获和激励。
*   **EvolutionReserve**：核心储备合约，管理协议的资产储备和发行机制。
*   **VaultFactory & SacredVault**：金库工厂和圣金库合约，提供安全的资产存储和管理解决方案。
*   **多签管理**：通过 Gnosis Safe 多签钱包，确保关键操作的安全性。

## 主题曲

我们为 AMONEY 项目创作了专属主题曲《COINCROSSING》，欢迎访问者欣赏：

*   [AMONEY《COINCROSSING》.mp3](AMONEY_Theme_Song_COINCROSSING.mp3)

## 文档中心

我们提供了详细的白皮书和项目报告，深入阐述了 AMONEY 的愿景、技术架构、经济模型和社区建设规划。您可以通过以下链接在线预览或下载：

*   **白皮书 (Whitepaper)**：
    *   [在线预览](https://ancestormoney11.github.io/genesis-chain-eth/#whitepaper-preview)
    *   [下载 PDF](https://ancestormoney11.github.io/genesis-chain-eth/AMONEY_Whitepaper.pdf)

*   **项目报告 (Project Report)**：
    *   [在线预览](https://ancestormoney11.github.io/genesis-chain-eth/#report-preview)
    *   [下载 PPTX](https://ancestormoney11.github.io/genesis-chain-eth/e03041e8269a078ffc6f8c5d2920fe07.pptx)

## 快速开始 (开发人员)

### 环境准备

确保您已安装 Node.js, npm/yarn, 和 Hardhat。

```bash
npm install --global yarn
yarn add global hardhat
```

### 克隆仓库

```bash
git clone https://github.com/AncestorMoney11/genesis-chain-eth.git
cd genesis-chain-eth
```

### 安装依赖

```bash
yarn install
```

### 编译合约

```bash
npx hardhat compile
```

### 运行测试

```bash
npx hardhat test
```

### 部署合约 (示例)

请参考 `scripts/deploy-genesis-chain.js` 文件进行部署。在部署到主网前，请务必配置您的 `.env` 文件，包含 `PRIVATE_KEY` 和 `ETHERSCAN_API_KEY`。

## 社区与贡献

我们欢迎所有对 AMONEY 协议感兴趣的开发者和社区成员加入。您可以通过以下方式参与：

*   **提交 Issue**：报告 Bug 或提出功能建议。
*   **提交 Pull Request**：贡献代码或文档。
*   **加入社区讨论**：关注我们的社交媒体或论坛。

## 联系我们

*   **GitHub Issues**：[https://github.com/AncestorMoney11/genesis-chain-eth/issues](https://github.com/AncestorMoney11/genesis-chain-eth/issues)
*   **邮箱**：contact@amoney.io

## 部署合约 (Mainnet)

| 合约名称 | 合约地址 | Etherscan 链接 |
| :--- | :--- | :--- |
| **AMONEY Token (Proxy)** | `0x37259E831460F6380c543291167D2cF0CeC170c4` | [查看](https://etherscan.io/address/0x37259E831460F6380c543291167D2cF0CeC170c4) |
| **AMONEY Token (Implementation)** | `0x7377915EccD8B58c245Db30be2C3c903D3E028A8` | [查看](https://etherscan.io/address/0x7377915EccD8B58c245Db30be2C3c903D3E028A8#code) |
| **EvolutionReserve (Proxy)** | `0x4b7b9D5b82A050084980F922e87Abc6Bb963ac65` | [查看](https://etherscan.io/address/0x4b7b9D5b82A050084980F922e87Abc6Bb963ac65) |
| **EvolutionReserve (Implementation)** | `0x48aAC5ec8C73d842c78fdB5953c591715dc94351` | [查看](https://etherscan.io/address/0x48aAC5ec8C73d842c78fdB5953c591715dc94351#code) |
| **VaultFactory (Proxy)** | `0x1085caf9ef36F8d6D17Db20D8e22052867d3C99f` | [查看](https://etherscan.io/address/0x1085caf9ef36F8d6D17Db20D8e22052867d3C99f) |
| **VaultFactory (Implementation)** | `0x05A9EdF8e111ABda26A893848ADf02568df3b63d` | [查看](https://etherscan.io/address/0x05A9EdF8e111ABda26A893848ADf02568df3b63d#code) |
| **SacredVault (Implementation)** | `0x0c7117e8366fa99aab436d39E0eFbf1885Aa9E25` | [查看](https://etherscan.io/address/0x0c7117e8366fa99aab436d39E0eFbf1885Aa9E25#code) |
| **Admin (Safe Multisig)** | `0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B` | [查看](https://etherscan.io/address/0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B) |



## 许可证

本项目采用 [MIT License](LICENSE) 开源。
