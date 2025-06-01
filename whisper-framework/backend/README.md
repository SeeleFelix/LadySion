# 🌟 Whisper Framework Backend

让后端 API 实现变得**超级干净**的框架 - **彻底干掉 Controller 层！**

## ✨ 核心理念

就像前端干掉了 HTTP 细节一样，后端也要干掉 Controller！

```typescript
// ❌ 传统方式：写一堆 Controller
class UserController {
  async findById(ctx: Context) {
    const id = ctx.params.id;
    const user = await this.userService.findById(id);
    ctx.response.body = { success: true, data: user };
  }
}

// ✅ Whisper 方式：直接实现业务接口
class UserSeekerService implements UserSeeker {
  async findById(id: string): Promise<UserEidolon> {
    return await this.userRepository.findById(id);
  }
}
// 框架自动处理所有 HTTP 细节！
```

## 🎯 设计目标

- **🔮 完美对称**：前后端使用相同的 Seeker 接口定义
- **🌟 框架无关**：支持 Oak、Fresh 等任何 HTTP 框架
- **⚡ 零配置**：一行代码完成所有路由设置
- **🎭 自动发现**：自动识别 Seeker 方法并生成路由
- **🚨 统一错误处理**：自动转换异常为 Grace 响应格式

## 🚀 快速开始

### 1. 定义 Seeker 接口（与前端共享）

```typescript
// shared/seeker.ts
interface UserSeeker extends Seeker<UserEidolon> {
  findById(id: string): Promise<UserEidolon>;
  create(name: string, email: string, age: number): Promise<UserEidolon>;
  search(query: string, filters: any, pagination: any): Promise<UserEidolon[]>;
}
```

### 2. 实现 Seeker 服务

```typescript
// 纯业务逻辑，完全无 HTTP 概念！
class UserSeekerService implements UserSeeker, SeekerImplementation {
  async findById(id: string): Promise<UserEidolon> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new OmenError("用户不存在", {
        code: 404,
        status: "error", 
        message: `用户 ${id} 不存在`,
        signal: "user_not_found"
      });
    }
    return user;
  }

  async create(name: string, email: string, age: number): Promise<UserEidolon> {
    // 业务验证
    if (age < 0) throw new OmenError("年龄无效", { /* ... */ });
    
    // 业务逻辑
    return await this.userRepo.create({ name, email, age });
  }
}
```

### 3. 一行代码完成集成

```typescript
import { setupWhisperRoutes } from "@whisper/backend";

// 🔮 一行代码干掉所有 Controller！
setupWhisperRoutes(router, {
  "User": new UserSeekerService(),
  "Product": new ProductSeekerService(),
});

// 自动生成：
// POST /api/whisper/User/findById
// POST /api/whisper/User/create
// POST /api/whisper/Product/findAll
// ...
```

## 🏗️ 架构概览

```
Frontend                     Backend
┌─────────────────────┐     ┌─────────────────────┐
│ userSeeker.findById │────▶│ UserSeekerService   │
│ (Proxy生成)         │     │ .findById()         │
└─────────────────────┘     └─────────────────────┘
          │                           ▲
          │ HTTP POST                  │ 自动调用
          ▼                           │
┌─────────────────────┐     ┌─────────────────────┐
│ /whisper/User/      │────▶│ RequestDispatcher   │
│ findById            │     │ (反射调用)          │
└─────────────────────┘     └─────────────────────┘
```

## 🌐 Whisper 协议

所有 API 遵循统一协议：

### 请求格式
```bash
POST /api/whisper/{eidolon}/{ritual}
Content-Type: application/json

{
  "spell": {
    "args": ["参数1", "参数2", { "复杂": "对象" }]
  }
}
```

### 响应格式
```json
{
  "eidolon": { "返回的业务数据" },
  "omen": {
    "code": 200,
    "status": "success", 
    "message": "操作成功",
    "signal": "success"
  },
  "timestamp": 1703123456789
}
```

## 🎭 错误处理

框架自动区分业务错误和系统错误：

```typescript
// ✅ 业务错误 - 前端可以处理
throw new OmenError("用户不存在", {
  code: 404,
  status: "error",
  message: "用户不存在", 
  signal: "user_not_found"
});

// ✅ 系统错误 - 框架自动处理
throw new WrathError("数据库连接失败", { /* ... */ });

// ✅ 普通异常 - 自动转换为 500 错误
throw new Error("意外错误");
```

## 🔧 框架适配

支持多种 HTTP 框架：

### Oak 框架
```typescript
import { setupWhisperRoutes } from "@whisper/backend";

setupWhisperRoutes(oakRouter, seekers);
```

### Fresh 框架
```typescript
import { FreshAdapter } from "@whisper/backend";

// 自定义适配器集成
const adapter = new FreshAdapter();
// ...
```

### 自定义框架
```typescript
// 实现 HttpAdapter 接口即可
class MyFrameworkAdapter implements HttpAdapter {
  name = "my-framework";
  
  async mount(server: any, config: WhisperServerConfig) {
    // 实现框架特定的挂载逻辑
  }
  
  createRouteHandler(handler: RouteHandler) {
    // 实现框架特定的处理器转换
  }
}
```

## 📊 高级功能

### 自动 API 文档生成
```typescript
const server = createWhisperServer();
const docs = server.generateApiDocs(); // OpenAPI 格式
```

### 请求度量和监控  
```typescript
const stats = server.getStatus();
console.log(`处理了 ${stats.requestCount} 个请求`);
```

### 认证和权限
```typescript
setupWhisperRoutes(router, seekers, {
  auth: {
    enabled: true,
    verify: async (token) => await validateJWT(token)
  }
});
```

### 环境配置
```typescript
// whisper.config.json
{
  "baseUrl": "http://localhost:8000",
  "whisperPath": "/api/whisper",
  "auth": {
    "type": "bearer",
    "token": "${AUTH_TOKEN}"
  },
  "debug": true
}
```

## 🎯 最佳实践

### 1. Seeker 实现原则
- **单一职责**：每个 Seeker 只处理一类业务
- **纯业务逻辑**：不包含任何 HTTP 相关代码
- **异常处理**：使用 OmenError 表示业务异常

### 2. 项目结构
```
src/
├── seekers/           # Seeker 实现
│   ├── UserSeeker.ts
│   └── ProductSeeker.ts
├── shared/            # 与前端共享的接口
│   └── contracts.ts
└── main.ts           # 应用入口
```

### 3. 错误处理策略
```typescript
// ✅ 正确：明确的业务异常
if (!user) {
  throw new OmenError("用户不存在", {
    code: 404,
    status: "error",
    message: "指定的用户不存在",
    signal: "user_not_found"
  });
}

// ❌ 错误：直接返回错误对象
return { error: "用户不存在" };
```

## 🧪 测试

```typescript
// 测试 Seeker 实现（无需 HTTP）
const userSeeker = new UserSeekerService();
const user = await userSeeker.findById("1");
assertEquals(user.username, "test");

// 测试异常处理
await assertRejects(
  () => userSeeker.findById("999"),
  OmenError,
  "用户不存在"
);
```

## 📚 示例项目

查看 `examples/usage.ts` 获取完整的使用示例，包括：
- 用户管理 API
- 产品管理 API  
- 复杂参数处理
- 错误处理示例

## 🔄 迁移指南

### 从传统 Controller 迁移

```typescript
// 迁移前：Controller + Service 模式
class UserController {
  constructor(private userService: UserService) {}
  
  async findById(ctx: Context) {
    try {
      const id = ctx.params.id;
      const user = await this.userService.findById(id);
      ctx.response.body = { success: true, data: user };
    } catch (error) {
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: error.message };
    }
  }
}

// 迁移后：直接实现 Seeker
class UserSeekerService implements UserSeeker {
  async findById(id: string): Promise<UserEidolon> {
    // 直接返回业务数据，框架处理所有 HTTP 细节
    return await this.userRepository.findById(id);
  }
}
```

## 🤝 贡献

欢迎提交 Issue 和 PR！特别欢迎：
- 新的框架适配器
- 性能优化
- 文档改进
- 使用案例

## 📄 许可证

MIT License

---

## 💡 设计哲学

> **前端干掉 HTTP，后端干掉 Controller**
> 
> 让开发者专注于业务逻辑，让框架处理所有技术细节。
> 
> 这就是 Whisper 的核心价值 - **极简 API + 强大框架**。

**🎉 开始使用 Whisper，体验前后端完美对称的开发乐趣！** 