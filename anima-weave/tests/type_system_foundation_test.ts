import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { awakening, ExecutionStatus, isStaticError, isRuntimeError, type FateEcho } from "../src/mod.ts";

/**
 * T1.1.1: 基础语义标签执行传播验证
 *
 * 验证哲学理念: "语义标签是计算的基础"
 * 数学定义1: ℒ = {Int, Bool, String, UUID, Signal, ...} (语义标签集合)
 *
 * 🎯 正确的架构验证：
 * - FateEcho保持结构化（status, metadata）
 * - outputs序列化为带语义标签的字符串，支持图间传递
 * - 框架统一处理语义标签序列化，插件专注业务逻辑
 */
Deno.test("T1.1.1: 基础语义标签执行传播验证", async () => {
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

  console.log("✅ T1.1.1 基础语义标签执行传播验证通过");
});

/**
 * T1.1.2: 组合语义标签构造验证
 *
 * 验证哲学理念: 语义标签系统支持复杂组合类型
 * 数学定义: 组合语义标签 Prompt = {id: String, name: String, content: String}
 */
Deno.test("T1.1.2: 组合语义标签构造验证", async () => {
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

  console.log("✅ T1.1.2 组合语义标签构造验证通过");
});

/**
 * T1.1.4: 语义标签验证失败场景
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
Deno.test("T1.1.4: 语义标签验证失败场景", async () => {
  console.log("🔍 开始T1.1.4: 语义标签验证失败场景");
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

  console.log("✅ T1.1.4 语义标签验证失败场景通过");
});

/**
 * T1.1.3: 语义标签类型转换验证
 *
 * 验证哲学理念: "类型转换中语义标签的正确传播和更新"
 * 数学定义: 兼容类型间的安全转换和语义标签更新
 */
Deno.test("T1.1.3: 语义标签类型转换验证", async () => {
  console.log("🔍 开始T1.1.3: 语义标签类型转换验证");
  
  // 执行包含类型转换的图
  const fateEcho = await awakening("./sanctums", "t1_1_3_type_conversion");

  // 验证执行成功
  assertEquals(fateEcho.status, ExecutionStatus.Success, "类型转换图执行应该成功");

  // 解析输出结构
  const outputsJson = JSON.parse(fateEcho.outputs);
  
  console.log("🔍 类型转换结果结构:");
  console.log(JSON.stringify(outputsJson, null, 2));

  // 验证类型转换链: Int -> String -> Prompt
  if ("converter.formatted" in outputsJson) {
    const converted = outputsJson["converter.formatted"];
    assertEquals(converted.semantic_label, "basic.String", "转换后应该是String语义标签");
    assertEquals(typeof converted.value, "string", "转换后值应该是字符串类型");
  }

  if ("final.prompt" in outputsJson) {
    const finalPrompt = outputsJson["final.prompt"];
    assertEquals(finalPrompt.semantic_label, "basic.Prompt", "最终应该是Prompt语义标签");
    assertEquals(typeof finalPrompt.value, "object", "Prompt值应该是对象");
  }

  console.log("✅ T1.1.3 语义标签类型转换验证通过");
});

/**
 * T1.1.5: 语义标签集合完整性验证
 *
 * 验证哲学理念: "语义标签集合的完整覆盖和正确实现"
 * 数学定义: 所有语义标签类型在图执行中的正确体现
 */
Deno.test("T1.1.5: 语义标签集合完整性验证", async () => {
  console.log("🔍 开始T1.1.5: 语义标签集合完整性验证");
  
  // 执行包含所有基础语义标签的图
  const fateEcho = await awakening("./sanctums", "t1_1_5_completeness");

  // 验证执行成功
  assertEquals(fateEcho.status, ExecutionStatus.Success, "完整性验证图执行应该成功");

  // 解析输出结构
  const outputsJson = JSON.parse(fateEcho.outputs);
  
  console.log("🔍 完整性验证结果:");
  console.log(JSON.stringify(outputsJson, null, 2));

  // 验证基础语义标签类型的完整性（包括嵌套类型）
  const semanticLabels = new Set<string>();
  
  function collectSemanticLabels(obj: any, path = "") {
    if (typeof obj === 'object' && obj !== null && 'semantic_label' in obj) {
      semanticLabels.add(obj.semantic_label);
      console.log(`  - ${path}: ${obj.semantic_label}`);
      
      // 递归检查嵌套的值
      if (obj.value && typeof obj.value === 'object') {
        for (const [key, value] of Object.entries(obj.value)) {
          collectSemanticLabels(value, `${path}.${key}`);
        }
      }
    }
  }
  
  for (const [key, output] of Object.entries(outputsJson)) {
    collectSemanticLabels(output, key);
  }

  // 验证包含基础语义标签类型
  const expectedLabels = ["basic.UUID", "basic.String", "basic.Bool", "basic.Prompt", "basic.Signal"];
  for (const label of expectedLabels) {
    assertEquals(
      semanticLabels.has(label), 
      true, 
      `应该包含语义标签: ${label}`
    );
  }

  console.log("✅ T1.1.5 语义标签集合完整性验证通过");
});

/**
 * T1.1.6: 语义标签状态边界验证
 *
 * 验证哲学理念: "边界情况下语义标签的健壮性"
 * 数学定义: 边界值和特殊状态的语义标签处理
 */
Deno.test("T1.1.6: 语义标签状态边界验证", async () => {
  console.log("🔍 开始T1.1.6: 语义标签状态边界验证");
  
  // 执行边界情况测试图
  const fateEcho = await awakening("./sanctums", "t1_1_6_boundary_cases");

  // 验证执行成功（边界情况也应该正常处理）
  assertEquals(fateEcho.status, ExecutionStatus.Success, "边界情况图执行应该成功");

  // 解析输出结构
  const outputsJson = JSON.parse(fateEcho.outputs);
  
  console.log("🔍 边界情况验证结果:");
  console.log(JSON.stringify(outputsJson, null, 2));

  // 验证所有输出都有正确的语义标签
  for (const [key, output] of Object.entries(outputsJson)) {
    if (typeof output === 'object' && output !== null && 'semantic_label' in output) {
      const semanticOutput = output as any;
      assertEquals(
        semanticOutput.semantic_label.startsWith("basic."), 
        true, 
        `${key}的语义标签应该以basic.开头`
      );
      assertEquals(
        semanticOutput.value !== undefined, 
        true, 
        `${key}应该有实际值`
      );
    }
  }

  console.log("✅ T1.1.6 语义标签状态边界验证通过");
});

/**
 * T1.1.7: 语义标签序列化一致性验证
 *
 * 验证哲学理念: "语义标签序列化格式的一致性和稳定性"
 * 数学定义: 多次执行的语义标签格式稳定性
 */
Deno.test("T1.1.7: 语义标签序列化一致性验证", async () => {
  console.log("🔍 开始T1.1.7: 语义标签序列化一致性验证");
  
  // 执行同一图多次，比较序列化格式
  const fateEcho1 = await awakening("./sanctums", "t1_1_7_serialization_consistency");
  const fateEcho2 = await awakening("./sanctums", "t1_1_7_serialization_consistency");

  // 验证两次执行都成功
  assertEquals(fateEcho1.status, ExecutionStatus.Success, "第一次执行应该成功");
  assertEquals(fateEcho2.status, ExecutionStatus.Success, "第二次执行应该成功");

  // 解析两次执行的输出
  const outputs1 = JSON.parse(fateEcho1.outputs);
  const outputs2 = JSON.parse(fateEcho2.outputs);
  
  console.log("🔍 第一次执行结果:");
  console.log(JSON.stringify(outputs1, null, 2));
  
  console.log("🔍 第二次执行结果:");
  console.log(JSON.stringify(outputs2, null, 2));

  // 验证语义标签格式的一致性（值可能不同，但格式应该一致）
  const keys1 = Object.keys(outputs1).sort();
  const keys2 = Object.keys(outputs2).sort();
  
  assertEquals(keys1.length, keys2.length, "两次执行的输出数量应该一致");
  
  for (let i = 0; i < keys1.length; i++) {
    assertEquals(keys1[i], keys2[i], `第${i}个输出key应该一致`);
    
    const output1 = outputs1[keys1[i]];
    const output2 = outputs2[keys2[i]];
    
    if (typeof output1 === 'object' && typeof output2 === 'object' && 
        output1 !== null && output2 !== null &&
        'semantic_label' in output1 && 'semantic_label' in output2) {
      
      assertEquals(
        output1.semantic_label, 
        output2.semantic_label, 
        `${keys1[i]}的语义标签应该一致`
      );
      
      assertEquals(
        typeof output1.value, 
        typeof output2.value, 
        `${keys1[i]}的值类型应该一致`
      );
    }
  }

  console.log("✅ T1.1.7 语义标签序列化一致性验证通过");
});

/**
 * T1.1.8: 语义标签扩展性验证
 *
 * 验证哲学理念: "语义标签系统的可扩展性"
 * 数学定义: 语义标签系统对新类型的支持能力
 */
Deno.test("T1.1.8: 语义标签扩展性验证", async () => {
  console.log("🔍 开始T1.1.8: 语义标签扩展性验证");
  
  // 使用基础语义标签的简单图来验证扩展性基础
  const fateEcho = await awakening("./sanctums", "type_system_foundation");

  // 验证执行成功
  assertEquals(fateEcho.status, ExecutionStatus.Success, "扩展性基础验证图执行应该成功");

  // 解析输出结构
  const outputsJson = JSON.parse(fateEcho.outputs);
  
  console.log("🔍 扩展性验证结果:");
  console.log(JSON.stringify(outputsJson, null, 2));

  // 验证JSON序列化结构的一致性（扩展性的基础）
  for (const [key, output] of Object.entries(outputsJson)) {
    if (typeof output === 'object' && output !== null && 'semantic_label' in output) {
      const semanticOutput = output as any;
      
      // 验证扩展性友好的结构
      assertEquals(
        typeof semanticOutput.semantic_label, 
        "string", 
        `${key}的语义标签应该是字符串，便于扩展`
      );
      
      assertEquals(
        'value' in semanticOutput, 
        true, 
        `${key}应该有value字段，保持结构一致性`
      );
      
      // 验证语义标签的命名空间结构（扩展性关键）
      assertEquals(
        semanticOutput.semantic_label.includes("."), 
        true, 
        `${key}的语义标签应该包含命名空间分隔符，支持扩展`
      );
    }
  }

  console.log("✅ T1.1.8 语义标签扩展性验证通过");
});


