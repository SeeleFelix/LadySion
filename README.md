# 简易聊天应用

这是一个简单的聊天应用，使用Vue.js作为前端，Node.js + Express作为后端，并通过OpenRouter API调用大型语言模型。

## 功能特点

- 简洁的聊天界面
- 支持流式响应，实时显示AI回复
- 只需调用OpenRouter API，无需其他复杂设置

## 开始使用

### 前提条件

- Node.js (推荐 v16+)
- 一个OpenRouter API密钥

### 安装

1. 克隆仓库：

```bash
git clone <repository-url>
cd <repository-name>
```

2. 安装依赖：

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

3. 配置环境变量：

编辑 `server/.env` 文件，设置你的OpenRouter API密钥：

```
# OpenRouter API 密钥
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenRouter 模型名称 (推荐使用Claude 3.5 Sonnet)
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# 服务器端口
PORT=3000
```

### 运行

1. 启动后端服务器：

```bash
cd server
npm run dev
```

2. 在另一个终端启动前端开发服务器：

```bash
cd client
npm run dev
```

3. 在浏览器中访问前端应用：

```
http://localhost:5173
```

## 构建生产版本

1. 构建前端：

```bash
cd client
npm run build
```

2. 构建后端：

```bash
cd server
npm run build
```

3. 运行生产版本：

```bash
cd server
npm run start
```

## 技术栈

- 前端：Vue 3、TypeScript
- 后端：Node.js、Express
- API：OpenRouter (提供对多种LLM的访问)

## 许可

此项目采用MIT许可 - 详情请查看LICENSE文件 