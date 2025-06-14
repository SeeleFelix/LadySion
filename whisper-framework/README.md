# 🌟 Whisper Framework

神性命名体系的TypeScript API框架，让前端API调用变得**超级干净**。

## ✨ 核心特性

- **🔮 简洁调用**：`userSeeker.create("name", "email", 25)` 像普通函数一样
- **🎭 TypeScript类型安全**：编译时检查，只能调用定义的方法
- **🌟 多参数支持**：支持任意数量参数，包括对象参数
- **⚡ 统一错误处理**：Grace → WhisperError 自动转换
- **🔧 环境配置管理**：开发/生产环境自动切换
- **📦 Scripture模式**：所有复杂配置在scripture包中完成
- **🌐 Whisper协议**：统一的 `POST /whisper/{eidolon}/{ritual}` 格式

## 🚀 快速开始

### 1. 定义业务类型（在scripture包中）

```typescript
// eidolons/user.ts
interface UserEidolon {
  id?: string;
  username: string;
  email: string;
  age: number;
}

// seekers/userSeeker.ts
interface UserSeeker extends Seeker<UserEidolon> {
  findById(id: string): Promise<UserEidolon>;
  create(username: string, email: string, age: number): Promise<UserEidolon>;
  search(query: string, filters: object, pagination: object): Promise<UserEidolon[]>;
}
```

### 2. 创建seeker实例（在scripture/index.ts中）

```typescript
import { createSeeker } from "@/whisper-framework";

// 🔮 所有脏活都在这里：配置、环境、认证等
const config = {
  baseUrl: "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer token",
  },
};

// ✨ 创建clean的seeker实例
export const userSeeker = createSeeker<UserSeeker>("User", config);
```

### 3. 前端使用（超级干净）

```typescript
import { userSeeker } from "@/scripture";

// 🎯 直接调用，支持多参数
const user = await userSeeker.findById("123");
const newUser = await userSeeker.create("玲珑", "test@example.com", 25);
const results = await userSeeker.search("关键词", { age: 25 }, { page: 0, size: 10 });
```

## 🏗️ 架构概览

```
whisper-framework/           # 框架核心
├── types/core.ts           # 核心类型定义
├── core/seeker.ts          # createSeeker实现
├── core/config.ts          # 配置管理
└── index.ts               # 框架导出

shared/scripture/           # 业务定义包（做脏活）
├── eidolons/              # 业务实体定义
├── seekers/               # 业务接口定义
└── index.ts              # 创建实例并导出

web/src/components/         # 前端代码（干净）
└── UserComponent.vue      # import { userSeeker } from '@/scripture'
```

## 🔮 Whisper协议

所有API调用都遵循统一协议：

- **URL格式**：`POST /whisper/{eidolon}/{ritual}`
- **请求体**：`{ spell: { args: [...] } }`
- **响应格式**：`{ eidolon: T, omen: { code, status, message }, timestamp }`

### 调用示例

```typescript
// 前端调用
await userSeeker.create("玲珑", "test@example.com", 25);

// 实际发送
POST /whisper/User/create
{
  "spell": {
    "args": ["玲珑", "test@example.com", 25]
  }
}

// 响应格式
{
  "eidolon": { "id": "123", "name": "玲珑", "email": "test@example.com", "age": 25 },
  "omen": { "code": 201, "status": "success", "message": "创建成功" },
  "timestamp": 1703123456789
}
```

## 🧪 测试

```bash
cd whisper-framework
deno test --allow-all
```

## 📖 示例

查看 `examples/usage.ts` 了解完整用法示例。

## 🎯 神性命名体系

- **Seeker（祈祷者）**：前端调用者
- **Whisper（低语祷告）**：请求过程
- **Spell（法术）**：请求参数
- **Eidolon（映灵）**：业务实体
- **Scripture（圣典）**：业务定义包
- **Grace（神恩）**：响应数据
- **Omen（神启）**：状态码
- **Wrath（神怒）**：错误异常
