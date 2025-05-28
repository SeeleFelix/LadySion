# ESLint设置指南

本指南帮助您在前端和后端项目中设置ESLint来防止barrel文件相关问题。

## 🔧 前端（Vue3 + TypeScript）设置

### 1. 安装依赖
```bash
cd client
npm install --save-dev \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  @vue/eslint-config-typescript \
  @vue/eslint-config-prettier \
  eslint-plugin-vue \
  eslint-plugin-import
```

### 2. 更新package.json脚本
在 `client/package.json` 中添加：
```json
{
  "scripts": {
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore",
    "lint:check": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --ignore-path .gitignore"
  }
}
```

### 3. 创建.eslintignore
```bash
# client/.eslintignore
dist
node_modules
*.local
.DS_Store
coverage
```

## 🔧 后端（Node.js + TypeScript）设置

### 1. 安装依赖
```bash
cd server
npm install --save-dev \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-import
```

### 2. 更新package.json脚本
在 `server/package.json` 中添加：
```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx --fix --ignore-path .gitignore",
    "lint:check": "eslint . --ext .js,.jsx,.ts,.tsx --ignore-path .gitignore"
  }
}
```

### 3. 创建.eslintignore
```bash
# server/.eslintignore
dist
node_modules
*.local
.DS_Store
coverage
data
```

## 🚀 使用方法

### 检查代码
```bash
# 前端
cd client && npm run lint:check

# 后端  
cd server && npm run lint:check
```

### 自动修复
```bash
# 前端
cd client && npm run lint

# 后端
cd server && npm run lint
```

## 🎯 主要规则说明

### 1. 防止循环依赖
```javascript
'import/no-cycle': 'error'
```
这个规则会检测模块之间的循环依赖，这是barrel文件常见的问题。

### 2. 限制export *
```javascript
'no-restricted-syntax': [
  'error',
  {
    selector: 'ExportAllDeclaration',
    message: '避免使用 export * 语法，请使用具名导出'
  }
]
```
这个规则强制使用具名导出而不是`export *`。

## 🔧 IDE集成

### VS Code
安装ESLint扩展：
```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "Vue.volar"
  ]
}
```

### 设置自动修复：
```json
// .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "typescript",
    "vue"
  ]
}
```

## 📋 检查清单

- [ ] 前端ESLint配置已创建
- [ ] 后端ESLint配置已创建  
- [ ] 依赖已安装
- [ ] 脚本已添加到package.json
- [ ] .eslintignore文件已创建
- [ ] IDE扩展已安装
- [ ] 团队成员已了解新规则

## 🎉 完成！

现在您的项目已经配置了ESLint来防止barrel文件相关问题。这将帮助维护代码质量和性能。 