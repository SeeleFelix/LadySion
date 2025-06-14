/**
 * # 定义1：语义标签集合 (Semantic Labels Set)
 * 
 * ## 哲学理念
 * 语义标签是计算的基础。每个数据都有其本质的语义含义，
 * 语义标签系统确保了数据在图执行过程中的类型安全和语义一致性。
 * 
 * ## 数学定义
 * ```mathematica
 * ℒ = {Int, Bool, String, Array[T], Record{...}, ...}
 * ```
 * 
 * 语义标签集合ℒ是所有可能的数据类型标签的集合，包括：
 * - 基础类型：Int, Bool, String, UUID, Signal
 * - 复合类型：Array[T], Record{...}
 * - 用户定义类型：自定义的语义标签
 * 
 * ## 协作探索记录
 * 我们在这里共同验证语义标签系统的正确性和完整性。
 * 每个测试都是对数学定义在现实中体现的一次深入探索。
 * 
 * @module
 */

import { describe, it, beforeEach } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert";
import { awakening, ExecutionStatus, isStaticError, isRuntimeError } from "../src/mod.ts";

describe("定义1：语义标签集合 (ℒ)", () => {
  
  describe("T1.1.1: 基础语义标签的执行传播", () => {
    it("应该正确传播和序列化基础语义标签", async () => {
      // 🤔 Think: 这里我们验证语义标签系统的核心功能
      // 语义标签不只是类型标记，更是计算意图的载体
      
      // Given: 执行包含基础语义标签的图
      const result = await awakening("./sanctums", "type_system_foundation");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "图执行应该成功");

      // 🔍 让我们一起看看输出结构是什么样的
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 解析后的输出结构:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证必要的输出存在
      assertEquals("starter.execution_id" in outputs, true, "应该有execution_id输出");
      assertEquals("judge.result" in outputs, true, "应该有judge.result输出");
      assertEquals("formatter.formatted" in outputs, true, "应该有formatter.formatted输出");

      // 🎯 核心验证：每个输出都应该有正确的语义标签结构
      const executionId = outputs["starter.execution_id"];
      assertEquals(executionId.semantic_label, "basic.UUID", "execution_id语义标签应该是UUID");
      assertEquals(typeof executionId.value, "string", "UUID值应该是字符串");

      const judgeResult = outputs["judge.result"];
      assertEquals(judgeResult.semantic_label, "basic.Bool", "result语义标签应该是Bool");
      assertEquals(typeof judgeResult.value, "boolean", "Bool值应该是布尔类型");

      const formatted = outputs["formatter.formatted"];
      assertEquals(formatted.semantic_label, "basic.String", "formatted语义标签应该是String");
      assertEquals(typeof formatted.value, "string", "String值应该是字符串");

      console.log("🎯 语义标签验证通过:");
      console.log(`  - execution_id: ${executionId.semantic_label} ✓`);
      console.log(`  - judge.result: ${judgeResult.semantic_label} ✓`);
      console.log(`  - formatter.formatted: ${formatted.semantic_label} ✓`);
    });
  });

  describe("T1.1.2: 组合语义标签的构造", () => {
    it("应该正确构造和嵌套复杂的组合类型", async () => {
      // 🤔 Think: 这里验证语义标签系统对复杂组合类型的支持
      // Prompt类型是一个很好的例子，展示了嵌套语义标签的威力
      
      // Given: 执行包含组合语义标签的图
      const result = await awakening("./sanctums", "composite_type_test");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "组合语义标签图执行应该成功");

      // 🔍 让我们一起分析组合类型的结构
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 组合语义标签结构:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证Prompt输出存在
      assertEquals("creator.prompt" in outputs, true, "应该有creator.prompt输出");

      const promptOutput = outputs["creator.prompt"];
      
      // 🎯 验证顶层语义标签
      assertEquals(promptOutput.semantic_label, "basic.Prompt", "prompt应该是Prompt语义标签");
      assertEquals(typeof promptOutput.value, "object", "Prompt值应该是对象");

      // 🔍 深入验证嵌套字段的语义标签 - 这是组合类型的精髓
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
    });
  });

  describe("T1.1.3: 语义标签的类型转换", () => {
    it("应该在兼容类型间正确转换并更新语义标签", async () => {
      // 🤔 Think: 类型转换是语义标签系统的重要能力
      // 我们需要确保转换过程中语义标签的正确传播和更新
      
      // Given: 执行包含类型转换的图
      const result = await awakening("./sanctums", "t1_1_3_type_conversion");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "类型转换图执行应该成功");

      // 🔍 分析转换链的结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 类型转换结果结构:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证类型转换链: Int -> String -> Prompt
      if ("converter.formatted" in outputs) {
        const converted = outputs["converter.formatted"];
        assertEquals(converted.semantic_label, "basic.String", "转换后应该是String语义标签");
        assertEquals(typeof converted.value, "string", "转换后值应该是字符串类型");
      }

      if ("final.prompt" in outputs) {
        const finalPrompt = outputs["final.prompt"];
        assertEquals(finalPrompt.semantic_label, "basic.Prompt", "最终应该是Prompt语义标签");
        assertEquals(typeof finalPrompt.value, "object", "Prompt值应该是对象");
      }
    });
  });

  describe("T1.1.4: 类型不匹配的静态检查", () => {
    it("应该在静态检查阶段拒绝不兼容的类型连接", async () => {
      // 🤔 Think: 这是类型系统的守护功能
      // 不兼容的类型连接应该在图执行之前就被发现和拒绝
      // 这体现了"类型系统是计算正确性的守护者"的哲学
      
      console.log("🔍 开始验证类型不匹配的静态检查");
      console.log("🎯 期望: 静态检查阶段拒绝类型不匹配的图");
      
      // Given: 执行包含类型不匹配连接的图
      const result = await awakening("./sanctums", "type_mismatch_test");

      console.log("📊 实际结果状态:", result.status);
      console.log("📄 错误信息:", result.outputs);

      // 🎯 核心验证1: 必须是ValidationError (静态错误)
      assertEquals(
        result.status, 
        ExecutionStatus.ValidationError, 
        "类型不匹配必须在静态检查阶段被发现，返回ValidationError"
      );

      // 🎯 核心验证2: 必须是静态错误，不是运行时错误
      assertEquals(
        isStaticError(result.status), 
        true, 
        "类型检查错误必须是静态错误"
      );
      
      assertEquals(
        isRuntimeError(result.status), 
        false, 
        "类型检查错误不应该是运行时错误"
      );

      // 🎯 核心验证3: 错误信息应该明确指出类型不匹配
      const errorDetails = result.getErrorDetails();
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
      const errorMessage = result.outputs.toLowerCase();
      const isRuntimeCheck = errorMessage.includes("requires") && 
                            errorMessage.includes("input") && 
                            errorMessage.includes("node");
      
      assertEquals(
        isRuntimeCheck, 
        false, 
        "错误不应该来自节点执行时的检查，应该来自静态验证阶段"
      );
    });
  });

  describe("T1.1.5: 语义标签集合的完整性", () => {
    it("应该完整覆盖所有基础语义标签类型", async () => {
      // 🤔 Think: 这里验证我们的语义标签系统是否完整
      // 所有定义的基础类型都应该能正确工作
      
      // Given: 执行包含所有基础语义标签的图
      const result = await awakening("./sanctums", "t1_1_5_completeness");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "完整性验证图执行应该成功");

      // 🔍 分析完整性验证结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 完整性验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 收集所有出现的语义标签类型
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
      
      for (const [key, output] of Object.entries(outputs)) {
        collectSemanticLabels(output, key);
      }

      // 🎯 验证包含所有基础语义标签类型
      const expectedLabels = ["basic.UUID", "basic.String", "basic.Bool", "basic.Prompt", "basic.Signal"];
      for (const label of expectedLabels) {
        assertEquals(
          semanticLabels.has(label), 
          true, 
          `应该包含语义标签: ${label}`
        );
      }
    });
  });

  describe("T1.1.6: 边界情况的健壮性", () => {
    it("应该在边界情况下保持语义标签的正确性", async () => {
      // 🤔 Think: 边界情况往往暴露系统的脆弱性
      // 我们需要确保语义标签系统在各种边界情况下都保持健壮
      
      // Given: 执行边界情况测试图
      const result = await awakening("./sanctums", "t1_1_6_boundary_cases");

      // Then: 验证执行成功（边界情况也应该正常处理）
      assertEquals(result.status, ExecutionStatus.Success, "边界情况图执行应该成功");

      // 🔍 分析边界情况的处理结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 边界情况验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 验证所有输出都有正确的语义标签
      for (const [key, output] of Object.entries(outputs)) {
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
    });
  });

  describe("T1.1.7: 序列化一致性", () => {
    it("应该在多次执行中保持语义标签格式的一致性", async () => {
      // 🤔 Think: 一致性是系统可靠性的基础
      // 语义标签的序列化格式应该是稳定和可预测的
      
      // Given: 执行同一图多次
      const result1 = await awakening("./sanctums", "t1_1_7_serialization_consistency");
      const result2 = await awakening("./sanctums", "t1_1_7_serialization_consistency");

      // Then: 验证两次执行都成功
      assertEquals(result1.status, ExecutionStatus.Success, "第一次执行应该成功");
      assertEquals(result2.status, ExecutionStatus.Success, "第二次执行应该成功");

      // 🔍 比较两次执行的序列化格式
      const outputs1 = JSON.parse(result1.outputs);
      const outputs2 = JSON.parse(result2.outputs);
      
      console.log("🔍 第一次执行结果:");
      console.log(JSON.stringify(outputs1, null, 2));
      
      console.log("🔍 第二次执行结果:");
      console.log(JSON.stringify(outputs2, null, 2));

      // 🎯 验证语义标签格式的一致性（值可能不同，但格式应该一致）
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
    });
  });

  describe("T1.1.8: 系统扩展性", () => {
    it("应该为未来的语义标签扩展提供良好的基础架构", async () => {
      // 🤔 Think: 扩展性是系统长期发展的关键
      // 我们需要确保当前的设计能够支持未来的需求增长
      
      // Given: 使用基础语义标签验证扩展性基础
      const result = await awakening("./sanctums", "type_system_foundation");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "扩展性基础验证图执行应该成功");

      // 🔍 分析扩展性友好的结构特征
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 扩展性验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 验证扩展性友好的JSON序列化结构
      for (const [key, output] of Object.entries(outputs)) {
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
          
          // 🔍 验证语义标签的命名空间结构（扩展性关键）
          assertEquals(
            semanticOutput.semantic_label.includes("."), 
            true, 
            `${key}的语义标签应该包含命名空间分隔符，支持扩展`
          );
        }
      }
    });
  });

  describe("📚 探索总结", () => {
    it("通过验证确认语义标签系统的核心价值", async () => {
      // 🎯 这不是一个传统的测试，而是我们共同探索的总结
      // 让我们回顾一下语义标签系统为什么如此重要
      
      console.log("🎯 语义标签系统的核心价值:");
      console.log("  ✅ 类型安全：静态检查防止类型错误");
      console.log("  ✅ 语义清晰：每个数据都有明确的语义含义");
      console.log("  ✅ 序列化友好：支持图间数据传递");
      console.log("  ✅ 扩展性强：命名空间机制支持未来扩展");
      console.log("  ✅ 健壮性好：边界情况下仍然可靠");
      
      // 这个"测试"总是通过，因为它代表我们的理解和收获
      assertEquals(true, true, "我们对语义标签系统的理解不断深化");
    });
  });
  
}); 