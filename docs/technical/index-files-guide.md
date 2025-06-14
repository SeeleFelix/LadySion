# 项目文件索引指南

## 🎯 概述

这份指南说明了Lady Sion项目中各种`index.ts`文件的作用和组织原则，帮助开发者理解项目的模块化结构。

## 📚 index文件的作用

### 1. 统一导出入口

`index.ts`文件作为模块的统一导出入口，简化导入语句：

```typescript
// ❌ 没有index文件时的导入
import { UserService } from "./services/user/UserService";
import { ProfileService } from "./services/user/ProfileService";
import { AuthService } from "./services/auth/AuthService";

// ✅ 有index文件时的导入
import { AuthService, ProfileService, UserService } from "./services";
```

### 2. 控制API表面

通过index文件控制模块对外暴露的接口：

```typescript
// services/index.ts
export { UserService } from "./user/UserService";
export { AuthService } from "./auth/AuthService";
// 不导出内部实现细节
// export { InternalHelper } from './internal/Helper' // 私有的
```

### 3. 重新导出和组织

可以重新组织和分组导出的内容：

```typescript
// types/index.ts
// 按功能分组导出
export type { User, UserProfile, UserSettings } from "./user";
export type { Chat, Conversation, Message } from "./chat";
export type { Character, CharacterProfile } from "./character";

// 导出常用类型组合
export type { ApiError, ApiResponse } from "./api";
```

## 🏗️ 项目中的index文件结构

### 前端index文件

#### `web/src/types/index.ts`

```typescript
// 类型定义统一导出
export type * from "./api";
export type * from "./character";
export type * from "./conversation";
export type * from "./ui";

// 导出常用类型工具
export type { BaseEntity, Timestamps } from "./common";
```

#### `web/src/components/index.ts`

```typescript
// 组件统一导出，支持自动导入
export { default as Button } from "./common/Button.vue";
export { default as Modal } from "./common/Modal.vue";
export { default as CharacterCard } from "./business/CharacterCard.vue";
export { default as MessageBubble } from "./business/MessageBubble.vue";

// 分组导出
export * as CommonComponents from "./common";
export * as BusinessComponents from "./business";
export * as LayoutComponents from "./layout";
```

#### `web/src/services/index.ts`

```typescript
// API服务统一导出
export { default as characterApi } from "./api/character";
export { default as conversationApi } from "./api/conversation";
export { default as presetApi } from "./api/preset";

// 存储服务
export { default as localStorage } from "./storage/localStorage";
export { default as sessionStorage } from "./storage/sessionStorage";

// 创建统一的API客户端
export { createApiClient } from "./api/client";
```

#### `web/src/stores/index.ts`

```typescript
// Pinia stores统一导出
export { useCharacterStore } from "./modules/character";
export { useConversationStore } from "./modules/conversation";
export { useUIStore } from "./modules/ui";
export { usePresetStore } from "./modules/preset";

// 导出store类型
export type * from "./types";
```

### 后端index文件

#### `server/src/domain/index.ts`

```typescript
// 领域层统一导出
export * from "./entities";
export * from "./valueobjects";
export * from "./services";
export * from "./repositories";

// 聚合根导出
export { Chat } from "./entities/Chat";
export { Character } from "./entities/Character";
export { Preset } from "./entities/Preset";
```

#### `server/src/application/index.ts`

```typescript
// 应用层统一导出
export * from "./usecases";
export * from "./services";
export * from "./dto";

// 用例导出
export { SendMessageUseCase } from "./usecases/SendMessageUseCase";
export { CreateCharacterUseCase } from "./usecases/CreateCharacterUseCase";
```

#### `server/src/infrastructure/index.ts`

```typescript
// 基础设施层导出
export * from "./repositories";
export * from "./adapters";
export * from "./config";

// 适配器导出
export { OpenRouterAdapter } from "./adapters/llm/OpenRouterAdapter";
export { SqliteRepository } from "./repositories/SqliteRepository";
```

#### `server/src/presentation/index.ts`

```typescript
// 表现层导出
export * from "./controllers";
export * from "./middleware";
export * from "./routes";

// 路由导出
export { createApiRouter } from "./routes/api";
export { createHealthRouter } from "./routes/health";
```

## 📋 最佳实践

### 1. 命名约定

```typescript
// ✅ 推荐的导出方式
export { UserService } from "./UserService";
export { default as UserService } from "./UserService";
export type { User } from "./User";

// ❌ 避免的方式
export * from "./UserService"; // 过于宽泛，可能导致命名冲突
```

### 2. 分层导出

```typescript
// services/api/index.ts - API层级导出
export { UserApi } from "./user";
export { ChatApi } from "./chat";

// services/index.ts - 服务层级导出
export * from "./api";
export * from "./storage";
export * from "./validation";
```

### 3. 类型和实现分离

```typescript
// types/index.ts - 只导出类型
export type { CreateUserRequest, User } from "./user";
export type { ApiResponse } from "./api";

// services/index.ts - 只导出实现
export { UserService } from "./user/UserService";
export { ApiClient } from "./api/ApiClient";
```

### 4. 条件导出

```typescript
// 根据环境条件导出
if (process.env.NODE_ENV === 'development') {
  export { MockService } from './mocks/MockService'
}

// 生产环境
export { ProductionService } from './ProductionService'
```

## 🔧 工具支持

### 自动导入配置

VSCode的自动导入可以很好地配合index文件：

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.includeCompletionsForModuleExports": true
}
```

### TypeScript配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components": ["src/components/index"],
      "@/services": ["src/services/index"],
      "@/types": ["src/types/index"]
    }
  }
}
```

### Vite别名配置

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/services": path.resolve(__dirname, "./src/services"),
    },
  },
});
```

## 🚨 注意事项

### 1. 避免循环依赖

```typescript
// ❌ 可能导致循环依赖
// services/user/index.ts
export { UserService } from "./UserService";

// services/user/UserService.ts
import { ChatService } from "../chat"; // 如果ChatService也依赖UserService则循环

// ✅ 通过依赖注入避免
// UserService只依赖接口，不直接导入其他服务
```

### 2. 保持index文件简洁

```typescript
// ✅ 简洁的index文件
export { UserService } from './UserService'
export { ProfileService } from './ProfileService'
export type { User } from './types'

// ❌ 过于复杂的index文件
export { UserService } from './UserService'
// 避免在index文件中放业务逻辑
const defaultConfig = { ... } // 这应该在单独的文件中
```

### 3. 版本兼容性

```typescript
// 为未来重构预留空间
export { UserService } from "./UserService";
export { UserService as UserServiceV1 } from "./UserService";

// 或者使用版本化的导出
export * as v1 from "./v1";
export * as v2 from "./v2";
```

## 📊 项目示例

### 完整的模块组织示例

```
src/
├── types/
│   ├── api.ts
│   ├── user.ts
│   ├── chat.ts
│   └── index.ts        # 导出所有类型
├── services/
│   ├── api/
│   │   ├── user.ts
│   │   ├── chat.ts
│   │   └── index.ts    # 导出API服务
│   ├── storage/
│   │   ├── local.ts
│   │   └── index.ts    # 导出存储服务
│   └── index.ts        # 导出所有服务
├── components/
│   ├── common/
│   │   ├── Button.vue
│   │   └── index.ts    # 导出通用组件
│   ├── business/
│   │   ├── UserCard.vue
│   │   └── index.ts    # 导出业务组件
│   └── index.ts        # 导出所有组件
└── main.ts             # 应用入口
```

这种组织方式使得导入变得非常清晰和一致，同时保持了良好的模块边界。
