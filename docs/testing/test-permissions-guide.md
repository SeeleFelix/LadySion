# 🔐 Lady Sion 测试权限指南

## 📋 概述

为了确保 AI 使用的安全性，本项目采用最小权限原则进行测试。不同类型的测试需要不同的权限配置。

## 🎯 权限分类

### 1. 核心单元测试（最安全）
```bash
# 仅核心框架测试，无外部依赖
deno task test:unit:core
# 等价于：deno test --allow-read whisper-framework/backend/__tests__/whisper-backend.test.ts whisper-framework/backend/__tests__/oak-integration.test.ts
```

**权限说明：**
- `--allow-read`: 仅读取测试文件和导入模块
- 无网络、环境变量、文件写入权限

**验证内容：**
- Whisper 框架核心逻辑（16个测试 ✅）
- SeekerRegistry 注册和方法调用
- RequestDispatcher 请求分发
- ResponseFormatter 响应格式化
- OakAdapter HTTP 适配器

**适用场景：**
- AI 使用的最安全测试
- 快速验证核心功能
- CI/CD 基础验证

### 2. 完整单元测试
```bash
# 包含需要环境变量的单元测试
deno task test:unit:full
# 等价于：deno test --allow-read --allow-env --ignore=whisper-framework/examples/,whisper-framework/backend/__tests__/usage-example.test.ts
```

**权限说明：**
- `--allow-read`: 读取测试文件和配置
- `--allow-env`: 读取环境变量（用于配置测试）
- 排除集成测试和复杂示例

**适用场景：**
- 业务需求验证测试
- Doctrine 配置系统测试
- 错误处理逻辑测试

### 3. 集成测试权限
```bash
# 需要启动 HTTP 服务器的集成测试
deno task test:integration
# 等价于：deno test --allow-read --allow-write --allow-net --allow-env whisper-framework/examples/integration-test/
```

**权限说明：**
- `--allow-read`: 读取配置和测试文件
- `--allow-write`: 写入临时测试数据
- `--allow-net`: 启动测试服务器，进行 HTTP 通信
- `--allow-env`: 读取测试环境变量

**适用场景：**
- 端到端 API 测试
- 前后端通信验证
- 真实 HTTP 服务器测试

### 4. 后端服务测试
```bash
# 后端业务逻辑和数据库相关测试
deno task test:backend
# 等价于：deno test --allow-read --allow-write --allow-net --allow-env server/
```

**权限说明：**
- `--allow-read`: 读取配置文件和数据文件
- `--allow-write`: 写入测试数据和日志
- `--allow-net`: 数据库连接和外部 API 调用
- `--allow-env`: 读取数据库配置和环境变量

### 5. Node-Flow 测试
```bash
# 工作流引擎测试，需要文件系统访问
deno task test:node-flow
# 等价于：deno test --allow-read --allow-write node-flow/
```

**权限说明：**
- `--allow-read`: 读取工作流配置文件
- `--allow-write`: 写入工作流执行结果和状态

### 6. Whisper 框架完整测试
```bash
# Whisper 框架的所有测试（包括集成测试）
deno task test:whisper
# 等价于：deno test --allow-read --allow-write --allow-net --allow-env whisper-framework/
```

## 📊 权限对比表

| 测试类型 | --allow-read | --allow-write | --allow-net | --allow-env | 测试数量 | 说明 |
|---------|-------------|---------------|-------------|-------------|----------|------|
| unit:core | ✅ | ❌ | ❌ | ❌ | 16个 ✅ | 最安全的核心测试 |
| unit:full | ✅ | ❌ | ❌ | ✅ | ~40个 | 包含配置测试 |
| integration | ✅ | ✅ | ✅ | ✅ | ~10个 | HTTP 服务器测试 |
| backend | ✅ | ✅ | ✅ | ✅ | 变动 | 数据库和 API 测试 |
| node-flow | ✅ | ✅ | ❌ | ❌ | 变动 | 文件系统工作流测试 |
| whisper | ✅ | ✅ | ✅ | ✅ | 全部 | 框架完整测试 |

## 🛡️ 安全考虑

### 权限最小化原则
1. **开发阶段**：使用具体的权限配置而非 `--allow-all`
2. **CI/CD 环境**：严格按照测试类型分配权限
3. **AI 使用场景**：优先使用单元测试，减少权限需求

### 权限验证
```bash
# 验证权限配置是否正确
deno info --json | jq '.permissions'
```

### 测试隔离
- 集成测试使用独立端口（8081）
- 测试数据与生产数据完全隔离
- 测试服务器自动清理资源

## 🚀 推荐使用方式

### 日常开发
```bash
# 最安全的快速验证（推荐）
deno task test:unit:core

# 包含配置的完整单元测试
deno task test:unit:full

# 验证集成功能
deno task test:integration
```

### 完整验证
```bash
# 运行所有测试
deno task test:all
```

### AI 使用场景
```bash
# 最安全的测试方式（强烈推荐）
deno task test:unit:core

# 需要配置测试时
deno task test:unit:full

# 需要集成验证时（谨慎使用）
deno task test:integration
```

## 🔍 权限问题诊断

### 常见错误
1. **PermissionDenied: Requires net access**
   - 解决：添加 `--allow-net` 权限
   - 使用：`deno task test:integration`

2. **PermissionDenied: Requires read access**
   - 解决：检查文件路径是否正确
   - 确保：包含 `--allow-read` 权限

3. **PermissionDenied: Requires write access**
   - 解决：添加 `--allow-write` 权限
   - 适用：需要写入测试数据的场景

### 调试技巧
```bash
# 查看具体权限需求
deno test --log-level=debug

# 临时允许所有权限进行调试（仅开发环境）
deno test --allow-all --dry-run
```

## 📚 相关文档
- [Deno 权限系统官方文档](https://deno.land/manual/getting_started/permissions)
- [Lady Sion 测试架构文档](./testing-architecture.md)
- [Whisper 框架安全指南](../technical/whisper-security.md)

---

通过遵循这些权限配置，确保 Lady Sion 项目在 AI 使用环境中的安全性和可控性。 