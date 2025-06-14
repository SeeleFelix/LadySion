# TypeScript Resource API (TRA) 配置管理指南

## 🎯 概述

TypeScript Resource API (TRA)
配置管理系统采用**Vite官方环境变量方案**，提供零依赖的类型安全配置管理。支持相对路径（代理模式）和完整URL（跨域模式），满足不同部署场景的需求。

## 🏗️ 核心概念

### 配置层级

TRA配置管理采用三层合并策略：

1. **默认配置** - 框架内置的合理默认值
2. **环境变量配置** - 通过Vite环境变量覆盖
3. **运行时配置** - 代码中显式传递的配置

### 路径模式

- **相对路径模式**（默认）: `/api/resources/User` - 适用于代理场景
- **完整URL模式**: `https://api.example.com/api/resources/User` - 适用于跨域场景

## ⚙️ 配置选项

### 基础配置接口

```typescript
export interface ResourceConfig {
  baseUrl?: string; // 基础URL，默认为空（相对路径）
  timeout?: number; // 请求超时时间，默认30秒
  headers?: Record<string, string>; // 默认请求头
  retries?: number; // 重试次数，默认3次
  retryDelay?: number; // 重试延迟，默认1000ms
  apiPaths?: Partial<ApiPaths>; // API路径配置
}

export interface ApiPaths {
  resources: string; // 资源API路径前缀，默认'/api/resources'
  realtime: string; // 实时API路径前缀，默认'/api/realtime'
}
```

### 默认配置

```typescript
const DEFAULT_CONFIG = {
  baseUrl: "", // 🎯 空字符串，使用相对路径
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  retries: 3,
  retryDelay: 1000,
  apiPaths: {
    resources: "/api/resources",
    realtime: "/api/realtime",
  },
};
```

## 🌍 环境变量配置

### 环境变量列表

在项目根目录创建`.env`文件，配置TRA环境变量：

```bash
# 基础配置
VITE_TRA_BASE_URL=                    # 基础URL（默认为空，相对路径）
VITE_TRA_TIMEOUT=30000                # 请求超时时间（毫秒）
VITE_TRA_RETRIES=3                    # 重试次数
VITE_TRA_RETRY_DELAY=1000             # 重试延迟（毫秒）

# 请求头配置
VITE_TRA_CONTENT_TYPE=application/json

# API路径配置
VITE_TRA_RESOURCES_PATH=/api/resources  # 资源API路径前缀
VITE_TRA_REALTIME_PATH=/api/realtime    # 实时API路径前缀
```

### 环境特定配置

```bash
# .env.development - 开发环境
VITE_TRA_BASE_URL=                    # 使用Vite代理
VITE_TRA_TIMEOUT=10000                # 开发环境更短超时

# .env.production - 生产环境  
VITE_TRA_BASE_URL=                    # 使用Nginx代理
VITE_TRA_TIMEOUT=30000                # 生产环境标准超时

# .env.staging - 测试环境
VITE_TRA_BASE_URL=https://api-staging.example.com  # 跨域到测试服务器
```

## 🚀 使用方式

### 默认配置使用

```typescript
import { createResourceProxy } from "@/typescript-resource-api";

// 使用默认配置 - 相对路径，由代理处理
const userResource = createResourceProxy<User>("User");

// 实际请求: /api/resources/User
const users = await userResource.findAll();
```

### 运行时配置覆盖

```typescript
import { createResourceProxy } from "@/typescript-resource-api";

// 跨域场景 - 配置完整URL
const apiResource = createResourceProxy<User>("User", {
  baseUrl: "https://api.example.com",
  timeout: 60000,
  headers: {
    "Authorization": "Bearer " + token,
  },
});

// 实际请求: https://api.example.com/api/resources/User
const users = await apiResource.findAll();
```

### 自定义API路径

```typescript
import { createResourceProxy } from "@/typescript-resource-api";

// 自定义API路径结构
const legacyResource = createResourceProxy<User>("User", {
  baseUrl: "https://legacy-api.example.com",
  apiPaths: {
    resources: "/v1/entities", // 自定义资源路径
    realtime: "/v1/websocket", // 自定义实时路径
  },
});

// 实际请求: https://legacy-api.example.com/v1/entities/User
const users = await legacyResource.findAll();
```

## 🔧 配置管理API

### 获取配置

```typescript
import { debugConfig, getRealtimeConfig, getResourceConfig } from "@/typescript-resource-api";

// 获取最终的资源配置（合并所有层级）
const config = getResourceConfig({
  baseUrl: "https://custom.api.com",
});

// 获取实时配置
const realtimeConfig = getRealtimeConfig({
  reconnect: true,
  reconnectDelay: 5000,
});

// 开发环境调试配置
debugConfig(); // 在控制台输出当前有效配置
```

### URL构建工具

```typescript
import {
  buildApiUrl, // 构建完整URL
  buildRealtimePath, // 构建实时相对路径
  buildRealtimeUrl, // 构建实时完整URL
  buildResourcePath, // 构建相对路径
} from "@/typescript-resource-api";

// 相对路径（供内部使用）
const path = buildResourcePath("User"); // '/api/resources/User'
const realtimePath = buildRealtimePath("User"); // '/api/realtime/User'

// 完整URL（供外部展示）
const fullUrl = buildApiUrl("User", { baseUrl: "https://api.com" });
// 'https://api.com/api/resources/User'
```

## 🌐 部署场景配置

### 开发环境 - Vite代理

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
```

```bash
# .env.development
VITE_TRA_BASE_URL=          # 空值，使用相对路径
```

### 生产环境 - Nginx代理

```nginx
# nginx.conf
location /api/ {
    proxy_pass http://backend-service:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

```bash
# .env.production  
VITE_TRA_BASE_URL=          # 空值，使用相对路径
```

### 跨域部署 - 直连API

```bash
# .env.production
VITE_TRA_BASE_URL=https://api.production.com
VITE_TRA_TIMEOUT=45000
```

## 🔄 实时配置扩展

### 实时配置接口

```typescript
export interface RealtimeConfig extends ResourceConfig {
  reconnect?: boolean; // 是否自动重连，默认true
  reconnectDelay?: number; // 重连延迟，默认3000ms
}
```

### 实时功能配置

```typescript
import { createRealtimeResourceProxy } from "@/typescript-resource-api";

// 实时资源配置
const chatResource = createRealtimeResourceProxy<ChatMessage>("Chat", {
  baseUrl: "wss://realtime.example.com", // WebSocket基础URL
  reconnect: true,
  reconnectDelay: 5000,
  apiPaths: {
    realtime: "/ws/events", // 自定义WebSocket路径
  },
});

// SSE连接: wss://realtime.example.com/ws/events/Chat
const unsubscribe = chatResource.subscribe((message) => {
  console.log("新消息:", message);
});
```

## 🛠️ 高级配置

### 类型安全的环境变量

```typescript
// env.d.ts
interface ImportMetaEnv {
  readonly VITE_TRA_BASE_URL?: string;
  readonly VITE_TRA_TIMEOUT?: string;
  readonly VITE_TRA_RETRIES?: string;
  readonly VITE_TRA_RETRY_DELAY?: string;
  readonly VITE_TRA_CONTENT_TYPE?: string;
  readonly VITE_TRA_RESOURCES_PATH?: string;
  readonly VITE_TRA_REALTIME_PATH?: string;
}
```

### 配置验证

```typescript
import { getResourceConfig } from "@/typescript-resource-api";

// 验证配置完整性
function validateConfig(): void {
  try {
    const config = getResourceConfig();
    console.log("✅ TRA配置验证通过:", config);
  } catch (error) {
    console.error("❌ TRA配置验证失败:", error.message);
    throw new Error("TRA配置无效，请检查环境变量");
  }
}

// 应用启动时验证
validateConfig();
```

## 🐛 常见问题

### Q: 为什么默认使用相对路径？

**A**: 符合前端最佳实践，开发和生产环境都可以使用代理，避免CORS问题，配置更简洁。

### Q: 什么时候使用完整URL？

**A**: 跨域调用第三方API、微服务直连、或无法配置代理的场景。

### Q: 如何调试配置问题？

**A**: 使用`debugConfig()`函数在开发环境输出完整配置信息。

### Q: 环境变量不生效？

**A**: 检查变量名前缀`VITE_`，确保在Vite构建时可访问`import.meta.env`。

## 📚 相关文档

- [TRA快速开始指南](../guides/tra-quick-start.md)
- [前端架构设计](../architecture/frontend.md)
- [API文档规范](../api/tra-api-spec.md)

---

**更新记录**:

- 2024-12-19: 创建文档，基于Vite官方配置方案
- 2024-12-19: 添加环境变量配置和部署场景说明
