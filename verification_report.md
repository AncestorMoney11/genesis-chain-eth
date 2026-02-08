# AMONEY数字文明创世协议合约验证报告

## 1. 概述

本报告旨在总结对AMONEY数字文明创世协议（Genesis Chain ETH）中七个核心合约代码的集成与验证工作。验证过程包括确保合约代码能够正确编译、合约之间能够正确交互，并通过全面的功能测试。

## 2. 合约列表

本次验证涉及以下七个合约：

1.  `AncestorMoney.sol`
2.  `EvolutionReserve.sol`
3.  `ISacredVault.sol`
4.  `SacredVault.sol`
5.  `VaultFactory.sol`
6.  `IAMONEY.sol`
7.  `Vaults.test.js` (测试文件)
8.  `GenesisChain.test.js` (测试文件)

## 3. 验证过程与问题解决

在集成和验证过程中，我们遵循了以下步骤并解决了遇到的主要问题：

### 3.1. 项目初始化与依赖安装

按照提供的环境配置与部署命令，我们初始化了项目并安装了所有必要的依赖，包括`hardhat`、`@nomicfoundation/hardhat-toolbox`和`@openzeppelin/contracts`。

### 3.2. 合约代码整合与初步编译

我们将所有合约代码复制到`contracts`目录，并尝试进行初步编译。在此阶段，我们遇到了以下主要问题：

*   **重复的结构体定义**：`SacredVault.sol`中存在重复的`InheritanceCondition`结构体定义。通过引入`ISacredVault.sol`接口文件，将共享的结构体和枚举类型统一管理，解决了此问题。
*   **Solidity版本不兼容**：部分合约使用了不同的`pragma solidity`版本。我们将所有合约的`pragma solidity`版本统一更新到`^0.8.22`，并在`hardhat.config.js`中设置了默认编译器版本。
*   **结构体引用问题**：在`SacredVault.sol`和`VaultFactory.sol`中，对`InheritanceCondition`和`ConditionType`的引用需要通过`ISacredVault`进行限定。我们对相关引用进行了修正，例如将`InheritanceCondition`改为`ISacredVault.InheritanceCondition`。

### 3.3. 可升级性合约的调整

由于项目使用了OpenZeppelin的可升级合约模式，我们对合约进行了以下调整：

*   **`VaultFactory`构造函数转换为初始化函数**：`VaultFactory.sol`的构造函数被转换为`initialize`函数，以适应可升级合约的部署模式。同时，移除了构造函数中直接部署`SacredVault`的逻辑，改为通过`setVaultImplementation`函数设置实现合约地址。
*   **`AncestorMoney`初始化函数顺序**：`AncestorMoney.sol`的`initialize`函数中，父合约初始化函数的调用顺序需要严格遵循线性继承顺序。我们根据编译器的警告信息，多次调整了`__Ownable2Step_init`、`__ERC20Upgradeable_init`和`__PausableUpgradeable_init`的调用顺序，最终解决了初始化顺序错误。
*   **`IAMONEY`接口定义**：创建了`IAMONEY.sol`接口，用于定义`payVaultFee`函数并继承`IERC20Upgradeable`，确保`SacredVault`可以正确调用`AncestorMoney`的代币支付功能。

### 3.4. 测试脚本的编写与调试

我们编写了`GenesisChain.test.js`和`Vaults.test.js`两个测试文件，覆盖了AMONEY代币、神圣遗产保险库、可升级工厂、进化储备合约和通缩机制等核心功能。在测试过程中，我们解决了以下问题：

*   **`parseUnits`用法错误**：在测试脚本中，`ethers.parseUnits`的用法不正确，导致代币数量计算错误。我们修正了`parseUnits`的参数，确保其与`AncestorMoney`的9位小数精度匹配。
*   **`Only owner can pay`错误**：在`GenesisChain.test.js`的`应该支付保险库维护费`测试中，由于`SacredVault`的`CREATOR_ROLE`没有正确授予给创建者，导致`payMaintenanceFee`函数调用失败。我们修改了`SacredVault.sol`，确保在`createSacredVault`函数中将`_creator`授予`CREATOR_ROLE`。
*   **`Inheritance condition not met`错误**：在`Vaults.test.js`的继承测试中，由于条件索引错误以及`condition`变量未定义，导致继承条件不满足。我们修正了条件索引为0，并确保`condition`变量在作用域内可访问。
*   **`VaultCreated`事件捕获**：在`GenesisChain.test.js`中，为了获取新创建的保险库ID，我们修改了测试逻辑，通过解析`createSacredVault`交易的事件日志来获取`vaultId`。
*   **`VaultFeeBurned`事件**：在`IAMONEY.sol`和`AncestorMoney.sol`中添加了`VaultFeeBurned`事件，并在`payVaultFee`函数中触发，以便测试可以监听该事件。

## 4. 结论

经过上述集成、调试和测试，AMONEY数字文明创世协议的所有核心合约代码已成功编译并通过了功能测试。所有已知的编译错误、逻辑错误和测试失败问题均已解决。合约代码已适配合约可升级性标准，并遵循了OpenZeppelin的最佳实践。

## 5. 附件

以下是经过验证的最终合约代码文件：

*   `contracts/AncestorMoney.sol`
*   `contracts/EvolutionReserve.sol`
*   `contracts/IAMONEY.sol`
*   `contracts/ISacredVault.sol`
*   `contracts/SacredVault.sol`
*   `contracts/VaultFactory.sol`
*   `test/AncestorMoney.test.js`
*   `test/GenesisChain.test.js`
*   `test/Vaults.test.js`
*   `hardhat.config.js`
*   `scripts/deploy-genesis-chain.js`

**Manus AI**

2026年2月8日
