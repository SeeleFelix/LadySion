# Lady Sion 前端架构设计文档 v2.0

## 🎯 设计原则

基于Vue生态最佳实践，采用**实用主义**架构：
- **简单明了** - 不过度设计，符合Vue开发习惯
- **职责清晰** - 合理分层，但不过度抽象
- **团队友好** - 新人易上手，维护成本低
- **渐进增强** - 可以根据项目发展逐步优化

## 📁 目录结构 (修正版)

```
client/src/
├── assets/                 # 静态资源
│   ├── fonts/              # 字体
│   ├── images/             # 图片
│   └── styles/             # 样式文件
├── components/             # 组件库
│   ├── business/           # 业务组件 (CharacterCard, MessageBubble等)
│   ├── common/             # 通用组件 (Button, Modal, Loading等)
│   └── layout/             # 布局组件 (Header, Sidebar, Footer等)
├── composables/            # 组合式API
│   ├── useApi.ts           # API调用逻辑
│   ├── useCharacter.ts     # 角色相关逻辑
│   └── useChat.ts          # 聊天相关逻辑
├── plugins/                # 插件配置
│   └── element-plus.ts     # Element Plus配置
├── router/                 # 路由配置
│   └── index.ts
├── services/               # 业务服务层
│   ├── api/                # API调用
│   │   ├── character.ts    # 角色API
│   │   ├── conversation.ts # 对话API
│   │   └── index.ts        # API统一入口
│   └── storage/            # 本地存储
├── stores/                 # 状态管理 (Pinia)
│   ├── modules/            # 按功能模块分组
│   │   ├── character.ts    # 角色相关状态
│   │   ├── conversation.ts # 对话相关状态
│   │   └── ui.ts           # UI状态
│   └── index.ts            # Store入口
├── types/                  # 类型定义
│   ├── api.ts              # API相关类型
│   ├── character.ts        # 角色相关类型
│   ├── conversation.ts     # 对话相关类型
│   └── index.ts            # 类型统一导出
├── utils/                  # 工具函数
│   ├── constants.ts        # 常量定义
│   ├── format.ts           # 格式化工具
│   └── validation.ts       # 验证工具
└── views/                  # 页面视图
    ├── characters/         # 角色管理页面
    ├── conversations/      # 对话页面
    ├── home/               # 首页相关
    └── settings/           # 设置页面
```

## 🏗️ 架构分层

### 1. 视图层 (Views + Components)
- **页面组件 (Views)**: 路由对应的页面级组件
- **业务组件 (Business)**: 包含业务逻辑的功能组件
- **通用组件 (Common)**: 可复用的UI组件

### 2. 逻辑层 (Composables + Stores)
- **Composables**: 可复用的响应式逻辑
- **Stores**: 全局状态管理

### 3. 服务层 (Services)
- **API服务**: 与后端交互
- **存储服务**: 本地数据管理

### 4. 支撑层 (Types + Utils)
- **类型定义**: TypeScript类型系统
- **工具函数**: 纯函数工具

## 📋 导入规范

### 统一使用@别名路径:
```typescript
// ✅ 正确 - 使用@别名
import { useCharacterStore } from '@/stores/modules/character'
import type { Character } from '@/types/character'
import { formatDate } from '@/utils/format'

// ❌ 错误 - 相对路径混乱
import { useCharacterStore } from '../stores/character'
import type { Character } from '../../types/character'
```

### 导入顺序规范:
```typescript
// 1. Vue核心
import { ref, computed, onMounted } from 'vue'

// 2. 第三方库
import { ElMessage } from 'element-plus'

// 3. 类型导入
import type { Character } from '@/types/character'

// 4. 项目内模块
import { useCharacterStore } from '@/stores/modules/character'
import { CharacterCard } from '@/components/business'
```

## 🔧 核心模块设计

### Store设计 (基于Pinia)
```typescript
// stores/modules/character.ts
export const useCharacterStore = defineStore('character', () => {
  // 状态
  const characters = ref<Character[]>([])
  const loading = ref(false)
  
  // 计算属性
  const characterCount = computed(() => characters.value.length)
  
  // 方法
  const loadCharacters = async () => {
    loading.value = true
    try {
      characters.value = await characterApi.getAll()
    } finally {
      loading.value = false
    }
  }
  
  return {
    characters,
    loading,
    characterCount,
    loadCharacters
  }
})
```

### Composable设计
```typescript
// composables/useCharacter.ts
export function useCharacter() {
  const store = useCharacterStore()
  
  const createCharacter = async (data: CreateCharacterData) => {
    await store.createCharacter(data)
    ElMessage.success('角色创建成功')
  }
  
  return {
    characters: computed(() => store.characters),
    loading: computed(() => store.loading),
    createCharacter
  }
}
```

### API服务设计
```typescript
// services/api/character.ts
class CharacterService {
  async getAll(): Promise<Character[]> {
    const response = await httpClient.get('/characters')
    return response.data
  }
  
  async create(data: CreateCharacterData): Promise<Character> {
    const response = await httpClient.post('/characters', data)
    return response.data
  }
}

export const characterApi = new CharacterService()
```

## 🎨 组件分类标准

### Common组件 (通用UI)
- Button, Input, Modal, Loading
- Card, Table, Pagination
- Icon, Badge, Tag
- 完全无业务逻辑，纯UI展示

### Business组件 (业务功能)
- CharacterCard - 角色卡片
- MessageBubble - 消息气泡
- ConversationList - 对话列表
- CharacterEditor - 角色编辑器
- 包含特定业务逻辑的功能组件

### Layout组件 (布局结构)
- AppHeader, AppSidebar, AppFooter
- PageContainer, ContentWrapper
- 负责页面布局和结构

## 🚀 最佳实践

### 1. 组件命名
```
- PascalCase for components: CharacterCard.vue
- camelCase for composables: useCharacter.ts
- kebab-case for files: character-list.vue (可选)
```

### 2. 状态管理
```typescript
// 优先使用局部状态
const localState = ref('value')

// 需要共享时使用Store
const globalStore = useCharacterStore()

// 复杂逻辑抽取为Composable
const { characters, createCharacter } = useCharacter()
```

### 3. 类型安全
```typescript
// 所有API返回值都要定义类型
interface Character {
  id: string
  name: string
  description: string
}

// 使用泛型增强复用性
interface ApiResponse<T> {
  data: T
  message: string
}
```

## 📈 迁移计划

### 阶段1: 重构目录结构 ✅
- 调整目录布局
- 修复导入路径
- 建立基础架构

### 阶段2: 重构状态管理
- 简化Store设计
- 创建Composables
- 统一API服务

### 阶段3: 重构组件
- 重新分类组件
- 优化组件API
- 提升复用性

### 阶段4: 完善类型系统
- 补充类型定义
- 增强类型安全
- 优化开发体验

## 🔍 与原架构对比

| 方面 | 原架构 (过度设计) | 新架构 (实用主义) |
|------|------------------|------------------|
| 复杂度 | 过高，4层分离 | 适中，3层分离 |
| 学习成本 | 高，需要DDD知识 | 低，Vue标准实践 |
| 开发效率 | 慢，概念复杂 | 快，直观易懂 |
| 维护成本 | 高，抽象层太多 | 低，结构清晰 |
| 团队适应 | 难，需要培训 | 易，Vue开发者熟悉 |

这个新架构更符合Vue生态的最佳实践，既保持了清晰的结构，又避免了过度抽象。 