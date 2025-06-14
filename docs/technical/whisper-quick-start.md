# 🚀 Whisper框架快速上手指南

> **一句话概述**: 让前端调用API像调用函数一样简单，后端实现API像实现接口一样纯净

## 🎯 核心概念 (3分钟理解)

### 神性命名体系

```typescript
Seeker      = API客户端接口（前端调用者）
Eidolon     = 业务实体/数据模型
Whisper     = API请求过程
Spell       = 请求参数 { args: [...] }
Grace       = API响应数据
Omen        = 响应状态码
Scripture   = 业务定义包（配置中心）
```

### 核心协议

- **URL模式**: `POST /whisper/{eidolon}/{ritual}`
- **请求体**: `{ "spell": { "args": [...] } }`
- **响应体**: `{ "eidolon": T, "omen": { code, status, message }, "timestamp": number }`

## 🚀 30秒快速开始

### 1. 定义业务接口（共享）

```typescript
// shared/types/user.ts
interface UserEidolon {
  id?: string;
  name: string;
  email: string;
  age: number;
}

// shared/contracts/userSeeker.ts
interface UserSeeker extends Seeker<UserEidolon> {
  create(name: string, email: string, age: number): Promise<UserEidolon>;
  findById(id: string): Promise<UserEidolon>;
  search(keyword: string, filters: any): Promise<UserEidolon[]>;
}
```

### 2. 创建Seeker实例（Scripture配置包）

```typescript
// shared/scripture/index.ts
import { createSeeker } from "@/whisper-framework";

export const userSeeker = createSeeker<UserSeeker>("User", {
  baseUrl: "http://localhost:8000",
  headers: { "Authorization": "Bearer token" },
});
```

### 3. 前端使用（超干净）

```typescript
// web/src/components/UserList.vue
import { userSeeker } from "@/scripture";

// 🎯 像调用普通函数一样
const user = await userSeeker.create("茜", "test@example.com", 25);
const foundUser = await userSeeker.findById("123");
const results = await userSeeker.search("关键词", { age: 25 });
```

### 4. 后端实现（无Controller）

```typescript
// server/services/UserSeekerService.ts
export class UserSeekerService implements UserSeeker {
  // 🔮 纯业务逻辑，零HTTP概念
  async create(name: string, email: string, age: number): Promise<UserEidolon> {
    return await this.userRepo.save({ name, email, age });
  }

  async findById(id: string): Promise<UserEidolon> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new OmenError("用户不存在", { code: 404 });
    return user;
  }

  async search(keyword: string, filters: any): Promise<UserEidolon[]> {
    return await this.userRepo.search(keyword, filters);
  }
}

// server/main.ts - 启动服务器
import { setupWhisperRoutes } from "@/whisper-framework/backend";

const userService = new UserSeekerService();
setupWhisperRoutes(router, { User: userService });
```

## ⚡ 关键特性

### 🔮 多参数支持

```typescript
// ✅ 支持任意参数组合
await userSeeker.create("name", "email", 25);
await userSeeker.search("keyword", { age: 25 }, { page: 1, size: 10 });
await userSeeker.updateProfile(id, { name: "new", settings: {...} });
```

### 🎭 TypeScript类型安全

```typescript
// ✅ 编译时检查，只能调用已定义的方法
userSeeker.create("name", "email", 25); // ✅ 正确
userSeeker.delete("id"); // ❌ 编译错误：方法不存在
```

### 🚨 统一错误处理

```typescript
// ✅ 业务错误处理
try {
  const user = await userSeeker.findById("non-exist");
} catch (error) {
  if (error instanceof OmenError) {
    // 业务异常：404 用户不存在
    console.log(error.omen.code); // 404
  }
}

// ✅ 系统错误自动处理
// 网络错误、超时等会抛出WrathError
```

## 🏗️ 项目结构

```
project/
├── shared/scripture/          # 🔮 配置中心（做脏活）
│   ├── index.ts              # 创建并导出seeker实例
│   └── config/               # 环境配置、认证等
├── shared/contracts/          # 📋 业务接口定义
│   └── userSeeker.ts         # 前后端共享接口
├── shared/types/             # 📊 业务实体定义
│   └── user.ts              # Eidolon定义
├── web/src/components/       # 🎯 前端使用（超干净）
│   └── UserList.vue         # import { userSeeker } from '@/scripture'
└── server/services/          # ⚙️ 后端实现（无Controller）
    └── UserSeekerService.ts  # 实现业务接口
```

## 🔧 配置管理

### 环境配置

```typescript
// 开发环境 whisper.config.json
{
  "baseUrl": "http://localhost:8000",
  "timeout": 30000,
  "debug": true
}

// 生产环境通过环境变量覆盖
WHISPER_BASE_URL=https://api.prod.com
WHISPER_TIMEOUT=60000
```

### 认证配置

```typescript
// scripture/config/auth.ts
export const authConfig = {
  headers: {
    "Authorization": `Bearer ${getToken()}`,
    "X-API-Key": process.env.API_KEY,
  },
};

// scripture/index.ts
export const userSeeker = createSeeker<UserSeeker>("User", {
  ...baseConfig,
  ...authConfig,
});
```

## 🧪 测试

### 前端测试

```typescript
// 测试seeker调用
const mockUserSeeker = {
  create: vi.fn().mockResolvedValue({ id: "123", name: "test" }),
  findById: vi.fn().mockResolvedValue({ id: "123", name: "test" }),
};

// 测试组件
const result = await mockUserSeeker.create("name", "email", 25);
```

### 后端测试

```typescript
// 测试service实现
const userService = new UserSeekerService();
const user = await userService.create("name", "email", 25);
expect(user.name).toBe("name");
```

### 集成测试

```bash
cd whisper-framework
deno test --allow-all  # 运行完整端到端测试
```

## 📚 进阶使用

### 复杂参数处理

```typescript
interface ComplexSeeker extends Seeker<any> {
  // 对象参数
  createWithProfile(user: UserProfile, settings: UserSettings): Promise<User>;

  // 数组参数
  batchCreate(users: UserData[]): Promise<User[]>;

  // 混合参数
  search(query: string, filters: SearchFilters, pagination: Pagination): Promise<SearchResult>;
}
```

### 错误码约定

```typescript
// 业务错误码
200: 成功
404: 资源不存在  
401: 权限不足
422: 参数验证失败

// 系统错误码（自动处理）
500: 服务器内部错误
503: 服务不可用
408: 请求超时
```

### 性能优化

```typescript
// 批量操作
const users = await userSeeker.batchCreate([...userList]);

// 分页查询
const result = await userSeeker.search("keyword", filters, { page: 1, size: 20 });

// 缓存策略（在service层实现）
class UserSeekerService implements UserSeeker {
  @Cache(300) // 5分钟缓存
  async findById(id: string): Promise<UserEidolon> {
    // 实现逻辑
  }
}
```

## 🎯 最佳实践

### ✅ 推荐做法

- 在Scripture包中集中管理所有配置
- 保持Seeker接口简洁，一个方法一个职责
- 使用TypeScript严格类型检查
- 业务异常使用OmenError，系统异常使用WrathError
- Service层实现纯业务逻辑，零HTTP概念

### ❌ 避免的做法

- 不要在前端组件中硬编码API配置
- 不要在Service中处理HTTP状态码
- 不要绕过Whisper协议直接发送HTTP请求
- 不要在Seeker接口中包含框架特定的类型

## 🔗 相关文档

- [详细架构设计](../architecture/whisper-framework-architecture.md)
- [后端开发指南](./whisper-backend-guide.md)
- [错误处理指南](./whisper-error-handling.md)
- [配置管理指南](./whisper-configuration-guide.md)

---

> 💡 **记住**: Whisper让前端调用变得像函数一样简单，后端实现变得像接口一样纯净！
