# TDD驱动的Cursor编程规则

## 📋 概述

本文档基于Claude 4官方最佳实践、ThoughtWorks标准和XP(极限编程)原则，为Lady Sion项目提供测试驱动开发(TDD)的Cursor使用指导规则。

## 🎯 核心原则

### XP核心价值在TDD中的体现

基于Kent Beck的XP五大价值观：

1. **交流(Communication)** - 测试作为活文档，表达代码意图
2. **简单(Simplicity)** - 只写当前需要的最简单测试
3. **反馈(Feedback)** - 快速的红绿重构循环
4. **勇气(Courage)** - 有测试保护的重构信心
5. **尊重(Respect)** - 测试代码等同于生产代码的质量要求

## 🔄 TDD工作流程规则

### Red-Green-Refactor循环

**强制执行顺序**：

```
1. 🔴 Red - 写一个失败的测试
2. 🟢 Green - 写最少代码让测试通过  
3. 🔵 Refactor - 重构代码保持测试通过
```

### Cursor AI协作规则

#### ✅ 正确使用模式

```typescript
// 1. 先写测试 - 让AI帮助完善测试逻辑
describe("用户认证服务", () => {
  it("should return user token when login with valid credentials", async () => {
    // Arrange
    const credentials = { username: "user", password: "pass" };
    const expectedToken = "valid-jwt-token";
    
    // Act  
    const result = await authService.login(credentials);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.token).toBe(expectedToken);
  });
});

// 2. 然后让AI生成最小实现
class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    // AI生成的最小实现
    if (credentials.username === "user" && credentials.password === "pass") {
      return { success: true, token: "valid-jwt-token" };
    }
    return { success: false, error: "Invalid credentials" };
  }
}
```

#### ❌ 避免的反模式

```typescript
// 错误：让AI先写实现再补测试
// 这违反了TDD的基本原则

// 错误：接受AI删除测试让代码"通过"
// AI经常建议删除测试来解决失败，必须拒绝

// 错误：一次性要求AI生成完整功能
// 应该遵循小步骤迭代
```

## 🧪 测试层次和策略

### 测试金字塔 (ThoughtWorks标准)

```
    🔺 E2E Tests (少量)
   🔺🔺 Integration Tests (适中) 
  🔺🔺🔺 Unit Tests (大量)
```

#### 单元测试 (70%)
- **目标**: 快速反馈，设计指导
- **范围**: 纯函数、类方法、组件逻辑
- **速度**: < 10ms/测试

```typescript
// 示例：纯函数测试
describe("formatCurrency", () => {
  it("should format number to currency string with correct decimal places", () => {
    expect(formatCurrency(1234.56)).toBe("¥1,234.56");
  });
  
  it("should handle zero amount", () => {
    expect(formatCurrency(0)).toBe("¥0.00");
  });
});
```

#### 集成测试 (20%)
- **目标**: 验证组件协作
- **范围**: API调用、数据流、服务交互
- **速度**: < 100ms/测试

```typescript
// 示例：服务集成测试
describe("ChatService integration", () => {
  it("should successfully send message through API", async () => {
    const mockResponse = { id: "123", status: "sent" };
    vi.mocked(fetch).mockResolvedValue(createMockResponse(mockResponse));
    
    const result = await chatService.sendMessage("Hello");
    
    expect(result.id).toBe("123");
    expect(fetch).toHaveBeenCalledWith("/api/chat/send", expect.any(Object));
  });
});
```

#### E2E测试 (10%)
- **目标**: 用户关键流程验证
- **范围**: 完整用户旅程
- **速度**: < 5s/测试

## 📝 测试命名规范

### 描述块命名

```typescript
// 格式：功能模块名称
describe("用户认证模块", () => {
  describe("when user provides valid credentials", () => {
    describe("and 2FA is enabled", () => {
      // 嵌套描述具体场景
    });
  });
});
```

### 测试用例命名

```typescript
// 格式：should + 预期行为 + when + 触发条件
it("should return success result when user login with valid credentials", () => {});
it("should throw validation error when email format is invalid", () => {});
it("should cache result when fetching user profile succeeds", () => {});
```

## 🎯 AI辅助TDD最佳实践

### 与Cursor AI的协作模式

#### 1. 测试优先提示词

```
请帮我为 [功能描述] 写一个失败的单元测试。
要求：
- 使用 AAA 模式（Arrange, Act, Assert）
- 测试名称要清晰表达意图
- 只测试一个具体行为
- 不要生成实现代码
```

#### 2. 最小实现提示词

```
基于这个失败的测试，请生成最简单的实现代码让测试通过。
要求：
- 只实现让测试通过的最少代码
- 不要添加额外功能
- 保持代码简洁
```

#### 3. 重构指导提示词

```
测试已经通过，请帮我重构这段代码提高其质量。
要求：
- 保持所有测试通过
- 提高代码可读性
- 消除重复代码
- 改善设计模式
```

### AI Smells（ThoughtWorks定义的AI陷阱）防范

#### 1. 上下文污染 (Context Poisoning)
```typescript
// ❌ 避免：让AI基于旧的不良模式生成代码
// ✅ 正确：每次都明确指定当前的测试驱动需求
```

#### 2. 自动完成成瘾 (Auto-completion on Steroids)  
```typescript
// ❌ 避免：盲目接受AI的所有建议
// ✅ 正确：批判性思考每个AI建议是否符合TDD原则
```

#### 3. 自动化偏见 (Automation Bias)
```typescript
// ❌ 避免：认为AI生成的测试一定比手写的好
// ✅ 正确：AI是工具，测试设计思路仍需人工指导
```

#### 4. 沉没成本谬误 (Sunk Cost Fallacy)
```typescript
// ❌ 避免：因为AI生成了大量代码就不愿意删除重写
// ✅ 正确：遵循TDD原则，该删就删，该重写就重写
```

#### 5. 锚定效应 (Anchoring Effect)
```typescript
// ❌ 避免：被AI的第一个解决方案限制思路
// ✅ 正确：探索多种实现方式，选择最符合测试要求的
```

## 🛠️ 实用提示词模板

### 基础TDD提示词

```markdown
# 测试驱动开发提示词

## 写测试
作为TDD专家，请为 [具体功能] 编写一个失败的单元测试。
要求：
- 遵循 AAA 模式
- 测试名称使用 "should...when..." 格式
- 只关注一个具体行为
- 使用适当的断言库语法

## 最小实现
基于上述测试，请提供让测试通过的最简单实现：
- 只实现测试要求的功能
- 不添加额外复杂度
- 代码清晰易读

## 重构改进
测试通过后，请重构代码：
- 提取重复逻辑
- 改善命名
- 优化结构
- 确保测试依然通过
```

### 错误处理测试提示词

```markdown
# 错误处理TDD提示词

请为 [功能名称] 的错误处理编写测试用例：
- 网络请求失败场景
- 参数验证失败场景  
- 业务逻辑异常场景
- 每个场景都要有清晰的测试名称和断言
```

### 异步代码测试提示词

```markdown
# 异步TDD提示词

为 [异步功能] 编写测试：
- 使用 async/await 语法
- 测试成功和失败路径
- 验证loading状态变化
- 确保proper cleanup
```

## 🔍 代码质量检查清单

### 每次提交前检查

- [ ] 所有新功能都有对应的失败测试开始
- [ ] 测试名称清楚表达测试意图
- [ ] 实现代码只包含让测试通过的最少逻辑
- [ ] 重构后所有测试依然通过
- [ ] 测试运行时间合理（单元测试<10ms）
- [ ] 没有被跳过的测试（skip/only）

### AI协作质量检查

- [ ] 没有让AI删除测试来解决失败
- [ ] AI生成的代码符合TDD原则
- [ ] 人工Review了AI的测试设计思路
- [ ] AI生成的实现确实是最简单的
- [ ] 重构建议保持了测试的通过状态

## 🚫 严格禁止规则

### 绝对不允许的操作

1. **删除测试让代码通过** - 违反TDD基本原则
2. **跳过红色阶段** - 不写失败测试直接实现
3. **一次实现多个功能** - 违反小步骤原则
4. **实现超出测试要求的功能** - 违反YAGNI原则
5. **提交不通过的测试** - 破坏持续集成

### AI协作禁令

1. **不能让AI批量生成完整功能** - 必须遵循TDD循环
2. **不能接受AI删除测试的建议** - 即使为了让代码编译通过
3. **不能让AI跳过测试写实现** - 必须test-first
4. **不能盲目信任AI的测试设计** - 需要人工验证测试逻辑

## 📈 度量指标

### TDD质量指标

- **测试覆盖率**: >90% (但覆盖率不是唯一目标)
- **测试/生产代码比例**: 1:1 到 2:1 之间
- **测试运行时间**: 整个套件 <30秒
- **测试失败恢复时间**: <5分钟

### AI协作效果指标

- **AI建议采纳率**: 记录哪些AI建议被采用
- **TDD循环完整性**: 每个功能都经历完整的红绿重构
- **重构频率**: 绿色阶段后的重构执行率
- **测试先行率**: 实现前有测试的功能比例

## 🎓 学习资源推荐

### 必读经典
- Kent Beck: "Test Driven Development: By Example"
- Martin Fowler: "Refactoring" 
- ThoughtWorks: "Extreme Programming Explained"

### AI辅助TDD
- Anthropic Claude Code文档
- GitHub Copilot TDD最佳实践
- ThoughtWorks AI Smells指南

记住：TDD不仅仅是测试，更是一种设计方法。通过测试来驱动代码设计，通过AI来加速这个过程，但始终保持人工对设计决策的主导权。 