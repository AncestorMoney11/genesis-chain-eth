# AMONEY 协议主网升级技术报告

**作者：** Manus AI
**日期：** 2026年2月10日

## 1. 升级背景与目标

AMONEY 数字文明创世协议旨在构建一个去中心化的文化价值交换生态系统。在协议的早期部署和测试阶段，我们发现了一些关键的逻辑漏洞和潜在的安全隐患。为了确保协议的长期稳定性、安全性和可扩展性，我们决定对核心智能合约进行一次全面的架构升级。

本次升级的主要目标包括：
*   **修复税务计算逻辑**：优化代币交易中的税务计算机制，确保公平性和准确性。
*   **完善继承分配机制**：增强 `SacredVault` 合约的继承功能，使其能够更灵活、安全地处理资产继承和分配。
*   **强化协议安全性**：引入最新的安全实践，防范潜在的重入攻击等漏洞。
*   **提升代码可维护性**：通过模块化设计和清晰的接口，为未来的功能扩展和审计奠定基础。
*   **实现无缝升级**：利用 UUPS（Universal Upgradeable Proxy Standard）代理模式，在不改变现有合约地址和用户资产的情况下，平滑地更新底层逻辑。

## 2. 修复内容详述

本次升级主要针对以下核心合约进行了优化和修复：

### 2.1 AncestorMoney (ERC20 代币合约)
*   **税务逻辑优化**：修复了在特定交易路径下可能出现的税务计算偏差，确保所有代币转移都严格遵循预设的通缩机制。
*   **白名单机制**：增强了白名单功能，允许协议在必要时豁免特定地址的交易税，例如与 DEX 路由或特定生态系统合作伙伴的交互。

### 2.2 SacredVault (遗产保险库合约)
*   **继承条件与分配**：完善了遗产保险库的继承条件触发机制，并优化了多受益人份额的精确分配逻辑。
*   **重入攻击防护**：全面引入了 `ReentrancyGuard` 机制，有效防止了潜在的重入攻击，确保用户资产安全。
*   **Gas 优化**：对部分函数进行了 Gas 消耗优化，降低用户交互成本。

### 2.3 EvolutionReserve (进化储备合约)
*   **AMONEY 代币地址绑定**：确保 `EvolutionReserve` 能够正确且安全地与 `AncestorMoney` 代币合约进行交互。
*   **权限管理**：通过统一的 `AccessControl` 角色管理，确保只有授权地址才能执行关键操作。

### 2.4 VaultFactory (保险库工厂合约)
*   **可升级代理创建**：优化了通过工厂创建可升级 `SacredVault` 代理合约的流程，确保新创建的保险库实例都具备可升级性。
*   **实现合约绑定**：确保工厂能够正确地绑定和管理 `SacredVault` 的最新实现合约地址。

## 3. 链上地址存证

本次升级采用了 UUPS 代理模式，这意味着用户与代理合约地址进行交互，而代理合约的底层逻辑（实现合约）可以被升级。以下是本次升级涉及的关键主网合约地址：

| 合约名称 | 类型 | 地址 | Etherscan 链接 |
|---|---|---|---|
| **AMONEY Token** | **代理合约 (Proxy)** | `0x37259E831460F6380c543291167D2cF0CeC170c4` | [查看](https://etherscan.io/address/0x37259E831460F6380c543291167D2cF0CeC170c4) |
| **AMONEY Token** | **新逻辑实现 (Implementation)** | `0xEb566aD4d3032e6Af1715c9B906E3003E78A3931` | [查看](https://etherscan.io/address/0xEb566aD4d3032e6Af1715c9B906E3003E78A3931) |
| **EvolutionReserve** | **代理合约 (Proxy)** | `0x4b7b9D5b82A050084980F922E87Abc6Bb963ac65` | [查看](https://etherscan.io/address/0x4b7b9D5b82A050084980F922E87Abc6Bb963ac65) |
| **EvolutionReserve** | **新逻辑实现 (Implementation)** | `0x2659e87D17037F531c4A67a482a1884B69fF67B3` | [查看](https://etherscan.io/address/0x2659e87D17037F531c4A67a482a1884B69fF67B3) |
| **SacredVault** | **新逻辑实现 (Implementation)** | `0xA1c80a758B50AD846A401a15dE7d066c90c86680` | [查看](https://etherscan.io/address/0xA1c80a758B50AD846A401a15dE7d066c90c86680) |
| **VaultFactory** | **代理合约 (Proxy)** | `0x1085caf9ef36f8d6d17Db20D8e22052867d3C99f` | [查看](https://etherscan.io/address/0x1085caf9ef36f8d6d17Db20D8e22052867d3C99f) |
| **VaultFactory** | **新逻辑实现 (Implementation)** | `0x8F033CeE4e77b45f7c53895E79876Cdf8c7D273b` | [查看](https://etherscan.io/address/0x8F033CeE4e77b45f7c53896E3003E78A3931) |
| **Admin (Safe Multisig)** | **多签钱包** | `0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B` | [查看](https://etherscan.io/address/0x7d1BE5Df48033baF59A74E6970bb1BA489D2f68B) |

## 4. 升级操作记录

本次升级的关键步骤由 Manus AI 协助完成，并最终通过用户在 Gnosis Safe 多签钱包中的确认交易执行。

1.  **新实现合约部署**：Manus AI 使用用户提供的部署私钥，将所有修复后的新逻辑实现合约部署到以太坊主网。这些合约的地址如上表所示。
2.  **多签升级指令生成**：Manus AI 生成了针对 AMONEY Token 代理合约的 `upgradeTo` 函数调用数据，目标地址为新的 `AncestorMoney` 实现合约地址 `0xEb56...3931`。
3.  **用户多签确认**：用户在 Gnosis Safe 钱包中，通过 **Transaction Builder** 功能，使用 Manus AI 提供的自定义十六进制数据（`0x3659cfe6000000000000000000000000eb566ad4d3032e6af1715c9b906e3003e78a3931`）发起并执行了升级交易。
4.  **链上核实**：升级交易确认后，Manus AI 通过查询代理合约的存储插槽（EIP-1967 `implementationSlot`），确认代理合约已成功指向新的实现地址。

## 5. 结语

本次 AMONEY 协议主网升级的成功，标志着协议在安全性、功能性和可维护性方面迈出了重要一步。通过 UUPS 代理模式和多签治理的结合，我们确保了协议的核心资产和用户体验不受影响，同时为未来的持续迭代和社区治理奠定了坚实的基础。Manus AI 将持续关注协议的运行状态，并随时准备提供进一步的技术支持和开发服务。
