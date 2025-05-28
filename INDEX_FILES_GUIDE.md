# Index文件使用指南

本文档规范了项目中index文件（barrel文件）的使用标准，以确保代码的可维护性和性能。

## 📋 什么是Barrel文件？

Barrel文件是一种重新导出其他模块的文件，通常命名为`index.ts`或`index.js`。它们用作模块的统一入口点。

## ✅ 何时使用Index文件

### 1. 应用程序入口点
```typescript
// ✅ 必要 - 应用主入口
server/src/index.ts
client/src/main.ts
```

### 2. 路由配置
```typescript
// ✅ 必要 - Vue Router配置
client/src/router/index.ts
```

### 3. 类型定义集合
```typescript
// ✅ 推荐 - 类型统一导出
client/src/types/index.ts
```

### 4. 核心服务配置
```typescript
// ✅ 推荐 - 包含配置逻辑的服务
client/src/services/api/index.ts
```

## ❌ 何时避免Index文件

### 1. 简单的模块重导出
```typescript
// ❌ 避免 - 过度使用barrel
/components/index.ts (如果只有2-3个组件)
```

### 2. 频繁变动的模块
```typescript
// ❌ 避免 - 经常修改的业务逻辑模块
/business-logic/index.ts
```

## 🎯 最佳实践

### 1. 使用具名导出
```typescript
// ✅ 推荐
export { UserService } from './UserService'
export { AuthService } from './AuthService'

// ❌ 避免
export * from './UserService'
export * from './AuthService'
```

### 2. 直接导入简单模块
```typescript
// ✅ 推荐
import { UserService } from '@/services/UserService'

// ❌ 避免（如果不是真正需要抽象）
import { UserService } from '@/services'
```

### 3. 分组相关功能
```typescript
// ✅ 好的组织方式
// stores/index.ts
export { useUserStore } from './modules/user'
export { useProductStore } from './modules/product'
export { useCartStore } from './modules/cart'
```

## 🛠️ ESLint规则

项目中已配置以下ESLint规则来强制最佳实践：

```javascript
// 防止循环依赖
'import/no-cycle': 'error'

// 限制 export * 的使用
'no-restricted-syntax': [
  'error',
  {
    selector: 'ExportAllDeclaration',
    message: '避免使用 export * 语法，请使用具名导出'
  }
]
```

## 📊 项目中的Index文件状态

### ✅ 保留的文件
- `server/src/index.ts` - 应用入口
- `client/src/router/index.ts` - 路由配置
- `client/src/services/api/index.ts` - API服务配置
- `client/src/stores/index.ts` - 状态管理导出
- `client/src/services/index.ts` - 服务层导出

### 🔄 已重构的文件
- `client/src/types/index.ts` - 改为具名导出
- `server/src/api/controllers/index.ts` - 改为具名导出
- `server/src/infrastructure/config/index.ts` - 改为具名导出
- `server/src/adapters/llm/index.ts` - 改为具名导出
- `server/src/infrastructure/adapters/llm/index.ts` - 改为具名导出

## 🔍 定期审查

建议每季度审查项目中的index文件：

1. 检查是否有新增的不必要barrel文件
2. 验证现有barrel文件是否仍然有价值
3. 考虑是否可以简化模块导入

## 📚 参考资源

- [Vue3项目结构最佳实践](https://vue-faq.org/en/development/project-structure.html)
- [TypeScript模块导出指南](https://www.typescriptlang.org/docs/handbook/modules.html)
- [避免Barrel文件的实用指南](https://dev.to/thepassle/a-practical-guide-against-barrel-files-for-library-authors-118c) 