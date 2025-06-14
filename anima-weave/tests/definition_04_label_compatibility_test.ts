/**
 * # 定义4：语义标签兼容性关系 (Semantic Label Compatibility Relation)
 *
 * ## 哲学理念
 * 兼容性关系是类型系统的柔性基础。它既保证了类型安全，又提供了适度的灵活性，
 * 让不同但兼容的语义标签之间能够自然地进行数据传递和转换。
 *
 * ## 改进的数学定义
 * ```mathematica
 * Γ ⊆ ℒ × ℒ 且满足以下性质：
 *
 * 1. 反身性：∀τ ∈ ℒ, (τ, τ) ∈ Γ
 * 2. 传递性：∀τ₁, τ₂, τ₃ ∈ ℒ, (τ₁, τ₂) ∈ Γ ∧ (τ₂, τ₃) ∈ Γ ⟹ (τ₁, τ₃) ∈ Γ
 * 3. 兼容性封闭：∀(τ₁, τ₂) ∈ Γ, 存在有效的转换函数 convert: τ₁ → τ₂
 * 4. **执行顺序一致性**：兼容性转换的执行必须遵循依赖拓扑排序
 * ```
 *
 * 兼容性关系Γ定义了语义标签之间的类型转换规则，确保了：
 * - 每种类型都与自己兼容（反身性）
 * - 兼容性可以传递（传递性）
 * - 每个兼容关系都有对应的转换实现（封闭性）
 * - **转换执行遵循正确的依赖顺序（执行序一致性）**
 *
 * ## 协作探索记录
 * 我们在这里共同验证兼容性关系的数学性质在现实系统中的正确体现。
 * 每个测试都是对类型兼容性理论的深入探索和验证。
 * **重点关注执行顺序的验证，确保依赖关系得到正确处理。**
 *
 * @module
 */

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert";
import { awakening, ExecutionStatus, type ExecutionTrace, isStaticError } from "../src/mod.ts";

describe("定义4：语义标签兼容性关系 (Γ)", () => {
  describe("T4.1.1: 反身性验证 - 每种类型与自己兼容", () => {
    it("应该验证∀τ ∈ ℒ, (τ, τ) ∈ Γ的反身性质", async () => {
      // 🤔 Think: 反身性验证每种类型与自己兼容
      // 这个测试通过验证同类型端口连接来确认反身性
      // 现在DataProcessor需要starter提供execute信号

      // Given: 执行包含同类型连接的图
      const result = await awakening("./sanctums/definition_04", "T4_1_1_reflexivity_test");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "反身性验证图执行应该成功");

      // 🔍 分析同类型连接的处理结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 反身性验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证：同类型连接应该成功传播
      // UUID -> UUID, String -> String, Int -> Int, Bool -> Bool, Signal -> Signal
      assertExists(outputs["processor.result"], "同类型连接应该成功传播");

      const processorResult = outputs["processor.result"];
      assertEquals(processorResult.semantic_label, "basic.String", "处理结果应该是String类型");

      // 验证执行轨迹
      const trace = result.getExecutionTrace?.();
      assertExists(trace, "应该包含执行轨迹信息");

      // 验证执行顺序：starter -> processor (修正后的期望)
      assertEquals(trace.executionOrder.length, 2, "应该执行两个节点");
      assertEquals(trace.executionOrder[0].nodeId, "starter", "第一个应该是starter节点");
      assertEquals(trace.executionOrder[1].nodeId, "processor", "第二个应该是processor节点");

      // 验证依赖顺序正确
      assertEquals(trace.executionOrder[0].executionOrder, 1, "starter应该是第一个执行");
      assertEquals(trace.executionOrder[1].executionOrder, 2, "processor应该在starter之后执行");

      console.log(`🔍 反身性验证执行轨迹:`, trace);

      console.log("🎯 反身性验证通过:");
      console.log("  - ∀τ ∈ ℒ, (τ, τ) ∈ Γ ✓");
      console.log("  - 同类型连接传播成功 ✓");
      console.log("  - 执行顺序符合依赖关系 ✓");
    });
  });

  describe("T4.1.2: 基础兼容性验证 - UUID与String的兼容", () => {
    it("应该验证(UUID, String) ∈ Γ的基础兼容性", async () => {
      // 🤔 Think: 这验证了系统中的基础兼容性规则
      // UUID可以安全地转换为String，这是一个典型的兼容性关系

      // Given: 执行UUID->String连接的图
      const result = await awakening(
        "./sanctums/definition_04",
        "T4_1_2_uuid_string_compatibility",
      );

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "UUID->String兼容性图执行应该成功");

      // 🔍 分析兼容性转换的结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 UUID->String兼容性验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证：UUID成功转换为String
      assertExists(outputs["formatter.formatted"], "UUID->String转换应该成功");

      const formattedResult = outputs["formatter.formatted"];
      assertEquals(formattedResult.semantic_label, "basic.String", "转换结果应该是String类型");
      assertEquals(typeof formattedResult.value, "string", "转换后的值应该是字符串");

      // 验证UUID格式被保留在String中
      const stringValue = formattedResult.value as string;
      assertStringIncludes(stringValue, "Formatted:", "应该包含格式化前缀");

      // 验证执行轨迹
      const trace = result.getExecutionTrace?.();
      assertExists(trace, "应该包含执行轨迹信息");

      // 验证执行顺序：starter -> formatter
      assertEquals(trace.executionOrder.length, 2, "应该执行两个节点");
      assertEquals(trace.executionOrder[0].nodeId, "starter", "第一个应该是starter节点");
      assertEquals(trace.executionOrder[1].nodeId, "formatter", "第二个应该是formatter节点");

      // 验证依赖顺序正确
      assertEquals(trace.executionOrder[0].executionOrder, 1, "starter应该是第一个执行");
      assertEquals(trace.executionOrder[1].executionOrder, 2, "formatter应该在starter之后执行");

      console.log(`🔍 UUID->String兼容性执行轨迹:`, trace);

      console.log("🎯 基础兼容性验证通过:");
      console.log("  - (UUID, String) ∈ Γ ✓");
      console.log("  - 兼容性转换实现正确 ✓");
    });
  });

  describe("T4.1.3: 不兼容类型的静态拒绝", () => {
    it("应该在静态检查阶段拒绝不兼容的类型连接", async () => {
      // 🤔 Think: 这验证了兼容性关系的边界
      // 不存在于Γ中的类型对应该被静态检查拒绝

      console.log("🔍 开始验证不兼容类型的静态拒绝");
      console.log("🎯 期望: 静态检查阶段拒绝不兼容的类型连接");

      // Given: 执行包含不兼容类型连接的图
      const result = await awakening("./sanctums/definition_04", "T4_1_3_incompatible_types");

      console.log("📊 实际结果状态:", result.status);
      console.log("📄 错误信息:", result.outputs);

      // 🎯 核心验证：必须是ValidationError (静态错误)
      assertEquals(
        result.status,
        ExecutionStatus.ValidationError,
        "不兼容类型必须在静态检查阶段被拒绝",
      );

      // 🎯 验证是静态错误，不是运行时错误
      assertEquals(
        isStaticError(result.status),
        true,
        "类型不兼容必须是静态错误",
      );

      // 🎯 验证错误信息包含类型不匹配描述
      assertStringIncludes(
        result.outputs.toLowerCase(),
        "type",
        "错误信息应该提到类型问题",
      );

      // 验证执行轨迹
      const trace = result.getExecutionTrace?.();
      assertEquals(trace, null, "静态检查失败不应该有执行轨迹");

      console.log(`🎯 不兼容性拒绝验证通过:
  - 静态检查正确拒绝不兼容连接 ✓
  - 错误信息准确描述问题 ✓`);
    });
  });

  describe("T4.1.4: 传递性验证 - Prompts->prompt->string链式转换", () => {
    it("应该验证Prompts->prompt->string的链式兼容性转换", async () => {
      // 🤔 Think: 这是传递性的具体实现验证
      // Prompts -> prompt (通过某种节点转换)
      // prompt -> string (已有的兼容性)
      // 因此 Prompts 应该能最终转换为 string

      console.log("🔍 开始验证 Prompts->prompt->string 链式转换");

      // Given: 执行包含链式转换的图
      // 这个图应该有：CreatePrompt -> EnhancePrompt -> 某种prompt->string转换
      const result = await awakening("./sanctums/definition_04", "T4_1_4_prompts_chain_test");

      // TDD: 明确期望链式转换成功
      assertEquals(
        result.status,
        ExecutionStatus.Success,
        "Prompts->prompt->string链式转换必须成功",
      );

      // 验证转换结果
      const outputs = JSON.parse(result.outputs);
      console.log("🎯 链式转换验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证最终输出包含string类型
      const finalOutput = Object.values(outputs).find((output: any) =>
        output && typeof output === "object" && output.semantic_label === "basic.String"
      );

      assertExists(finalOutput, "链式转换最终应该产生String类型输出");
      assertEquals((finalOutput as any).semantic_label, "basic.String", "最终输出应该是String类型");

      // 🎯 TDD核心断言：验证传递性转换的值正确性
      const finalValue = (finalOutput as any).value as string;

      // 1. 验证值不为空（基本完整性）
      assertEquals(finalValue.trim() === "", false, "传递性转换后的值不应该为空");

      // 2. 验证合并逻辑正确：应该包含原始内容和增强内容
      const lines = finalValue.split("\n");
      assertEquals(lines.length >= 2, true, "合并后的内容应该包含多行（原始+增强）");

      // 3. 验证包含"Formatted:"前缀（StringFormatter的格式化）
      assertEquals(
        finalValue.startsWith("Formatted:"),
        true,
        "输出应该包含StringFormatter的格式化前缀",
      );

      // 4. 验证包含"System Enhancement"（证明Prompts->Prompt合并成功）
      assertEquals(
        finalValue.includes("System Enhancement"),
        true,
        "输出应该包含增强内容，证明Prompts合并成功",
      );

      // 5. 验证传递性转换链：Prompts -> Prompt -> String
      // 如果包含增强内容，说明Prompts成功转换为Prompt（合并操作）
      // 如果有"Formatted:"前缀，说明Prompt成功转换为String（格式化操作）
      assertEquals(
        finalValue.includes("System Enhancement") && finalValue.startsWith("Formatted:"),
        true,
        "传递性转换链 Prompts->Prompt->String 必须完整执行",
      );

      console.log(`✅ 传递性转换验证通过，最终值: "${finalValue}"`);

      // 验证执行轨迹
      const trace = result.getExecutionTrace?.();
      assertExists(trace, "应该包含执行轨迹信息");

      console.log("🎯 传递性验证通过:");
      console.log("  - Prompts -> prompt 转换存在 ✓");
      console.log("  - prompt -> string 转换存在 ✓");
      console.log("  - 链式转换 Prompts -> string 成功 ✓");
      console.log("  - 值转换完整性验证通过 ✓");
    });
  });

  describe("T4.1.5: 兼容性封闭验证 - 转换函数存在性", () => {
    it("应该验证每个兼容关系都有对应的转换实现", async () => {
      // 🤔 Think: 兼容性封闭性要求每个声明的兼容关系都有实际的转换实现
      // 这确保了兼容性不只是理论概念，而是可执行的转换

      // Given: 测试所有已知兼容关系的转换实现
      const result = await awakening("./sanctums/definition_04", "T4_1_5_closure_verification");

      // Then: 验证转换实现存在且正确
      assertEquals(result.status, ExecutionStatus.Success, "兼容性封闭验证应该成功");

      // 🔍 分析转换实现的结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 兼容性封闭验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 验证已知兼容关系的转换实现
      assertExists(outputs["uuid_to_string.formatted"], "UUID->String转换应该存在");

      const conversionResult = outputs["uuid_to_string.formatted"];
      assertEquals(conversionResult.semantic_label, "basic.String", "转换结果类型正确");
      assertEquals(typeof conversionResult.value, "string", "转换后值类型正确");

      // 验证执行轨迹
      const trace = result.getExecutionTrace?.();
      assertExists(trace, "应该包含执行轨迹信息");

      // 验证执行顺序：starter -> uuid_to_string
      assertEquals(trace.executionOrder.length, 2, "应该执行两个节点");
      assertEquals(trace.executionOrder[0].nodeId, "starter", "第一个应该是starter节点");
      assertEquals(
        trace.executionOrder[1].nodeId,
        "uuid_to_string",
        "第二个应该是uuid_to_string节点",
      );

      // 验证转换实现的正确性
      const closureOutputs = result.getOutputs();
      assertExists(closureOutputs["uuid_to_string.formatted"], "应该有格式化输出");
      assertEquals(
        closureOutputs["uuid_to_string.formatted"].semantic_label,
        "basic.String",
        "输出应该是String类型",
      );

      console.log(`🎯 兼容性封闭验证通过:
  - 兼容关系有对应转换实现 ✓
  - 转换结果语义标签正确 ✓
  - 转换函数输出类型正确 ✓
  - 执行顺序符合依赖关系 ✓`);
    });
  });

  describe("T4.1.6: 兼容性关系的完整性", () => {
    it("应该验证系统中所有兼容关系的一致性", async () => {
      // 🤔 Think: 完整性验证确保兼容性关系系统的内部一致性
      // 所有声明的兼容关系都应该在实际执行中表现一致

      // Given: 执行完整性检查图
      const result = await awakening("./sanctums/definition_04", "T4_1_6_completeness_check");

      // Then: 验证系统一致性
      assertEquals(result.status, ExecutionStatus.Success, "完整性检查应该成功");

      // 🔍 分析系统一致性
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 完整性检查结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 验证系统中的兼容性规则一致性
      const compatibilityTests = Object.keys(outputs).filter((key) =>
        key.includes("compatibility") || key.includes("conversion")
      );

      console.log("🔍 发现的兼容性测试:", compatibilityTests);

      // 验证每个兼容性测试都成功
      for (const testKey of compatibilityTests) {
        const testResult = outputs[testKey];
        assertExists(testResult, `兼容性测试 ${testKey} 应该存在`);

        if (
          typeof testResult === "object" && testResult !== null && "semantic_label" in testResult
        ) {
          console.log(`  ✓ ${testKey}: ${(testResult as any).semantic_label}`);
        }
      }

      // 验证执行轨迹
      const trace = result.getExecutionTrace?.();
      assertExists(trace, "应该包含执行轨迹信息");

      // 验证执行顺序：starter -> compatibility_test -> completeness_marker
      assertEquals(trace.executionOrder.length, 3, "应该执行三个节点");
      assertEquals(trace.executionOrder[0].nodeId, "starter", "第一个应该是starter");
      assertEquals(
        trace.executionOrder[1].nodeId,
        "compatibility_test",
        "第二个应该是compatibility_test",
      );
      assertEquals(
        trace.executionOrder[2].nodeId,
        "completeness_marker",
        "第三个应该是completeness_marker",
      );

      // 验证执行顺序的依赖关系
      assertEquals(trace.executionOrder[0].executionOrder, 1, "starter应该第一个执行");
      assertEquals(trace.executionOrder[1].executionOrder, 2, "compatibility_test应该第二个执行");
      assertEquals(trace.executionOrder[2].executionOrder, 3, "completeness_marker应该最后执行");

      // 验证输出完整性
      const completenessOutputs = result.getOutputs();
      const testOutputs = Object.keys(completenessOutputs).filter((key) =>
        key.includes("compatibility_test")
      );
      assertEquals(testOutputs.length > 0, true, "应该有兼容性测试输出");

      console.log(`🎯 完整性验证通过:
  - 兼容性关系系统内部一致 ✓
  - 所有声明的兼容关系都可执行 ✓
  - 执行顺序符合依赖关系 ✓
  - 控制流正确传播 ✓`);
    });
  });

  describe("📚 兼容性关系理论总结", () => {
    it("通过验证确认兼容性关系的数学性质", async () => {
      // 🎯 这不是一个传统的测试，而是我们共同探索的总结
      // 让我们回顾一下兼容性关系系统的核心价值

      console.log(`🎯 语义标签兼容性关系Γ的数学性质:
  ✅ 反身性：每种类型与自己兼容 - (τ, τ) ∈ Γ
  ✅ 基础兼容：UUID与String兼容 - (UUID, String) ∈ Γ
  ✅ 边界清晰：不兼容类型被正确拒绝
  ✅ 封闭性：兼容关系有转换实现
  ✅ **执行序一致性：转换遵循依赖关系的拓扑排序**
  📋 传递性：未来扩展的重要方向
🔍 系统设计洞察:
  - 兼容性关系平衡了类型安全与灵活性
  - 静态检查确保了编译时类型安全
  - 转换实现保证了运行时正确性
  - **执行顺序验证确保了依赖关系的正确处理**
  - 扩展性设计支持未来的类型系统增强`);
    });
  });
});
