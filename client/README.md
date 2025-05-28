# Lady Sion 前端架构说明

基于 Vue 3 + TypeScript + Element Plus 的现代化前端架构，遵循 Vue 生态最佳实践。

## 🎯 架构特点

- **简单明了** - 不过度设计，符合Vue开发习惯
- **职责清晰** - 合理分层，避免过度抽象
- **类型安全** - 完整的TypeScript类型系统
- **可维护性** - 代码结构清晰，易于维护和扩展

## 🏗️ 技术栈

- **Vue 3** - 组合式API + `<script setup>`语法
- **TypeScript** - 完整类型支持
- **Pinia** - 现代化状态管理
- **Element Plus** - UI组件库
- **Vue Router** - 前端路由
- **Axios** - HTTP客户端
- **Vite** - 构建工具

## 📁 目录结构

```
client/src/
├── components/              # 组件库
│   ├── common/             # 通用组件 (Button, Modal, Loading等)
│   ├── business/           # 业务组件 (CharacterCard, MessageBubble等)
│   └── layout/             # 布局组件 (Header, Sidebar, Footer等)
├── views/                   # 页面视图
│   ├── home/               # 首页相关
│   ├── characters/         # 角色管理页面
│   ├── conversations/      # 对话页面
│   └── settings/           # 设置页面
├── stores/                  # 状态管理 (Pinia)
│   ├── modules/            # 按功能模块分组
│   │   ├── character.ts    # 角色相关状态
│   │   ├── conversation.ts # 对话相关状态
│   │   └── ui.ts           # UI状态
│   └── index.ts            # Store入口
├── composables/            # 组合式API
│   ├── useCharacter.ts     # 角色相关逻辑
│   ├── useChat.ts          # 聊天相关逻辑
│   └── useApi.ts           # API调用逻辑
├── services/               # 业务服务层
│   ├── api/                # API调用
│   │   ├── character.ts    # 角色API
│   │   ├── conversation.ts # 对话API
│   │   └── index.ts        # API统一入口
│   └── storage/            # 本地存储
├── types/                  # 类型定义
│   ├── api.ts              # API相关类型
│   ├── character.ts        # 角色相关类型
│   ├── conversation.ts     # 对话相关类型
│   └── index.ts            # 类型统一导出
├── utils/                  # 工具函数
│   ├── format.ts           # 格式化工具
│   ├── validation.ts       # 验证工具
│   ├── constants.ts        # 常量定义
│   └── common.ts           # 通用工具
├── router/                 # 路由配置
├── assets/                 # 静态资源
├── styles/                 # 样式文件
└── plugins/                # 插件配置
```

## 🔧 核心概念

### 1. 组合式API (Composables)

将可复用的逻辑封装为组合式函数：

```typescript
// composables/useCharacter.ts
export function useCharacter() {
  const store = useCharacterStore()
  
  const characters = computed(() => store.characters)
  const loading = computed(() => store.loading)
  
  const createCharacter = async (data: CreateCharacterData) => {
    return await store.createCharacter(data)
  }
  
  return {
    characters,
    loading,
    createCharacter
  }
}
```

### 2. Pinia状态管理

采用组合式API风格的store：

```typescript
// stores/modules/character.ts
export const useCharacterStore = defineStore('character', () => {
  const characters = ref<Character[]>([])
  const loading = ref(false)
  
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
    loadCharacters
  }
})
```

### 3. API服务层

统一的API调用封装：

```typescript
// services/api/character.ts
class CharacterService extends BaseApiService {
  async getAll(): Promise<Character[]> {
    return this.get<Character[]>('/characters')
  }
  
  async create(data: CreateCharacterData): Promise<Character> {
    return this.post<Character>('/characters', data)
  }
}

export const characterApi = new CharacterService()
```

### 4. 类型系统

完整的TypeScript类型定义：

```typescript
// types/character.ts
export interface Character {
  id: string
  name: string
  description: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCharacterData {
  name: string
  description: string
  avatar?: string
}
```

## 📋 开发规范

### 1. 导入顺序

```typescript
// 1. Vue核心
import { ref, computed, onMounted } from 'vue'

// 2. 第三方库
import { ElMessage } from 'element-plus'

// 3. 类型导入
import type { Character } from '@/types/character'

// 4. 项目内模块
import { useCharacterStore } from '@/stores/modules/character'
import CharacterCard from '@/components/business/CharacterCard.vue'
```

### 2. 组件编写

```vue
<template>
  <div class="character-card">
    <h3>{{ character.name }}</h3>
    <p>{{ character.description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Character } from '@/types'

// 组件属性
interface Props {
  character: Character
}

const props = defineProps<Props>()

// 组件事件
interface Emits {
  edit: [character: Character]
}

const emit = defineEmits<Emits>()

// 使用组合式API
const { updateCharacter } = useCharacter()
</script>
```

### 3. 路径别名

统一使用 `@` 别名：

```typescript
import { useCharacterStore } from '@/stores/modules/character'
import type { Character } from '@/types/character'
import { formatDate } from '@/utils/format'
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd client
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

## 📊 项目特性

### 响应式设计
- 移动端适配
- 灵活的网格布局
- 响应式组件

### 国际化支持
- 中文界面
- 时间格式化
- 数字格式化

### 性能优化
- 组件懒加载
- 防抖/节流
- 虚拟滚动（规划中）

### 开发体验
- 完整的TypeScript支持
- ESLint代码检查
- 热模块替换(HMR)

## 🔍 最佳实践

1. **组件设计**：优先使用组合式API，保持组件职责单一
2. **状态管理**：优先使用局部状态，需要共享时使用Pinia
3. **类型安全**：所有API返回值和组件props都要定义类型
4. **错误处理**：统一的错误处理和用户提示
5. **代码复用**：将通用逻辑抽取为composables

## 📈 后续规划

- [ ] 增加单元测试
- [ ] 添加E2E测试
- [ ] 完善国际化
- [ ] 性能监控
- [ ] PWA支持

## 🤝 贡献指南

1. 遵循现有的代码风格
2. 添加必要的类型定义
3. 编写清晰的注释
4. 确保代码通过linter检查

---

这个架构基于Vue生态最佳实践，既保持了清晰的结构，又避免了过度抽象，适合团队开发和长期维护。 