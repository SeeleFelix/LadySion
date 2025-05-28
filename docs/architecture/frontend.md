# Lady Sion 前端架构设计文档 v2.0

## 🎯 设计原则

基于Vue生态最佳实践，采用**实用主义**架构：
- **简单明了** - 不过度设计，符合Vue开发习惯
- **职责清晰** - 合理分层，但不过度抽象
- **团队友好** - 新人易上手，维护成本低
- **渐进增强** - 可以根据项目发展逐步优化

## 📁 目录结构 (修正版)

```
web/src/
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
- **PascalCase**: 所有组件文件使用PascalCase
- **描述性命名**: 组件名要清楚表达用途
- **业务前缀**: 业务组件可加业务前缀 (如 `ChatMessageBubble`)

### 2. 状态管理原则
```typescript
// ✅ 推荐 - 细粒度状态管理
const useUIStore = () => {
  const sidebarVisible = ref(true)
  const theme = ref('dark')
  
  return { sidebarVisible, theme }
}

// ❌ 避免 - 巨型状态对象
const useAppStore = () => {
  const state = ref({
    ui: { sidebarVisible: true, theme: 'dark' },
    user: { profile: null, settings: {} },
    chat: { messages: [], characters: [] }
    // ... 太多状态混在一起
  })
}
```

### 3. 错误处理策略
```typescript
// composables/useErrorHandler.ts
export function useErrorHandler() {
  const handleApiError = (error: unknown) => {
    if (error instanceof ApiError) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('操作失败，请重试')
      console.error('Unexpected error:', error)
    }
  }
  
  return { handleApiError }
}
```

### 4. 响应式数据管理
```typescript
// ✅ 推荐 - 明确的响应式引用
const characters = ref<Character[]>([])
const loading = ref(false)

// ✅ 推荐 - 计算属性用于派生状态
const activeCharacters = computed(() => 
  characters.value.filter(c => c.active)
)

// ❌ 避免 - 过度使用reactive
const state = reactive({
  characters: [],
  loading: false,
  // ... 大对象不利于性能优化
})
```

## 📱 响应式设计

### 断点设计
```css
/* 设计系统断点 */
:root {
  --breakpoint-xs: 480px;   /* 手机 */
  --breakpoint-sm: 768px;   /* 平板 */
  --breakpoint-md: 1024px;  /* 小笔记本 */
  --breakpoint-lg: 1440px;  /* 桌面 */
  --breakpoint-xl: 1920px;  /* 大屏 */
}
```

### 布局适配策略
```vue
<template>
  <div class="app-layout">
    <!-- 移动端: 单栏布局 -->
    <div v-if="isMobile" class="mobile-layout">
      <component :is="currentView" />
    </div>
    
    <!-- 桌面端: 三栏布局 -->
    <div v-else class="desktop-layout">
      <Sidebar />
      <MainContent />
      <RightPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
})

const isMobile = breakpoints.smaller('tablet')
</script>
```

## 🎭 SillyTavern主题系统

### CSS变量系统
```css
/* SillyTavern主题变量 */
:root {
  /* 主色调 */
  --primary-bg: rgb(36, 36, 37);
  --secondary-bg: rgba(45, 45, 50, 0.9);
  --accent-color: #7c3aed;
  
  /* 文字颜色 */
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #808080;
  
  /* 玻璃形态效果 */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: blur(10px);
}
```

### 组件主题定制
```vue
<style scoped>
.character-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 16px;
  color: var(--text-primary);
}

.message-bubble {
  background: linear-gradient(
    135deg, 
    var(--secondary-bg), 
    rgba(124, 58, 237, 0.1)
  );
  border-radius: 18px;
  padding: 12px 16px;
}
</style>
```

## 🔄 数据流管理

### 单向数据流
```
用户操作 → Action → Store → View更新
     ↑                           ↓
API响应 ← Service ← Store Mutation
```

### 示例实现
```typescript
// 1. 用户触发操作
const handleSendMessage = async (content: string) => {
  // 2. 调用Store Action
  await chatStore.sendMessage({
    content,
    characterId: currentCharacter.value.id
  })
}

// 3. Store处理逻辑
const sendMessage = async (data: SendMessageRequest) => {
  // 4. 调用API Service
  const message = await chatApi.sendMessage(data)
  
  // 5. 更新Store状态
  messages.value.push(message)
}

// 6. View自动响应状态变化
const messages = computed(() => chatStore.messages)
```

这个架构设计确保了代码的可维护性、可测试性和开发效率，同时保持了Vue生态的最佳实践。 