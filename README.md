# LadySion - SillyTavern风格聊天界面

## 项目简介

LadySion是一个完全重新设计的聊天应用，采用了SillyTavern的界面风格和设计理念。项目包含Vue.js前端和Node.js后端，实现了现代化的AI聊天体验。

## 主要特性

### 🎨 SillyTavern风格界面
- **深色玻璃形态主题**：使用`backdrop-filter: blur()`实现模糊效果
- **三栏布局设计**：左侧AI配置面板 + 中央聊天区 + 右侧角色面板
- **可折叠侧边栏**：支持动态显示/隐藏侧边栏
- **完整CSS变量系统**：支持动态主题切换
- **现代化动画效果**：丰富的交互动画和过渡效果

### 💬 聊天功能
- **多角色支持**：可选择不同AI角色进行对话
- **消息管理**：支持编辑、删除、重新生成消息
- **实时生成**：支持流式响应和生成控制
- **聊天导出**：支持导出聊天记录为JSON格式

### ⚙️ AI配置系统
- **预设管理**：完整的预设系统，支持导入/导出
- **参数调节**：温度、最大令牌数、Top P等参数控制
- **多种预设类型**：指令模式、上下文模板、系统提示词等

### 👥 角色管理
- **角色切换**：快速切换不同AI角色
- **角色展示**：头像、描述、个性展示
- **角色管理**：添加、编辑、删除角色

## 技术栈

### 前端
- **Vue 3** + **TypeScript**：现代化前端框架
- **Element Plus**：UI组件库（深度定制SillyTavern主题）
- **Font Awesome**：图标库
- **自定义CSS主题**：完整的SillyTavern风格主题系统

### 后端
- **Node.js** + **TypeScript**：服务端环境
- **Express.js**：Web框架
- **SQLite**：轻量级数据库
- **领域驱动设计（DDD）**：清洁架构模式

## 项目结构

```
LadySion/
├── client/                     # 前端Vue应用
│   ├── src/
│   │   ├── views/
│   │   │   └── HomeView.vue    # SillyTavern风格主界面
│   │   ├── styles/
│   │   │   └── silly-tavern-theme.css  # 完整主题系统
│   │   └── main.ts             # 应用入口
│   └── index.html              # 页面模板
├── server/                     # 后端Node应用
│   ├── src/
│   │   ├── api/                # API路由层
│   │   ├── domain/             # 领域层
│   │   ├── infrastructure/     # 基础设施层
│   │   └── index.ts            # 服务器入口
│   └── package.json
└── SillyTavern/               # SillyTavern源码参考
```

## 安装和运行

### 环境要求
- Node.js 16+
- npm或yarn

### 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 启动开发服务器

```bash
# 启动后端服务器（端口3000）
cd server
npm run dev

# 启动前端开发服务器（端口5173）
cd ../client
npm run dev
```

### 访问应用
打开浏览器访问：http://localhost:5173

## 界面展示

### 主界面特性
- **左侧面板**：AI配置、预设选择、生成参数调节
- **中央聊天区**：角色信息、消息历史、输入框
- **右侧面板**：当前角色详情、角色列表、角色管理

### 主题特点
- 深色背景色：`rgb(36, 36, 37)`（SillyTavern经典配色）
- 玻璃形态效果：`backdrop-filter: blur(10px)`
- CSS变量系统：支持动态主题定制
- 响应式设计：适配移动端和桌面端

## 开发特性

### SillyTavern主题系统
完整实现了SillyTavern的设计理念：
- CSS变量系统
- 玻璃形态效果
- 深色主题配色
- 交互动画效果
- Element Plus组件定制

### 预设管理系统
基于SillyTavern的预设架构：
- 指令模式预设
- 上下文模板预设
- 系统提示词预设
- 宏系统支持
- 导入导出功能

### 角色系统
- 多角色支持
- 角色个性化设置
- 头像和描述管理
- 角色切换功能

## API接口

### 聊天接口
- `POST /api/chat` - 发送消息

### 预设接口
- `GET /api/presets/:type` - 获取预设列表
- `POST /api/presets/:type` - 创建预设
- `PUT /api/presets/:type/:id` - 更新预设
- `DELETE /api/presets/:type/:id` - 删除预设

### 调试接口
- `GET /api/debug/routes` - 查看所有路由

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License

## 致谢

- [SillyTavern](https://github.com/SillyTavern/SillyTavern) - 界面设计灵感来源
- [Vue.js](https://vuejs.org/) - 前端框架
- [Element Plus](https://element-plus.org/) - UI组件库
- [Font Awesome](https://fontawesome.com/) - 图标库

---

**注意**：本项目是对SillyTavern界面风格的重新实现，不是SillyTavern的分支或修改版本。 