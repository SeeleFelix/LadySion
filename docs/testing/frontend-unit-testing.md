# 前端单元测试规范

## 📋 概述

本文档定义Lady Sion项目前端代码的单元测试标准，确保测试代码的一致性和可维护性。

## 🛠️ 测试工具栈

### 核心测试框架

- **Vitest** - 测试运行器和断言库
- **@vue/test-utils** - Vue组件测试工具
- **jsdom** - DOM模拟环境

### 模拟工具

- **vi.mock()** - 模块模拟
- **vi.fn()** - 函数模拟
- **vi.spyOn()** - 方法监听

## 📁 文件结构和命名

### 测试文件命名约定

- **单元测试文件**：`*.test.ts`（Vitest标准）
- **测试目录**：`__tests__/` 或与源文件同级
- **测试助手**：`test/helpers/` 目录

### 目录结构示例

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatMessage.vue
│   │   └── ChatMessage.test.ts
│   └── common/
│       └── __tests__/
│           └── BaseButton.test.ts
├── service-client/
│   ├── createServiceClient.ts
│   └── __tests__/
│       └── service-client.test.ts
└── test/
    └── helpers/
        ├── mockResponse.ts
        └── setup.ts
```

## 🧪 测试命名规范

### describe块命名

```typescript
// 描述被测试的功能模块
describe("前端服务客户端", () => {
  // 按功能分组
  describe("when creating service client", () => {
    // 具体测试场景
  });
});
```

### it块命名规则

使用 **should + 动词 + 期望结果 + when + 触发条件** 格式：

```typescript
it("should create service proxy when given valid service class", () => {});
it("should send POST request when calling HTTP method", () => {});
it("should handle network error when fetch fails", () => {});
it("should establish SSE connection when calling stream method", () => {});
```

## 🔧 测试分类和策略

### 1. 纯函数测试

测试无副作用的工具函数：

```typescript
describe("工具函数", () => {
  describe("formatDate", () => {
    it("should format date to YYYY-MM-DD when given valid date", () => {
      const result = formatDate(new Date("2024-01-15"));
      expect(result).toBe("2024-01-15");
    });
  });
});
```

### 2. 组件单元测试

测试Vue组件的逻辑和渲染：

```typescript
describe("ChatMessage组件", () => {
  it("should render message content when message prop is provided", () => {
    const wrapper = mount(ChatMessage, {
      props: { message: { content: "Hello", sender: "user" } },
    });
    expect(wrapper.text()).toContain("Hello");
  });
});
```

### 3. 服务类测试

测试业务逻辑和API调用：

```typescript
describe("ChatService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call API with correct parameters when sending message", async () => {
    vi.mocked(fetch).mockResolvedValue(createMockResponse({ success: true }));

    await chatService.sendMessage("hello");

    expect(fetch).toHaveBeenCalledWith("/api/chat/send", {
      method: "POST",
      body: JSON.stringify({ message: "hello" }),
    });
  });
});
```

## 📋 测试模式和模板

### 1. AAA模式（推荐）

每个测试分为三个部分：

```typescript
it("should return user data when login succeeds", async () => {
  // Arrange - 准备测试数据
  const mockUser = { id: 1, name: "Test User" };
  vi.mocked(authService.login).mockResolvedValue(mockUser);

  // Act - 执行被测试的操作
  const result = await userStore.login("user", "pass");

  // Assert - 验证结果
  expect(result).toEqual(mockUser);
  expect(authService.login).toHaveBeenCalledWith("user", "pass");
});
```

### 2. 异步测试模板

```typescript
it("should handle async operation correctly", async () => {
  const promise = asyncFunction();

  // 可以测试loading状态
  expect(store.loading).toBe(true);

  const result = await promise;

  // 测试最终结果
  expect(result).toBeDefined();
  expect(store.loading).toBe(false);
});
```

### 3. 错误处理测试模板

```typescript
it("should handle error when network request fails", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

  const result = await service.getData();

  expect(result.success).toBe(false);
  expect(result.error).toBe("Network error");
});
```

## 🎯 Mock策略

### 1. HTTP请求Mock

```typescript
// 测试助手函数
export const createMockSuccessResponse = <T>(data: T) => ({
  success: true,
  data,
  timestamp: new Date(),
});

export const createMockErrorResponse = (error: string) => ({
  success: false,
  error,
  timestamp: new Date(),
});

export const createMockFetchResponse = (data: any) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
```

### 2. 全局Mock设置

```typescript
// test/setup.ts
import { vi } from "vitest";

// Mock全局对象
global.fetch = vi.fn();
global.EventSource = vi.fn();

// Mock浏览器API
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
});
```

### 3. 模块Mock

```typescript
// Mock整个模块
vi.mock("@/services/api", () => ({
  chatService: {
    sendMessage: vi.fn(),
    getHistory: vi.fn(),
  },
}));

// Mock特定导出
vi.mock("@/utils/storage", async () => {
  const actual = await vi.importActual("@/utils/storage");
  return {
    ...actual,
    saveToStorage: vi.fn(),
  };
});
```

## ✅ 测试编写检查清单

### 测试前检查

- [ ] 确定被测试的功能边界
- [ ] 识别所有输入和输出
- [ ] 列出需要测试的场景（正常、异常、边界）
- [ ] 确定需要Mock的依赖

### 测试代码检查

- [ ] 测试名称清晰描述行为
- [ ] 遵循AAA模式
- [ ] Mock设置合理
- [ ] 断言充分且必要
- [ ] 测试之间相互独立

### 测试运行检查

- [ ] 所有测试通过
- [ ] 没有控制台错误或警告
- [ ] 测试覆盖率达到要求
- [ ] 测试运行速度合理

## 🚫 测试反模式

### 避免的做法

```typescript
// ❌ 测试实现细节
it("should call private method", () => {
  const spy = vi.spyOn(component, "_privateMethod");
  component.publicMethod();
  expect(spy).toHaveBeenCalled();
});

// ❌ 测试过于复杂
it("should handle complex workflow", async () => {
  // 50行的测试代码...
});

// ❌ 测试之间相互依赖
let sharedState: any;
it("should setup state", () => {
  sharedState = setupSomething();
});
it("should use shared state", () => {
  expect(sharedState).toBeDefined(); // 依赖上个测试
});
```

### 推荐的做法

```typescript
// ✅ 测试行为而非实现
it("should show loading spinner when fetching data", () => {
  component.fetchData();
  expect(component.isLoading).toBe(true);
});

// ✅ 测试简洁专注
it("should format currency correctly", () => {
  expect(formatCurrency(1234.56)).toBe("¥1,234.56");
});

// ✅ 每个测试独立
beforeEach(() => {
  component = createComponent();
});
```

## 📊 覆盖率要求

### 目标覆盖率

- **语句覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 75%
- **函数覆盖率**: ≥ 85%

### 豁免情况

- 第三方库集成代码
- 配置文件
- 类型定义文件

## 🔄 更新记录

- 2024-12-26: 创建前端单元测试规范文档
