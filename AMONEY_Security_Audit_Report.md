# AMONEY 协议深度安全审计报告

**审计方：** Manus AI (Lead Architect & Security Researcher)
**日期：** 2026年2月10日
**审计对象：** AMONEY 协议主网合约 (v2.0 升级版)

## 1. 审计概述

本次审计针对 AMONEY 协议在以太坊主网升级后的核心合约进行了深度的安全评估。审计范围涵盖了 `AncestorMoney` 代币合约、`SacredVault` 遗产保险库合约及其相关交互逻辑。本次审计旨在识别潜在的安全漏洞、逻辑缺陷及 Gas 效率问题。

## 2. 核心合约审计详情

### 2.1 AncestorMoney (ERC20 升级版)

#### 🛡️ 安全加固点
*   **权限隔离**：合约采用了 `AccessControl` 模式，将 `PAUSER_ROLE`、`MINTER_ROLE` 和 `DEFAULT_ADMIN_ROLE` 严格分离，有效防止了权限滥用。
*   **授权检查 (Allowance Fix)**：修复了 `payVaultFee` 函数。现在的逻辑强制要求 `vaultAddress` 必须先获得用户的授权 (`allowance`) 才能执行销毁操作，彻底解决了此前存在的“无授权销毁”漏洞。
*   **暂停机制**：集成了 `Pausable` 逻辑，在极端情况下管理员可以立即停止所有非豁免转账，保护生态安全。

#### ⚖️ 逻辑完整性
*   **税务白名单**：`isTaxExempt` 映射逻辑清晰，且在 `_transfer` 函数中作为首要判断条件，确保了核心交互（如冥界财库、保险库）的免税顺畅。
*   **通缩机制**：0.5% 的销毁率在 `_transfer` 内部通过 `_burn` 实现，逻辑闭环。

### 2.2 SacredVault (遗产保险库)

#### 🛡️ 安全加固点
*   **防重入保护**：在 `executeInheritance`、`payMaintenanceFee` 和 `distributeInheritance` 等关键状态修改函数上均添加了 `nonReentrant` 修饰符，杜绝了重入攻击风险。
*   **状态机安全**：`VaultStatus` (Active, Inherited, Dissolved) 状态切换逻辑严密，`unlockVault` 和 `distributeInheritance` 均有严格的状态前置检查。

#### ⚖️ 逻辑完整性
*   **祭祀份额分配**：`distributeInheritance` 函数实现了先扣除祭祀份额（转入 `YIN_YANG_CONVERTER`）再按比例分配给受益人的逻辑，并处理了由于整数除法导致的精度余数问题。
*   **继承冷却期**：强制性的 30 天解锁冷却期 (`unlockingTimestamp`) 为潜在的争议解决提供了缓冲时间。

## 3. 风险评估与发现

| 风险等级 | 发现项 | 描述 | 状态 |
|---|---|---|---|
| **低** | 精度余数分配 | 在 `distributeInheritance` 中，精度损失导致的微量余额被分配给第一个受益人。 | **已知且可接受** |
| **低** | 继承条件单一 | 目前仅支持 `Time` 类型触发。 | **建议未来扩展** |
| **安全** | 权限集中 | 协议初期 `DEFAULT_ADMIN_ROLE` 权限较大。 | **已移交多签钱包** |

## 4. 审计结论

**审计结论：安全 (SECURE)**

经过深度审计，AMONEY 协议 v2.0 升级版合约在逻辑上是严密的，且针对之前发现的授权漏洞和重入风险进行了有效的修复。

**核心建议：**
1.  **多签治理**：目前所有关键权限已移交给多签钱包 `0x7d1B...f68B`，建议未来引入“时间锁 (Timelock)”合约，为重大升级提供公告期。
2.  **监控预警**：建议对 `VaultFeeBurned` 和 `InheritanceTriggered` 事件建立链上监控，以便实时掌握协议运行状况。

---
**Manus AI 审计团队**
*致力于构建安全、透明的数字文明底座*
