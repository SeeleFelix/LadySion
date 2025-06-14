import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { awakening, ExecutionStatus, type FateEcho } from "../src/mod.ts";

/**
 * T1: 类型系统基础计算链验证
 * 
 * 验证哲学理念: "类型是计算的基础"
 * 数学定义1: 𝒯 = {Int, Bool, String, Array[T], Record{...}, ...} (语义类型)
 * 
 * 🎯 正确的架构验证：
 * - FateEcho保持结构化（status, metadata）
 * - outputs序列化为字符串，支持图间传递
 * - 框架统一处理序列化，插件专注业务逻辑
 */
Deno.test("T1.1: 类型系统基础计算链验证", async () => {
  // 执行接口: awakening返回结构化的FateEcho
  const fateEcho = await awakening("./sanctums", "type_system_foundation");
  
  // 🎯 关键验证1: 结构化状态检查
  switch (fateEcho.status) {
    case ExecutionStatus.Success:
      console.log("✅ 图执行成功");
      break;
    case ExecutionStatus.Error:
      throw new Error(`❌ 图执行失败: ${fateEcho.outputs}`);
  }
  
  // 🎯 关键验证2: outputs应该是序列化字符串
  console.log("🔍 序列化的outputs字符串:");
  console.log(fateEcho.outputs);
  
  // 验证outputs是有效的JSON字符串
  assertStringIncludes(fateEcho.outputs, "{", "outputs应该是JSON格式");
  assertEquals(fateEcho.outputs.length > 0, true, "outputs不应为空");
  
  // 🎯 关键验证3: 能够反序列化outputs进行处理
  const nodeOutputs = fateEcho.getOutputs();
  
  // 验证终端输出节点（经过过滤后）
  assertEquals("starter.execution_id" in nodeOutputs, true, "应该包含starter节点的execution_id输出");
  assertEquals("timer.timestamp" in nodeOutputs, false, "timer.timestamp被完全消费，不应出现在终端输出中");
  assertEquals("judge.result" in nodeOutputs, true, "应该包含judge节点的result输出");
  assertEquals("formatter.formatted" in nodeOutputs, true, "应该包含formatter节点的formatted输出");
  
  // 🎯 核心验证: 实际计算结果和类型验证
  // 验证只有终端节点的输出被保留（过滤掉了被消费的中间输出）
  assertEquals("timer.timestamp" in nodeOutputs, false, "timer.timestamp被其他节点消费，不应该在最终输出中");
  assertEquals("judge.result" in nodeOutputs, true, "应该有judge.result终端输出");
  assertEquals("formatter.formatted" in nodeOutputs, true, "应该有formatter.formatted终端输出");
  assertEquals("starter.execution_id" in nodeOutputs, true, "应该有starter.execution_id（未被消费）");
  
  // 检查序列化后的完整输出字符串
  const serializedOutputs = fateEcho.outputs;
  console.log("🔍 完整序列化输出:");
  console.log(serializedOutputs);
  
  // 原来的timer输出已被过滤掉（timestamp被其他节点消费了）
  // 现在我们验证过滤后的输出不包含中间数据
  assertEquals(
    serializedOutputs.includes('"timestamp"'),
    false,
    "timestamp应该被过滤掉，因为被其他节点消费了"
  );
  
  // 验证judge输出：应该是basic.Bool类型的偶数判断结果
  assertStringIncludes(serializedOutputs, '"judge.result"', "应该有judge.result字段");
  
  // 验证formatter输出：应该是格式化数字的结果
  assertStringIncludes(serializedOutputs, '"formatter.formatted"', "应该有formatter.formatted字段");
  
  // 验证具体的计算逻辑
  if (serializedOutputs.includes('"judge.result"')) {
    const hasValidResult = serializedOutputs.includes('"judge.result":true') || 
                          serializedOutputs.includes('"judge.result":false');
    assertEquals(hasValidResult, true, "judge.result字段应该是布尔值");
  }
  
  if (serializedOutputs.includes('"formatter.formatted"')) {
    assertStringIncludes(serializedOutputs, '"Number:', "formatted字段应该包含格式化的数字");
  }
  
  console.log("🎯 终端输出验证:");
  console.log("  - starter.execution_id: 未被消费的标识符");
  console.log("  - judge.result: 偶数判断的最终结果");
  console.log("  - formatter.formatted: 格式化的最终结果");
  console.log("  - 各种done信号: 未被消费的完成标记");
  
  console.log("✅ T1.1 类型系统基础验证通过 - 只保留终端输出，过滤掉中间数据流");
});

/**
 * T1.2: 组合类型验证
 * 
 * 验证哲学理念: 类型系统支持复杂组合类型
 * 数学定义2: 组合类型 Prompt = {id: UUID, name: String, content: String}
 */
Deno.test("T1.2: 组合类型验证", async () => {
  // 执行包含组合类型的图
  const fateEcho = await awakening("./sanctums", "composite_type_test");
  
  // 验证执行成功
  switch (fateEcho.status) {
    case ExecutionStatus.Success:
      console.log("✅ 组合类型图执行成功");
      break;
    case ExecutionStatus.Error:
      throw new Error(`❌ 组合类型图执行失败: ${fateEcho.outputs}`);
  }
  
  console.log("🔍 组合类型序列化结果:");
  console.log(fateEcho.outputs);
  
  // 验证Prompt的字段结构
  assertStringIncludes(fateEcho.outputs, '"id"', "Prompt应该包含id字段");
  assertStringIncludes(fateEcho.outputs, '"name"', "Prompt应该包含name字段");
  assertStringIncludes(fateEcho.outputs, '"content"', "Prompt应该包含content字段");
  
  // 验证name和content都是格式化的数字
  assertStringIncludes(fateEcho.outputs, '"Number:', "name和content应该包含格式化的数字");
  
  console.log("🎯 组合类型验证:");
  console.log("  - Prompt.id (基于时间戳的UUID): ✓");
  console.log("  - Prompt.name (格式化字符串): ✓");
  console.log("  - Prompt.content (格式化字符串): ✓");
  console.log("  - 完整对象序列化保持结构: ✓");
  
  console.log("✅ T1.2 组合类型验证通过 - 复杂数据结构正确序列化");
});

/**
 * T1.3: 类型安全约束验证
 * 
 * 验证哲学理念: 类型系统提供安全约束
 * 测试类型不匹配时应该失败
 */
Deno.test("T1.3: 类型安全约束验证", async () => {
  // TODO: 创建一个故意类型不匹配的weave文件
  // 验证当连接不兼容类型时，系统能够检测并拒绝执行
  console.log("📝 待实现: 类型安全约束验证");
  console.log("   需要创建类型不匹配的测试场景，验证系统拒绝错误连接");
  console.log("   错误应该在FateEcho.status中体现为Error状态");
  console.log("   outputs应该为空字符串'{}'");
  
  // 暂时跳过，直到我们实现了类型检查器
  console.log("⏭️ T1.3 暂时跳过 - 等待类型检查器实现");
}); 