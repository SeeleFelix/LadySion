# Lady Sion 快速开始指南

## 🚀 5分钟快速体验

### 前置要求
- Node.js 18+ 
- npm 或 yarn
- Git

### 快速启动
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
# 终端1 - 启动后端
cd server && npm run dev

# 终端2 - 启动前端  
cd client && npm run dev

# 5. 访问应用
# 打开浏览器访问 http://localhost:5173
```

## 📋 详细安装步骤

### 1. 环境准备

**检查Node.js版本**:
```bash
node --version  # 应该 >= 18.0.0
npm --version   # 应该 >= 8.0.0
```

**安装推荐工具**:
- [VSCode](https://code.visualstudio.com/) - 推荐的开发环境
- [Vue DevTools](https://devtools.vuejs.org/) - Vue开发工具
- [Postman](https://www.postman.com/) - API测试工具

### 2. 项目配置

**环境变量配置**:
```bash
# .env 文件配置示例
# 数据库配置
DATABASE_URL="sqlite:./dev.db"

# OpenRouter API配置  
OPENROUTER_API_KEY="your_openrouter_api_key"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"

# 服务器配置
PORT=3000
NODE_ENV=development

# 跨域配置
CORS_ORIGIN="http://localhost:5173"
```

**获取API密钥**:
1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册账号并获取API密钥
3. 将密钥添加到`.env`文件

### 3. 启动开发环境

**方式一：分别启动（推荐）**
```bash
# 终端1 - 后端开发服务器
cd server
npm install
npm run dev

# 终端2 - 前端开发服务器  
cd client
npm install
npm run dev
```

**方式二：并发启动**
```bash
# 根目录执行（需要安装concurrently）
npm run dev
```

### 4. 验证安装

**检查后端服务**:
```bash
curl http://localhost:3000/api/health
# 期望返回: {"status": "ok", "timestamp": "..."}
```

**检查前端服务**:
- 打开浏览器访问 `http://localhost:5173`
- 应该看到Lady Sion的主界面

## 🎯 核心功能体验

### 1. 基础聊天功能
1. 在主界面中央的聊天区域
2. 在输入框中输入消息
3. 点击发送或按Enter键
4. 观察AI响应的生成过程

### 2. 角色切换
1. 在右侧角色面板选择不同角色
2. 观察聊天界面的变化
3. 体验不同角色的对话风格

### 3. 预设配置
1. 在左侧AI配置面板
2. 调整温度、最大令牌数等参数
3. 尝试不同的预设模板
4. 观察对AI回复的影响

## 🛠️ 开发工具配置

### VSCode推荐扩展
```json
{
  "recommendations": [
    "vue.volar",                    // Vue 3支持
    "bradlc.vscode-tailwindcss",   // Tailwind CSS
    "esbenp.prettier-vscode",      // 代码格式化
    "dbaeumer.vscode-eslint",      // ESLint
    "ms-vscode.vscode-typescript", // TypeScript
    "formulahendry.auto-rename-tag" // HTML标签自动重命名
  ]
}
```

### VSCode设置
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Git配置
```bash
# 配置用户信息
git config user.name "你的姓名"
git config user.email "你的邮箱"

# 配置提交模板
git config commit.template .gitmessage

# 启用自动换行转换
git config core.autocrlf input  # Linux/Mac
git config core.autocrlf true   # Windows
```

## 🎯 项目结构速览

### 前端结构 (web/)
```
web/src/
├── components/      # 组件库
├── views/          # 页面视图
├── stores/         # Pinia状态管理
├── composables/    # 组合式API
├── services/       # API服务层
├── types/          # TypeScript类型
├── utils/          # 工具函数
├── router/         # 路由配置
├── assets/         # 静态资源
└── styles/         # 样式文件
```

### 后端结构 (server/)
```
server/src/
├── presentation/     # 表现层（控制器、路由）
├── application/      # 应用层（用例、服务）
├── domain/          # 领域层（实体、服务）
├── infrastructure/  # 基础设施层（数据库、外部API）
└── shared/          # 共享工具
```

## 🎨 开发规范速览

### 代码规范
- **TypeScript**: 强类型，减少运行时错误
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Conventional Commits**: 规范化提交信息

### 命名规范
- **文件**: kebab-case (`user-profile.vue`)
- **组件**: PascalCase (`UserProfile`)
- **变量/函数**: camelCase (`userName`)
- **常量**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### 提交规范
```bash
# 格式: type(scope): description
feat(chat): 添加流式响应支持
fix(ui): 修复侧边栏折叠问题
docs(readme): 更新安装指南
```

## 🚨 常见问题

### 端口冲突
```bash
# 如果端口被占用，可以修改端口
# 前端: web/vite.config.ts
server: {
  port: 5174  // 修改为其他端口
}

# 后端: server/.env
PORT=3001  # 修改为其他端口
```

### 依赖安装失败
```bash
# 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 或使用yarn
yarn cache clean
rm -rf node_modules yarn.lock
yarn install
```

### API连接失败
1. 检查`.env`文件中的API密钥是否正确
2. 确认网络连接正常
3. 检查OpenRouter服务状态
4. 查看浏览器控制台和服务器日志

### 热重载不工作
```bash
# 确保文件监听正常
# 在WSL环境下可能需要配置
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 📖 下一步学习

完成快速开始后，建议继续学习：

1. **架构理解**: 阅读[后端架构](../architecture/backend.md)和[前端架构](../architecture/frontend.md)
2. **开发指南**: 查看[开发环境配置](./development-setup.md)和[代码规范](./coding-standards.md)
3. **技术文档**: 了解[OpenRouter集成](../technical/openrouter-guide.md)等技术细节
4. **API文档**: 熟悉[REST API](../api/rest-api.md)接口

## 🎯 快速任务

尝试完成这些简单任务来熟悉项目：

### 初级任务
- [ ] 修改默认欢迎消息
- [ ] 更改主题色彩
- [ ] 添加一个新的快捷回复

### 中级任务  
- [ ] 创建一个新的角色
- [ ] 添加消息导出功能
- [ ] 实现简单的消息搜索

### 高级任务
- [ ] 集成新的AI模型
- [ ] 添加语音输入功能
- [ ] 实现多语言支持

---

🎉 **恭喜！** 你已经成功启动了Lady Sion项目。开始你的开发之旅吧！

如有问题，请查看[常见问题解答](../troubleshooting.md)或在GitHub上提交Issue。 