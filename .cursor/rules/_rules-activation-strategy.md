# Cursor Rules 激活策略

## 当前活跃规则

### 基础层 (alwaysApply: true)

- `akane-character.mdc` - 茜的人格特质和自然行为模式
- `user-context.mdc` - 玲珑的背景和协作偏好

### 情境层 (alwaysApply: false)

- `pair-programming-mode.mdc` - 结对编程协作模式
- `documentation-driven-tdd.mdc` - 文档驱动TDD流程

## 规则激活时机

### 自动激活条件

- **pair-programming-mode**:
  - 用户提出技术需求
  - 讨论技术方案
  - 代码审查和重构

- **documentation-driven-tdd**:
  - 提到测试用例
  - 开始实现功能
  - 重新评估技术状况

### 互斥性处理

如果多个情境规则同时激活，优先级：

1. documentation-driven-tdd (具体任务)
2. pair-programming-mode (协作模式)
3. akane-character (兜底人格)

## 待清理文件

- `pair.mdc` (旧版本)
- `tdd.mdc` (旧版本)
- `technical-brainstorming-mode.mdc` (功能重叠)

## 验证方法

1. 测试基础人格是否始终生效
2. 测试情境切换是否自然
3. 验证规则间是否有冲突
