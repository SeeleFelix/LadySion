# 🤖 Whisper Framework AI开发指导文档

> 此文档专门为AI助手编写，帮助理解和维护Whisper Framework

## 🎯 核心设计理念

### 📋 **约定大于配置**
- 框架提供智能默认值，支持零配置启动
- 项目级配置通过约定路径自动发现
- 所有默认行为都可以通过配置覆盖

### 🔮 **神性命名体系**
```typescript
// 核心概念映射
Seeker      = API客户端接口（前端调用者）
Whisper     = API请求过程
Spell       = 请求参数 { args: [...] }
Eidolon     = 业务实体/数据模型
Grace       = API响应数据
Omen        = 响应状态码/信息
Doctrine    = 框架配置
Scripture   = 业务定义包

// 异常类型
OmenError   = 业务异常（可处理：404用户不存在、401权限不足）
WrathError  = 系统异常（不可处理：网络错误、HTTP 5xx、配置错误）
```

### 🌐 **Whisper协议**
```
URL模式: POST /whisper/{eidolon}/{ritual}
请求体:   { "spell": { "args": [...] } }
响应体:   { "eidolon": T, "omen": { code, status, message }, "timestamp": number }
```

## 🏗️ 架构原则

### 📦 **分层架构**
```
whisper-framework/     # 框架层：纯净、通用、零业务逻辑
shared/scripture/      # 业务层：定义Eidolon和Seeker，创建实例
web/src/components/    # 应用层：直接使用，超级干净
```

### 🎭 **动态方法生成**
- 使用Proxy动态生成Seeker方法实现
- 支持任意参数数量和类型
- 运行时类型安全通过TypeScript接口保证

### ⚡ **错误处理分层**
```typescript
// HTTP 200 + omen.code === 200 → 成功
// HTTP 200 + omen.code !== 200 → OmenError（业务异常）
// HTTP !== 200 或网络错误 → WrathError（系统异常）
```

## 🔧 Doctrine配置系统

### 📋 **配置优先级**
```
运行时覆盖 > 环境变量 > 项目配置 > 框架默认
```

### 🎯 **配置文件约定**
框架按顺序查找项目配置：
1. `./whisper.config.json`
2. `./whisper.config.js`
3. `./config/whisper.json`
4. `./.whisperrc.json`

### 🔐 **智能Header处理**
```typescript
// 自动处理认证
auth: {
  type: "bearer",           // 自动添加 Authorization: Bearer <token>
  token: "your-token"
}

// 自动处理环境标识
environment: "production"   // 自动添加 X-Environment: production

// 自动处理请求追踪
enableMetrics: true        // 自动添加 X-Request-ID: uuid
```

### 🌍 **环境变量支持**
```bash
WHISPER_BASE_URL=https://api.prod.com
WHISPER_TIMEOUT=60000
WHISPER_DEBUG=true
WHISPER_AUTH_TOKEN=bearer-token
```

## 🧪 测试策略

### 📊 **测试覆盖**
- **业务需求测试**: 验证API调用体验和功能完整性
- **配置管理测试**: 验证配置读取、合并、验证逻辑
- **错误处理测试**: 验证OmenError和WrathError分类正确

### 🎭 **Mock策略**
```typescript
// 标准Mock模式
function setupFetchMock() {
  globalThis.fetch = ((...args: any[]) => {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });
  }) as any;
}
```

## 🚀 开发工作流

### 🔍 **添加新功能时**
1. **更新类型定义** `types/core.ts`
2. **实现核心逻辑** `core/seeker.ts` 或 `core/doctrine.ts`
3. **编写测试用例** 覆盖业务需求和边界情况
4. **更新文档** `README.md` 和使用示例

### 🐛 **修复Bug时**
1. **确定异常类型**: OmenError（业务）vs WrathError（系统）
2. **编写失败测试** 重现问题
3. **修复实现** 最小化修改
4. **验证测试通过** 确保无回归

### 📋 **配置变更时**
1. **更新Doctrine接口** 添加新配置选项
2. **更新默认配置** `config/doctrine.json`
3. **更新配置处理逻辑** `core/doctrine.ts`
4. **编写配置测试** 验证读取和合并逻辑

## 🎯 编码指南

### ✅ **DO - 推荐做法**
```typescript
// ✅ 使用神性命名
interface UserSeeker extends Seeker<UserEidolon>

// ✅ 配置错误抛出WrathError
if (!config.baseUrl) {
  throw new WrathError('baseUrl is required', { ... });
}

// ✅ 保持API调用简洁
const user = await userSeeker.findById("123");

// ✅ 业务异常处理
try {
  const user = await userSeeker.findById("123");
} catch (error) {
  if (error instanceof OmenError && error.omen.code === 404) {
    // 处理用户不存在
  }
}
```

### ❌ **DON'T - 避免做法**
```typescript
// ❌ 不要混用传统HTTP术语
interface UserClient  // 应该是 UserSeeker
interface ApiResponse  // 应该是 Grace

// ❌ 不要在框架层硬编码业务逻辑
if (eidolonName === 'User') { ... }  // 框架应该通用

// ❌ 不要混淆异常类型
throw new OmenError('Network timeout');  // 应该是 WrathError

// ❌ 不要破坏API简洁性
const user = await userSeeker.makeRequest('findById', ["123"]);  // 太复杂
```

### 🔧 **重构指南**
```typescript
// 重构前：复杂的HTTP调用
const response = await fetch('/api/users/123', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});
const user = await response.json();

// 重构后：简洁的Whisper调用
const user = await userSeeker.findById("123");
```

## 📚 常见场景处理

### 🔐 **认证配置**
```typescript
// Bearer Token
export const userSeeker = createSeeker<UserSeeker>("User", {
  auth: { type: "bearer", token: "your-token" }
});

// Basic Auth
export const adminSeeker = createSeeker<AdminSeeker>("Admin", {
  auth: { type: "basic", username: "admin", password: "secret" }
});

// Custom Headers
export const apiSeeker = createSeeker<ApiSeeker>("Api", {
  auth: { type: "custom", custom: { "X-API-Key": "key123" } }
});
```

### 🌍 **环境配置**
```json
// whisper.config.json
{
  "baseUrl": "https://api.yourcompany.com",
  "timeout": 60000,
  "debug": false,
  "auth": {
    "type": "bearer",
    "token": "${AUTH_TOKEN}"  // 支持环境变量模板
  },
  "headers": {
    "X-API-Version": "v1",
    "X-Client": "web-app"
  }
}
```

### 🎭 **调试配置**
```typescript
export const debugSeeker = createSeeker<DebugSeeker>("Debug", {
  debug: true,
  logger: (message, data) => console.log(`🔍 ${message}`, data),
  enableMetrics: true
});
```

## 🚨 故障排查

### 🔍 **常见问题**
1. **配置不生效**: 检查配置文件路径和JSON格式
2. **认证失败**: 验证auth配置和环境变量
3. **类型错误**: 确保Seeker接口正确扩展
4. **网络超时**: 调整timeout配置

### 📋 **调试步骤**
1. 启用debug模式查看实际HTTP请求
2. 检查配置合并结果
3. 验证Whisper协议格式
4. 确认异常类型分类

## 🎯 版本兼容性

### 📋 **升级指南**
- 配置格式向后兼容
- API接口保持稳定
- 新功能通过可选配置添加
- 废弃功能提供迁移路径

### 🔧 **迁移策略**
```typescript
// v1.x → v2.x 示例
// 旧版本
const seeker = createSeeker("User", { baseUrl: "..." });

// 新版本（兼容）
const seeker = createSeeker<UserSeeker>("User", { baseUrl: "..." });
```

---

## 🎉 总结

Whisper Framework的核心价值在于**极简API + 强大配置**：
- 前端调用像本地函数一样简单
- 配置系统智能且灵活
- 错误处理清晰分层
- 对业务代码零侵入

在维护和扩展时，始终坚持这些原则，保持框架的简洁性和强大性。 