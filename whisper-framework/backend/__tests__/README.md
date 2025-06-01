# 🧪 Whisper 后端框架测试

## 📋 测试概览

这里包含了 Whisper 后端框架的完整测试套件，验证框架的核心功能、异常处理和实际使用场景。

## 🎯 测试文件说明

### 1. `whisper-backend.test.ts` - 核心框架测试
验证 Whisper 后端框架的核心组件：

- **🔍 SeekerRegistry** - Seeker 注册和方法发现
- **🚀 方法调用** - 反射调用和参数传递
- **✨ ResponseFormatter** - 响应格式化和错误处理
- **🎯 RequestDispatcher** - 请求分发和验证
- **🚨 异常处理** - OmenError、WrathError、普通异常
- **📋 请求验证** - 输入参数验证
- **🎭 路由生成** - 自动路由信息生成
- **📊 API 文档** - OpenAPI 格式文档生成

### 2. `oak-integration.test.ts` - Oak 框架集成测试
验证与 Oak HTTP 框架的集成：

- **🌳 OakAdapter** - Oak 适配器功能
- **🔮 setupWhisperRoutes** - 快速路由设置
- **🎯 错误处理** - HTTP 层面的错误处理
- **📋 请求解析** - HTTP 请求到 Whisper 上下文的转换
- **🎭 状态码映射** - Omen 状态码到 HTTP 状态码的映射

### 3. `usage-example.test.ts` - 真实使用场景测试
完整的业务系统实现示例：

- **👤 用户管理系统** - 完整的 CRUD 操作
- **🔍 搜索和过滤** - 复杂查询和分页
- **📊 统计信息** - 业务数据统计
- **🚨 业务异常** - 各种业务验证和异常处理
- **📝 文章管理** - 多实体关联操作

## 🚀 运行测试

### 运行所有后端测试
```bash
cd whisper-framework/backend
deno test --allow-all --no-check
```

### 运行特定测试文件
```bash
# 核心框架测试
deno test __tests__/whisper-backend.test.ts --allow-all --no-check

# Oak 集成测试
deno test __tests__/oak-integration.test.ts --allow-all --no-check

# 使用示例测试
deno test __tests__/usage-example.test.ts --allow-all --no-check
```

## ✅ 测试覆盖的功能

### 🔮 核心功能
- [x] Seeker 自动注册和方法发现
- [x] 反射方法调用
- [x] 请求参数解析和验证
- [x] 响应格式化（Grace 格式）
- [x] 错误分类处理（OmenError vs WrathError）
- [x] 自动路由生成
- [x] OpenAPI 文档生成

### 🌐 HTTP 集成
- [x] Oak 框架适配器
- [x] HTTP 请求解析
- [x] 状态码映射
- [x] 错误响应处理
- [x] 请求头处理
- [x] 客户端 IP 获取

### 📋 业务场景
- [x] CRUD 操作完整流程
- [x] 复杂查询和过滤
- [x] 分页处理
- [x] 多参数方法调用
- [x] 嵌套对象参数
- [x] 业务验证和异常
- [x] 跨实体操作

### 🚨 异常处理
- [x] 业务异常（OmenError）
- [x] 系统异常（WrathError）
- [x] 普通异常自动转换
- [x] 参数验证异常
- [x] 方法不存在异常
- [x] Seeker 不存在异常

## 🎯 测试结果示例

运行测试后，你会看到类似的输出：

```
running 10 tests from ./__tests__/whisper-backend.test.ts
🔍 SeekerRegistry - 注册和发现 Seeker ... ok
🚀 SeekerRegistry - 方法调用 ... ok  
✨ ResponseFormatter - 响应格式化 ... ok
🎯 RequestDispatcher - 请求分发和处理 ... ok
🚨 RequestDispatcher - 异常处理 ... ok
📋 RequestDispatcher - 请求验证 ... ok
🎭 RequestDispatcher - 路由信息生成 ... ok
📊 RequestDispatcher - API 文档生成 ... ok
🎯 综合测试 - 完整的 Whisper 流程 ... ok
🔧 参数验证测试 ... ok

ok | 10 passed | 0 failed
```

## 📝 如何添加新测试

### 1. 创建新的 Seeker 接口
```typescript
interface YourSeeker extends Seeker<YourEidolon> {
  yourMethod(param: string): Promise<YourEidolon>;
}
```

### 2. 实现 Seeker 服务
```typescript
class YourSeekerService implements YourSeeker, SeekerImplementation {
  async yourMethod(param: string): Promise<YourEidolon> {
    // 业务逻辑实现
    return { id: "1", data: param };
  }
}
```

### 3. 编写测试
```typescript
Deno.test("🧪 测试你的功能", async () => {
  const yourSeeker = new YourSeekerService();
  const result = await yourSeeker.yourMethod("test");
  assertEquals(result.data, "test");
});
```

## 🔧 调试技巧

### 查看详细错误信息
```bash
deno test --allow-all --no-check --fail-fast
```

### 运行特定测试
```bash
deno test --allow-all --no-check --filter "SeekerRegistry"
```

### 显示控制台输出
测试中的 `console.log` 会自动显示在 `output` 部分，帮助调试。

## 🎉 总结

Whisper 后端框架的测试确保了：

1. **🔮 框架核心稳定** - 所有核心组件都经过充分测试
2. **🌐 HTTP 集成可靠** - 与主流框架的集成经过验证
3. **📋 业务场景完整** - 真实使用场景得到验证
4. **🚨 异常处理健壮** - 各种异常情况都能正确处理

这些测试为 Whisper 后端框架提供了坚实的质量保障，确保开发者可以放心使用。 