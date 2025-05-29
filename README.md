# Lady Sion - AI聊天应用

## 🎯 项目概述

Lady Sion 是一个基于《eden*》中 Sion 角色设计的现代化 AI 聊天应用，采用 SillyTavern 风格界面和领域驱动设计架构。

### 核心特性
- 🎨 **SillyTavern风格界面** - 深色玻璃形态主题，三栏布局设计
- 💬 **智能聊天系统** - 多模型支持，流式响应，角色个性化
- ⚙️ **完整预设系统** - 指令模式、上下文模板、系统提示词管理
- 👥 **多角色支持** - 角色切换、个性化设置、头像管理
- 🧠 **记忆系统** - 持久化对话历史，上下文关联
- 🔧 **现代化架构** - Vue 3 + TypeScript 前端，DDD 后端架构

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone <repository-url>
cd LadySion

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加必要的API密钥

# 4. 启动开发服务器
npm run dev

# 5. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:3000
```

## 📚 完整文档

所有详细文档都已迁移到 [`docs/`](./docs/) 目录中：

### 🚀 新手指南
- **[快速开始](./docs/guides/quick-start.md)** - 5分钟快速搭建开发环境
- **[共享DTO类型最佳实践](./docs/guides/shared-dto-types-best-practices.md)** - 跨模块类型定义规范
- **[ESLint配置](./docs/guides/eslint-setup.md)** - 代码质量工具配置
- **[ESLint遗留配置](./docs/guides/eslint-legacy.md)** - 历史配置参考

### 🏗️ 架构文档
- **[后端架构](./docs/architecture/backend.md)** - DDD架构设计和实现
- **[前端架构](./docs/architecture/frontend.md)** - Vue生态最佳实践

### 🔧 技术指南
- **[OpenRouter集成](./docs/technical/openrouter-guide.md)** - LLM API集成和配置
- **[LangGraph指南](./docs/technical/langgraph-guide.md)** - AI工作流编排
- **[TRA配置管理](./docs/technical/tra-configuration-guide.md)** - TypeScript Resource API配置系统
- **[文件组织](./docs/technical/index-files-guide.md)** - 项目模块化结构

### 💭 设计哲学
- **[Seele Felix核心哲学](./docs/philosophy/seele-felix-core-philosophy.md)** - 核心理念体系
- **[Lady Sion哲学](./docs/philosophy/lady-sion-philosophy.md)** - 设计哲学和理念
- **[哲学总结](./docs/philosophy/summary.md)** - 哲学文档总结

### 🎯 战略规划
- **[愿景使命](./docs/strategic/vision-mission.md)** - 项目愿景和核心使命
- **[系统概览](./docs/strategic/system-overview.md)** - 高层次系统设计

### 🎨 设计文档
- **[UI设计规范](./docs/design/ui-design.md)** - SillyTavern风格指南

### 📖 其他文档
- **[API文档](./docs/api/)** - 🔄 规划中
- **[部署指南](./docs/deployment/)** - 🔄 规划中
- **[测试指南](./docs/testing/)** - 🔄 规划中

> 💡 **提示**: 建议从 **[文档中心](./docs/README.md)** 开始，获取完整的导航和索引。

## 🛠️ 技术栈

**前端**: Vue 3, TypeScript, Element Plus, Vite  
**后端**: Node.js, Express, TypeScript, SQLite  
**AI集成**: OpenRouter, LangGraph, 多模型支持  
**架构**: 领域驱动设计(DDD), 清洁架构  

## 🤝 贡献指南

我们欢迎社区贡献！请参考：
- [项目文档中心](./docs/README.md) - 完整的项目文档体系
- [快速开始指南](./docs/guides/quick-start.md) - 开发环境搭建
- [代码质量规范](./docs/guides/eslint-setup.md) - 代码规范和工具配置

## 📄 许可证

NO LIENSE 
任何贡献者都可以获取此项目的授权，非贡献者禁止使用，不惜一切代价追究非授权者的使用！包括但不限于法律，暴力甚至谋杀！

## 🙏 致谢

- [SillyTavern](https://github.com/SillyTavern/SillyTavern) - 界面设计灵感
- [《eden*》](https://zh.wikipedia.org/wiki/Eden*) - Sion角色设计来源
- Vue.js, Element Plus, Node.js 等开源项目

---

**🎯 核心理念**: 创造一个介于纯AI助手与理想化智能体之间的过渡形态，探索AI的人格化表达和深度协作能力。

📚 **[查看完整文档](./docs/README.md)** | 🚀 **[快速开始](./docs/guides/quick-start.md)** | 🏗️ **[架构设计](./docs/architecture/)** | 💭 **[设计哲学](./docs/philosophy/lady-sion-philosophy.md)** 