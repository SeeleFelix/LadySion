# Lady Sion 后端架构文档

## 1. 架构概述

### 1.1 架构原则

- **单一职责原则**：每个模块只负责一个明确定义的功能
- **依赖倒置原则**：高层模块不依赖低层模块，都依赖抽象
- **开闭原则**：对扩展开放，对修改封闭
- **接口隔离原则**：不应该强迫客户依赖它们不需要的接口

### 1.2 分层架构

```
┌─────────────────────────────────────────┐
│              表现层 (Presentation)        │  ← 控制器、路由、中间件
├─────────────────────────────────────────┤
│              应用层 (Application)        │  ← 用例、应用服务、命令/查询
├─────────────────────────────────────────┤
│              领域层 (Domain)             │  ← 实体、值对象、领域服务
├─────────────────────────────────────────┤
│              基础设施层 (Infrastructure)  │  ← 存储库、外部API、配置
└─────────────────────────────────────────┘
```

## 2. 核心域设计

### 2.1 聚合根识别

#### Chat 聚合

- **聚合根**: `Chat` - 管理完整的对话生命周期
- **实体**: `Message`, `Participant`
- **值对象**: `MessageContent`, `Timestamp`

#### Character 聚合

- **聚合根**: `Character` - 角色定义和配置
- **值对象**: `CharacterProfile`, `PersonalityTraits`

#### Preset 聚合

- **聚合根**: `PresetCollection` - 预设配置集合
- **实体**: `InstructPreset`, `ContextPreset`, `SystemPromptPreset`
- **值对象**: `PresetConfiguration`, `MacroDefinition`

#### Session 聚合

- **聚合根**: `UserSession` - 用户会话状态
- **实体**: `ConversationContext`, `UserPreferences`
- **值对象**: `SessionConfig`, `ModelSettings`

### 2.2 领域服务

- **ChatOrchestrationService**: 聊天流程编排和消息处理
- **PresetManagementService**: 预设解析、验证和合并
- **ModelProxyService**: 模型选择、路由和故障处理

## 3. 应用层设计

### 3.1 用例(Use Cases)

**聊天相关**: `SendMessageUseCase`, `GetConversationHistoryUseCase`,
`CreateConversationUseCase` **角色管理**: `CreateCharacterUseCase`,
`UpdateCharacterUseCase`, `ListCharactersUseCase`\
**预设管理**: `ApplyPresetUseCase`, `CreatePresetUseCase`, `ImportPresetUseCase`

### 3.2 应用服务

- **ChatApplicationService**: 聊天相关业务流程协调
- **CharacterApplicationService**: 角色管理业务协调
- **PresetApplicationService**: 预设管理业务协调

### 3.3 命令和查询(CQRS)

- **命令**: 修改系统状态的操作 (`SendMessageCommand`, `CreateCharacterCommand`)
- **查询**: 只读数据获取 (`GetHistoryQuery`, `ListCharactersQuery`)

## 4. 基础设施层设计

### 4.1 存储策略

- **主存储**: PostgreSQL (生产) / SQLite (开发)
- **缓存**: Redis (会话状态、频繁查询)
- **文件存储**: 本地文件系统 (头像、预设文件)

### 4.2 外部服务集成

- **LLM适配器**: OpenRouter, OpenAI, Claude 统一接口
- **配置管理**: 环境变量统一管理和验证
- **事件系统**: 域事件发布/订阅机制

## 5. 表现层设计

### 5.1 API设计

```
POST   /api/v1/conversations              # 创建对话
POST   /api/v1/conversations/:id/messages # 发送消息
GET    /api/v1/conversations/:id/messages # 获取消息历史

GET    /api/v1/characters                 # 获取角色列表
POST   /api/v1/characters                 # 创建角色
PUT    /api/v1/characters/:id             # 更新角色

GET    /api/v1/presets                    # 获取预设列表
POST   /api/v1/presets                    # 创建预设
POST   /api/v1/presets/import             # 导入预设

GET    /api/v1/models                     # 获取可用模型
GET    /api/v1/health                     # 健康检查
```

### 5.2 中间件栈

- CORS处理、请求验证、错误处理、日志记录、限流

## 6. 关键设计模式

### 6.1 依赖注入

- 统一的DI容器管理所有依赖关系
- 接口驱动的松耦合设计

### 6.2 错误处理

- 领域错误分类：ValidationError, NotFoundError, ExternalServiceError
- 统一错误处理中间件

### 6.3 配置管理

- 分层配置：服务器、数据库、LLM、缓存
- 环境变量驱动的配置加载

## 7. 目录结构

```
server/src/
├── presentation/           # 表现层
│   ├── controllers/       # 控制器
│   ├── middleware/        # 中间件
│   └── routes/           # 路由定义
├── application/          # 应用层  
│   ├── usecases/         # 用例
│   ├── services/         # 应用服务
│   └── dto/             # 数据传输对象
├── domain/              # 领域层
│   ├── entities/        # 实体
│   ├── valueobjects/    # 值对象
│   ├── services/        # 领域服务
│   └── repositories/    # 存储库接口
├── infrastructure/      # 基础设施层
│   ├── repositories/    # 存储库实现
│   ├── adapters/       # 外部服务适配器
│   ├── config/         # 配置管理
│   └── events/         # 事件系统
└── shared/             # 共享工具
    ├── errors/         # 错误定义
    ├── types/          # 类型定义
    └── utils/          # 工具函数
```

## 8. 实施计划

### 阶段一：基础架构重构

1. 重组目录结构
2. 实现DI容器
3. 创建核心领域模型

### 阶段二：核心功能迁移

1. 迁移聊天功能到新架构
2. 重构LLM适配器
3. 统一错误处理

### 阶段三：高级功能集成

1. 预设系统重构
2. 角色管理优化
3. 事件系统集成

这个架构确保了系统的可测试性、可维护性、可扩展性和可读性。
