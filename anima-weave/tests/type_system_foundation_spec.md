# 动态图执行器 - 类型系统基础测试规范

## 📋 测试哲学理念

**核心信念**: "类型是计算的基础" - 严谨的语义类型系统 + TypeScript的动态执行优势

## 🎯 测试用例设计

### T1.1: 类型系统基础计算链验证 📝

**对应哲学文档**: AnimaWeave数学定义 - 定义1（数据类型集合𝒯） **验证的数学定义**:
`𝒯 = {Int, Bool, String, UUID, Signal, Prompt, ...}` (语义类型) **使用的基础元素**:
语义类型定义、品牌类型、JSON序列化

**测试场景**:

1. 执行包含基础语义类型的图: `Start → GetTimestamp → IsEven → FormatNumber`
2. 验证每个节点产生正确的语义类型输出: `basic.Signal`, `basic.Int`, `basic.Bool`, `basic.String`
3. 验证类型安全的数据流传递: 类型匹配检查
4. 验证终端输出过滤: 只保留未被消费的输出

**预期业务场景**:

- 时间戳获取 → 偶数判断 → 结果格式化的完整数据处理链
- 类似于数据ETL流水线中的类型安全转换

**验证要点**:

```typescript
// 语义类型定义
type Timestamp = number & { __brand: "basic.Int" };
type EvenCheckResult = boolean & { __brand: "basic.Bool" };
type FormattedText = string & { __brand: "basic.String" };

// 执行验证
const fateEcho = await awakening("./sanctums", "type_system_foundation");
// 状态: ExecutionStatus.Success
// 输出: 序列化的终端节点outputs，过滤掉中间数据
```

### T1.2: 组合类型验证 📝

**对应哲学文档**: AnimaWeave数学定义 - 组合类型定义 **验证的数学定义**:
`Prompt = {id: UUID, name: String, content: String}` (组合语义类型) **使用的基础元素**:
接口类型、品牌类型、对象序列化

**测试场景**:

1. 执行包含组合类型的图: `Start → GetTimestamp → CreatePrompt`
2. 验证Prompt对象的正确构造: 三个字段的类型和内容
3. 验证组合类型的JSON序列化: 保持结构完整性

**预期业务场景**:

- AI提示词生成：基于时间戳创建结构化的提示词对象
- 文档模板生成：组合多个字段创建复杂业务对象

**验证要点**:

```typescript
// 组合语义类型定义
interface Prompt {
  readonly __brand: "basic.Prompt";
  readonly id: string & { __brand: "basic.UUID" };
  readonly name: string & { __brand: "basic.String" };
  readonly content: string & { __brand: "basic.String" };
}

// 执行验证
const fateEcho = await awakening("./sanctums", "composite_type_test");
// 验证Prompt对象的完整结构和字段类型
```

### T1.3: 类型安全约束验证 🚧

**对应哲学文档**: AnimaWeave数学定义 - 类型兼容性关系Γ **验证的数学定义**: 不兼容类型连接应该被拒绝
**使用的基础元素**: 类型检查器、错误处理、执行状态

**测试场景**:

1. 创建故意类型不匹配的图定义
2. 验证系统检测到类型错误
3. 验证返回Error状态而不是Success

**预期业务场景**:

- 开发时的类型安全保障
- 防止运行时的数据类型错误

**验证要点**:

```typescript
// 错误的类型连接示例
// Prompt → IsEven (应该被拒绝)
const fateEcho = await awakening("./sanctums", "type_mismatch_test");
// 状态: ExecutionStatus.Error
// 错误信息: 包含类型不匹配的描述
```

## 🔄 实现状态

- T1.1: 🚧 设计中 → 需要实现基础语义类型系统
- T1.2: 📝 待开始 → 需要实现组合类型支持
- T1.3: 📝 待开始 → 需要实现类型检查器

## 📚 相关文档

- [AnimaWeave数学定义](../AnimaWeave/anima-weave-mathematica-definition.md)
- [Rust版本测试参考](../AnimaWeave/tests/type_system_foundation_test.rs)
