import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { awakening, ExecutionStatus, isStaticError, isRuntimeError, type FateEcho } from "../src/mod.ts";

/**
 * T1: 语义标签系统基础计算链验证
 *
 * 验证哲学理念: "语义标签是计算的基础"
 * 数学定义1: ℒ = {Int, Bool, String, Array[T], Record{...}, ...} (语义标签)
 *
 * 🎯 正确的架构验证：
 * - FateEcho保持结构化（status, metadata）
 * - outputs序列化为带语义标签的字符串，支持图间传递
 * - 框架统一处理语义标签序列化，插件专注业务逻辑
 */
Deno.test("T1.1: 语义标签系统基础计算链验证", async () => {
  // 执行接口: awakening返回结构化的FateEcho
  const fateEcho = await awakening("./sanctums", "type_system_foundation");

  // 🎯 关键验证1: 结构化状态检查
  assertEquals(fateEcho.status, ExecutionStatus.Success, "图执行应该成功");

  // 🎯 关键验证2: 直接解析JSON验证结构
  const outputsJson = JSON.parse(fateEcho.outputs);
  
  console.log("🔍 解析后的输出结构:");
  console.log(JSON.stringify(outputsJson, null, 2));

  // 验证必要的输出存在
  assertEquals("starter.execution_id" in outputsJson, true, "应该有execution_id输出");
  assertEquals("judge.result" in outputsJson, true, "应该有judge.result输出");
  assertEquals("formatter.formatted" in outputsJson, true, "应该有formatter.formatted输出");

  // 🎯 核心验证: 语义标签结构验证 - 直接检查JSON结构
  const executionId = outputsJson["starter.execution_id"];
  assertEquals(executionId.semantic_label, "basic.UUID", "execution_id语义标签应该是UUID");
  assertEquals(typeof executionId.value, "string", "UUID值应该是字符串");

  const judgeResult = outputsJson["judge.result"];
  assertEquals(judgeResult.semantic_label, "basic.Bool", "result语义标签应该是Bool");
  assertEquals(typeof judgeResult.value, "boolean", "Bool值应该是布尔类型");

  const formatted = outputsJson["formatter.formatted"];
  assertEquals(formatted.semantic_label, "basic.String", "formatted语义标签应该是String");
  assertEquals(typeof formatted.value, "string", "String值应该是字符串");

  console.log("🎯 语义标签验证通过:");
  console.log(`  - execution_id: ${executionId.semantic_label} ✓`);
  console.log(`  - judge.result: ${judgeResult.semantic_label} ✓`);
  console.log(`  - formatter.formatted: ${formatted.semantic_label} ✓`);

  console.log("✅ T1.1 语义标签系统基础验证通过");
});

/**
 * T1.2: 组合语义标签验证
 *
 * 验证哲学理念: 语义标签系统支持复杂组合类型
 * 数学定义2: 组合语义标签 Prompt = {id: String, name: String, content: String}
 */
Deno.test("T1.2: 组合语义标签验证", async () => {
  // 执行包含组合语义标签的图
  const fateEcho = await awakening("./sanctums", "composite_type_test");

  // 验证执行成功
  assertEquals(fateEcho.status, ExecutionStatus.Success, "组合语义标签图执行应该成功");

  // 🎯 直接解析JSON验证嵌套结构
  const outputsJson = JSON.parse(fateEcho.outputs);
  
  console.log("🔍 组合语义标签结构:");
  console.log(JSON.stringify(outputsJson, null, 2));

  // 验证Prompt输出存在
  assertEquals("creator.prompt" in outputsJson, true, "应该有creator.prompt输出");

  const promptOutput = outputsJson["creator.prompt"];
  
  // 验证顶层语义标签
  assertEquals(promptOutput.semantic_label, "basic.Prompt", "prompt应该是Prompt语义标签");
  assertEquals(typeof promptOutput.value, "object", "Prompt值应该是对象");

  // 验证嵌套字段的语义标签 - 直接访问JSON结构
  const promptValue = promptOutput.value;
  assertEquals(promptValue.id.semantic_label, "basic.String", "id字段应该是String语义标签");
  assertEquals(promptValue.name.semantic_label, "basic.String", "name字段应该是String语义标签");
  assertEquals(promptValue.content.semantic_label, "basic.String", "content字段应该是String语义标签");

  // 验证实际值类型
  assertEquals(typeof promptValue.id.value, "string", "id值应该是字符串");
  assertEquals(typeof promptValue.name.value, "string", "name值应该是字符串");
  assertEquals(typeof promptValue.content.value, "string", "content值应该是字符串");

  console.log("🎯 组合语义标签验证通过:");
  console.log(`  - Prompt: ${promptOutput.semantic_label} ✓`);
  console.log(`  - id: ${promptValue.id.semantic_label} ✓`);
  console.log(`  - name: ${promptValue.name.semantic_label} ✓`);
  console.log(`  - content: ${promptValue.content.semantic_label} ✓`);

  console.log("✅ T1.2 组合语义标签验证通过");
});

/**
 * T1.3: 语义标签静态安全约束验证
 *
 * 验证哲学理念: "类型系统是计算正确性的守护者"
 * 数学定义: 不兼容类型连接应该在静态检查阶段被拒绝
 * 
 * 🎯 TDD红绿循环验证:
 * - 🔴 RED: 当前应该失败，因为缺少静态类型检查器
 * - 🟢 GREEN: 实现静态检查器后，在validateGraph阶段拒绝图
 * 
 * 📋 严格的验证要求:
 * - basic.Prompt → basic.Int (不兼容连接)
 * - 必须在静态检查阶段被拒绝 (ValidationError)
 * - 图不应该进入执行阶段
 */
Deno.test("T1.3: 语义标签静态安全约束验证", async () => {
  console.log("🔍 开始T1.3: 语义标签静态安全约束验证");
  console.log("🎯 TDD期望: 静态检查阶段拒绝类型不匹配的图");
  
  // 执行包含类型不匹配连接的图
  const fateEcho = await awakening("./sanctums", "type_mismatch_test");

  console.log("📊 实际结果状态:", fateEcho.status);
  console.log("📄 错误信息:", fateEcho.outputs);

  // 🎯 核心验证1: 必须是ValidationError (静态错误)
  assertEquals(
    fateEcho.status, 
    ExecutionStatus.ValidationError, 
    "类型不匹配必须在静态检查阶段被发现，返回ValidationError"
  );

  // 🎯 核心验证2: 必须是静态错误，不是运行时错误
  assertEquals(
    isStaticError(fateEcho.status), 
    true, 
    "类型检查错误必须是静态错误"
  );
  
  assertEquals(
    isRuntimeError(fateEcho.status), 
    false, 
    "类型检查错误不应该是运行时错误"
  );

  // 🎯 核心验证3: 错误信息应该明确指出类型不匹配
  const errorDetails = fateEcho.getErrorDetails();
  assertEquals(errorDetails !== null, true, "应该有详细的错误信息");
  
  if (errorDetails) {
    assertStringIncludes(
      errorDetails.message.toLowerCase(), 
      "type", 
      "错误信息应该提到类型问题"
    );
    
    // 验证错误发生的位置信息
    assertEquals(
      errorDetails.location?.file?.includes("type_mismatch_test.weave"), 
      true, 
      "错误应该定位到具体的weave文件"
    );
  }

  // 🎯 核心验证4: 验证这是真正的静态检查，不是运行时检查
  // 如果错误信息包含节点执行相关内容，说明检查太晚了
  const errorMessage = fateEcho.outputs.toLowerCase();
  const isRuntimeCheck = errorMessage.includes("requires") && 
                        errorMessage.includes("input") && 
                        errorMessage.includes("node");
  
  assertEquals(
    isRuntimeCheck, 
    false, 
    "错误不应该来自节点执行时的检查，应该来自静态验证阶段"
  );

  console.log("✅ T1.3 静态类型检查验证通过");
});
