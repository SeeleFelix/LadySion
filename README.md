# Lady Sion - 纯Deno全栈AI聊天应用

🎉 **项目状态**: ✅ 编译通过，前后端运行成功！

## 📋 概述

Lady Sion 是基于 **纯Deno生态** 的现代化 AI
聊天应用，采用领域驱动设计(DDD)架构和monorepo管理，提供类似 SillyTavern 的用户体验。

## 🎯 核心特性

- **纯Deno生态**: 全栈使用 Deno，无Node.js依赖
- **Monorepo架构**: 统一的依赖管理和构建流程
- **领域驱动设计**: 后端采用 DDD 架构模式
- **现代前端**: Vue 3 + TypeScript + Element Plus + Vite
- **AI 聊天体验**: 流畅的 AI 对话交互
- **预设管理**: 灵活的聊天预设和角色管理系统

## 🚀 一键启动

### 环境要求

- **Deno**: v1.40.0 或更高版本

### 快速启动

```bash
# 克隆项目
git clone <repository-url>
cd LadySion

# 安装所有依赖
deno install

# 🎯 一键启动前后端（推荐）
deno task dev

# 或者分别启动
deno task start:backend  # 后端服务
deno task start:frontend # 前端服务
```

### 访问应用

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **健康检查**: http://localhost:3000/api/v1/health

## 🛠️ 技术栈

### 后端 (Deno)

- **运行时**: Deno v1.40+
- **Web框架**: Oak v15
- **数据库**: SQLite v3.9.1
- **架构**: DDD (领域驱动设计)
- **API风格**: RESTful

### 前端 (Deno + Vite)

- **构建工具**: Vite v5.1.4 (运行在Deno上)
- **框架**: Vue 3.4.21
- **路由**: Vue Router 4.3.0
- **状态管理**: Pinia 2.1.7
- **UI组件**: Element Plus 2.6.1
- **图标**: FontAwesome 6.5.1
- **HTTP客户端**: Axios 1.6.7

## 🏗️ 项目结构

```
LadySion/
├── 📁 server/           # 后端Deno应用
│   └── src/
│       ├── domain/      # 领域层
│       ├── application/ # 应用层  
│       ├── infrastructure/ # 基础设施层
│       └── presentation/   # 表现层
├── 📁 web/              # 前端Vue应用
│   └── src/
│       ├── components/  # Vue组件
│       ├── views/      # 页面视图
│       ├── stores/     # Pinia状态
│       └── services/   # API服务
├── 📁 shared/           # 共享类型定义
├── 📁 docs/             # 项目文档
├── deno.json           # 根配置文件（monorepo）
├── import_map.json     # 统一依赖管理
└── README.md
```

## 🔧 开发命令

```bash
# 🚀 开发
deno task dev              # 同时启动前后端
deno task start:backend    # 仅启动后端
deno task start:frontend   # 仅启动前端

# 🔨 构建
deno task build           # 构建前端生产版本

# 🧪 测试
deno task test            # 运行所有测试
deno task test:backend    # 仅后端测试
deno task test:frontend   # 仅前端测试

# 🎨 代码质量
deno task fmt             # 格式化代码
deno task lint            # 代码检查
```

## 📚 文档导航

### 核心文档

| 文档                                            | 状态    | 描述                   |
| ----------------------------------------------- | ------- | ---------------------- |
| [项目愿景](./docs/strategic/vision-mission.md)  | ✅ 完成 | 项目目标和核心理念     |
| [系统概览](./docs/strategic/system-overview.md) | ✅ 完成 | 系统整体架构和技术选择 |

### 架构设计

| 文档                                                                         | 状态    | 描述                       |
| ---------------------------------------------------------------------------- | ------- | -------------------------- |
| [后端架构](./docs/architecture/backend.md)                                   | ✅ 完成 | 后端DDD架构设计            |
| [前端架构](./docs/architecture/frontend.md)                                  | ✅ 完成 | 前端Vue3架构设计           |
| [AnimaWeave全景类图](./docs/architecture/animaweave-class-diagram.md)        | ✅ 完成 | AnimaWeave系统完整类图结构 |

### 开发指南

| 文档                                                           | 状态    | 描述                    |
| -------------------------------------------------------------- | ------- | ----------------------- |
| [快速开始](./docs/guides/quick-start.md)                       | ✅ 完成 | 5分钟快速搭建开发环境   |
| [Whisper框架快速指南](./docs/technical/whisper-quick-start.md) | ✅ 完成 | Whisper框架简明使用指导 |
| [ESLint配置](./docs/guides/eslint-setup.md)                    | ✅ 完成 | 代码质量工具配置        |

### 设计哲学

| 文档                                                                    | 状态    | 描述           |
| ----------------------------------------------------------------------- | ------- | -------------- |
| [Seele Felix核心哲学](./docs/philosophy/seele-felix-core-philosophy.md) | ✅ 完成 | 核心理念体系   |
| [Lady Sion哲学](./docs/philosophy/lady-sion-philosophy.md)              | ✅ 完成 | 设计哲学和理念 |

完整的文档索引请查看 [文档中心](./docs/README.md)

## ✅ 项目状态

- ✅ **后端服务**: Deno + Oak，编译无错误，运行正常
- ✅ **前端应用**: Deno + Vite + Vue3，编译无错误，运行正常
- ✅ **依赖管理**: 纯Deno npm包管理，统一配置
- ✅ **Monorepo**: 根目录统一管理，一键启动
- ✅ **类型系统**: 全栈TypeScript，类型安全
- ✅ **开发工具**: 格式化、检查、测试配置完整

## 🎯 下一步计划

1. **功能完善**: 完善聊天功能和预设管理
2. **测试覆盖**: 添加单元测试和集成测试
3. **文档补全**: 完善API文档和用户指南
4. **部署优化**: 生产环境部署配置
5. **性能优化**: 前后端性能调优

## 🤝 贡献指南

我们欢迎社区贡献！请参考：

- [项目文档中心](./docs/README.md) - 完整的项目文档体系
- [快速开始指南](./docs/guides/quick-start.md) - 开发环境搭建
- [代码质量规范](./docs/guides/eslint-setup.md) - 代码规范和工具配置

## 🙏 致谢

- [SillyTavern](https://github.com/SillyTavern/SillyTavern) - 界面设计灵感
- [《eden*》](https://zh.wikipedia.org/wiki/Eden*) - Sion角色设计来源
- Deno, Vue.js, Element Plus 等开源项目

## 📄 许可证

NO LICENSE\
任何贡献者都可以获取此项目的授权，非贡献者禁止使用，不惜一切代价追究非授权者的使用！包括但不限于法律，暴力甚至谋杀！

---

**🎯 核心理念**:
创造一个介于纯AI助手与理想化智能体之间的过渡形态，探索AI的人格化表达和深度协作能力。

📚 **[查看完整文档](./docs/README.md)** | 🚀 **[快速开始](./docs/guides/quick-start.md)** | 🏗️
**[架构设计](./docs/architecture/)** | 💭 **[设计哲学](./docs/philosophy/lady-sion-philosophy.md)**
