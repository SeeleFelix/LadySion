# Lady Sion 项目文档体系

## 📋 文档架构概览

Lady Sion项目采用**分层文档架构**，确保信息的清晰组织和长期维护。

```
docs/
├── strategic/           # 战略层文档 (长期稳定)
├── architecture/        # 架构层文档 (中期稳定)  
├── design/             # 设计层文档 (中期稳定)
├── philosophy/         # 哲学层文档 (核心理念)
├── technical/          # 技术层文档 (短期迭代)
├── guides/             # 操作指南 (经常更新)
├── api/                # API文档 (版本化管理)
├── testing/            # 测试文档 (持续更新)
└── deployment/         # 部署文档 (运维指南)
```

## 🎯 战略层文档 (Strategic)

**目标**: 定义Lady Sion的根本使命和长期方向

| 文档 | 描述 | 更新频率 | 负责人 |
|------|------|----------|--------|
| [愿景使命](strategic/vision-mission.md) | Lady Sion的根本目标和Seele Felix关系 | 年度+ | 项目所有者 |
| [系统概览](strategic/system-overview.md) | 高层次系统描述和边界 | 半年+ | 项目所有者 |

## 💭 哲学层文档 (Philosophy)

**目标**: 定义核心理念和设计哲学

| 文档 | 描述 | 状态 |
|------|------|------|
| [Seele Felix核心哲学](philosophy/seele-felix-core-philosophy.md) | Seele Felix的核心理念体系 | ✅ 完成 |
| [Lady Sion哲学](philosophy/lady-sion-philosophy.md) | Lady Sion的设计哲学 | ✅ 完成 |
| [哲学总结](philosophy/summary.md) | 哲学文档总结 | ✅ 完成 |
| [AI意识哲学 (草稿)](philosophy/[draft]ai-consciousness-philosophy.md) | AI意识相关的哲学思考 | 🚧 草稿 |
| [核心哲学 (草稿)](philosophy/[draft]core-philosophy.md) | 核心哲学理念 | 🚧 草稿 |

## 🏗️ 架构层文档 (Architecture)

**目标**: 定义系统的整体结构和关键设计决策

| 文档类型 | 说明 | 文档 |
|----------|------|------|
| 后端架构 | 服务端架构设计和组件结构 | [backend.md](architecture/backend.md) |
| 前端架构 | 客户端架构和组件设计 | [frontend.md](architecture/frontend.md) |

## 🎨 设计层文档 (Design)

**目标**: 详细的功能设计和用户体验规范

| 文档类型 | 说明 | 文档 |
|----------|------|------|
| UI设计 | 界面设计和用户体验指南 | [ui-design.md](design/ui-design.md) |

## ⚙️ 技术层文档 (Technical)

**目标**: 具体的技术实现和开发指导

| 文档类型 | 说明 | 文档 |
|----------|------|------|
| LangGraph指南 | LangGraph框架使用指南 | [langgraph-guide.md](technical/langgraph-guide.md) |
| OpenRouter指南 | OpenRouter集成和配置指南 | [openrouter-guide.md](technical/openrouter-guide.md) |
| 索引文件指南 | 项目文件索引和导航指南 | [index-files-guide.md](technical/index-files-guide.md) |

## 📖 操作指南 (Guides)

**目标**: 日常操作和维护的实用指南

| 指南类型 | 目标用户 | 文档 |
|----------|----------|------|
| 快速开始 | 新开发者 | [quick-start.md](guides/quick-start.md) |
| 共享DTO类型最佳实践 | 开发团队 | [shared-dto-types-best-practices.md](guides/shared-dto-types-best-practices.md) |
| ESLint配置 | 开发团队 | [eslint-setup.md](guides/eslint-setup.md) |
| ESLint遗留配置 | 开发团队 | [eslint-legacy.md](guides/eslint-legacy.md) |

## 📡 API文档 (API)

**目标**: API规范和接口文档

| 文档类型 | 内容 | 状态 |
|----------|------|------|
| API规范 | RESTful API定义 | 🔄 待完成 |

## 🧪 测试文档 (Testing)

**目标**: 质量保证和验证方法

| 文档类型 | 内容 | 状态 |
|----------|------|------|
| 测试策略 | 整体测试方法 | 🔄 待完成 |

## 🚀 部署文档 (Deployment)

**目标**: 部署和运维指南

| 文档类型 | 内容 | 状态 |
|----------|------|------|
| 部署指南 | 环境部署和配置 | 🔄 待完成 |

## 📚 文档管理最佳实践

### 1. 文档生命周期
- **创建**: 使用标准模板，确保结构一致
- **审查**: 定期审查和更新机制
- **归档**: 过时文档的版本控制
- **废弃**: 明确的废弃标记和替代指引

### 2. 版本控制策略
- **语义化版本**: 主要.次要.补丁 (如 v1.2.3)
- **变更日志**: 每个版本的详细变更记录
- **向后兼容**: 重大变更的迁移指南

### 3. 协作规范
- **Markdown标准**: 统一的格式和样式
- **图表规范**: Mermaid/PlantUML标准化
- **模板使用**: 统一的文档模板
- **Review流程**: 文档变更的审查机制

### 4. 可发现性
- **标签系统**: 按主题和难度分类
- **搜索优化**: 关键词和元数据
- **交叉引用**: 文档间的链接关系
- **索引维护**: 自动生成和更新
