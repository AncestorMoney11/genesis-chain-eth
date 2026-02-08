# AMONEY Genesis 创世链项目部署成果

## 以太坊 Sepolia 测试网验证报告

**演示者**: Manus AI

**日期**: 2026年2月8日

---

## 1. 项目概览：AMONEY Genesis 创世链

### 什么是 AMONEY Genesis？

AMONEY Genesis 是一个基于 ERC20 标准的去中心化数字经济生态系统，旨在通过创新的智能合约机制，构建一个可持续、公平且具有文化传承意义的区块链项目。它不仅仅是一个代币，更是一个包含祖先货币、神圣保险库和进化储备的完整生态系统。

### 核心特性

*   **通缩型 ERC20 代币**: AMONEY 代币在每次转账时自动销毁 0.5%，实现持续通缩，提升代币价值。
*   **可升级智能合约架构**: 采用 OpenZeppelin UUPS 代理模式，确保合约未来可升级，灵活应对业务需求和安全漏洞。
*   **遗产保险库系统 (SacredVault)**: 允许用户创建数字遗产保险库，设定受益人、分配比例和继承条件，实现数字资产的传承。
*   **进化储备机制 (EvolutionReserve)**: 记录和激励社区的文化活动，将文化贡献转化为“文化能量”，为生态系统提供持续动力。

---

## 2. 技术架构与核心合约

### 技术栈

*   **区块链平台**: 以太坊 (Ethereum)
*   **开发框架**: Hardhat (提供强大的开发、测试和部署工具)
*   **智能合约语言**: Solidity `^0.8.22` (确保代码安全性和最新功能)
*   **可升级性方案**: OpenZeppelin UUPS Proxies (实现合约逻辑的无缝升级)
*   **主要依赖**: `@openzeppelin/contracts`, `@nomicfoundation/hardhat-toolbox`, `dotenv`, `ethers`

### 核心合约概览

| 合约名称 | 描述 | 关键功能 |
| :--- | :--- | :--- |
| **AncestorMoney.sol** | AMONEY 核心代币合约 | ERC20 标准，0.5% 转账销毁，暂停/激活，所有权管理，与 VaultFactory 和 EvolutionReserve 交互。 |
| **SacredVault.sol** | 遗产保险库逻辑合约 | 管理保险库的创建、受益人、份额、继承条件、维护费用支付和文化能量累积。 |
| **VaultFactory.sol** | 保险库工厂合约 | 负责部署和管理可升级的 SacredVault 代理实例，并设定其实现合约。 |
| **EvolutionReserve.sol** | 进化储备合约 | 记录用户文化活动，将 AMONEY 转换为文化能量，未来将与意识协议连接。 |

---

## 3. 部署流程：以太坊 Sepolia 测试网

### 部署目标

在将 AMONEY Genesis 项目部署到以太坊主网之前，我们首先在 **Sepolia 测试网**上进行全面验证，以确保所有合约功能正常、交互无误，并识别潜在问题。

### 部署工具与环境

*   **Hardhat**: 用于编译、测试和部署智能合约。
*   **npm**: Node.js 包管理器，用于安装项目依赖。
*   **dotenv**: 用于安全管理环境变量，如 RPC URL 和私钥。
*   **Alchemy**: 提供 Sepolia 测试网的 RPC 服务。

### 关键部署步骤

1.  **环境配置**: 配置 `.env` 文件，包含 Sepolia RPC URL 和部署账户的私钥。
2.  **依赖安装**: 确保所有 Hardhat 和 OpenZeppelin 依赖已正确安装。
3.  **合约编译**: 使用 Hardhat 编译所有 Solidity 合约，确保无编译错误。
4.  **执行部署脚本**: 运行 `scripts/deploy-genesis-chain.js` 脚本，该脚本自动化部署所有核心合约。
    *   脚本使用 `hre.upgrades.deployProxy` 部署可升级合约。
    *   初始化合约并设置必要的关联地址。
    *   执行 AMONEY 代币的创世分发。
    *   激活 AMONEY 代币。
5.  **部署信息记录**: 部署完成后，将所有合约地址、网络信息等保存到本地 JSON 文件。

---

## 4. Sepolia 测试网部署成果

创世链项目已成功部署至以太坊 Sepolia 测试网。以下是本次部署的关键信息：

### 已部署合约地址

| 合约名称 | 角色 | 地址 (可点击跳转 Etherscan) |
| :--- | :--- | :--- |
| **AncestorMoney** | 核心代币 (Proxy) | [0xFC7A47Cd9267DCf280dAb941Fb668567128eE642](https://sepolia.etherscan.io/address/0xFC7A47Cd9267DCf280dAb941Fb668567128eE642) |
| **EvolutionReserve** | 进化储备 (Proxy) | [0x2C2190699b9fb5B078326B97c01F1704b8615530](https://sepolia.etherscan.io/address/0x2C2190699b9fb5B078326B97c01F1704b8615530) |
| **VaultFactory** | 保险库工厂 (Proxy) | [0x2076Ea08DeFD6166b1f85dC42b123347c4653F8a](https://sepolia.etherscan.io/address/0x2076Ea08DeFD6166b1f85dC42b123347c4653F8a) |
| **SacredVault** | 保险库逻辑实现 | [0x53e22b1912697736d46a207824ed80C8d8CC5D7E](https://sepolia.etherscan.io/address/0x53e22b1912697736d46a207824ed80C8d8CC5D7E) |

### 初始配置状态

*   **AMONEY 代币**: 已成功激活，可以进行转账操作。
*   **合约关联**: AMONEY 代币已正确配置 VaultFactory 和 EvolutionReserve 的地址。
*   **创世分发**: 999.99 亿 AMONEY 代币已按照预设比例分发至指定测试地址。

您可以通过点击上述 Etherscan 链接，查看每个合约的详细信息和交易记录。

---

## 5. 后续步骤与安全建议

### ⚠️ 重要安全提醒

在本次 Sepolia 测试网部署过程中，部署账户的私钥曾被用于配置。为了您的资产安全，**请务必立即废弃本次使用的测试账户 (Account 5)**，切勿在任何生产环境或主网部署中使用该私钥。

### 主网部署准备

在考虑主网部署之前，强烈建议您完成以下关键步骤：

1.  **部署账户安全**: 准备一个全新的、由硬件钱包（如 Ledger, Trezor）生成的部署账户，确保私钥永不泄露。
2.  **专业安全审计**: 委托专业的区块链安全公司对所有智能合约代码进行全面审计，发现并修复潜在漏洞。
3.  **功能测试**: 在 Sepolia 测试网上进行详尽的功能测试，覆盖所有合约交互场景，确保业务逻辑的正确性。
4.  **前端界面开发**: 开发并测试用户友好的前端界面，以便用户能够轻松与创世链生态系统进行交互。
5.  **社区沟通**: 提前向社区公布主网部署计划、审计报告和安全措施，建立信任。

### 展望未来

成功部署至主网后，AMONEY Genesis 将正式启动，开启其数字经济生态的宏伟篇章。我们将持续关注项目进展，并随时准备提供技术支持。

---

## 参考文献

[1] OpenZeppelin Upgrades. (n.d.). *UUPS Proxies*. Retrieved from [https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#uups-proxies](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#uups-proxies)
[2] Hardhat. (n.d.). *Hardhat Documentation*. Retrieved from [https://hardhat.org/docs](https://hardhat.org/docs)
[3] Ethereum Sepolia Testnet. (n.d.). *Etherscan*. Retrieved from [https://sepolia.etherscan.io/](https://sepolia.etherscan.io/)

