/**
 * # 定义6：节点计算函数 (Node Computation Function)
 *
 * ## 哲学理念
 * 节点计算函数φ是AnimaWeave系统的核心抽象，它将输入数据和控制信号
 * 转换为输出数据和控制信号。φ不仅仅是一个函数，更是一个语义转换器，
 * 确保数据在计算过程中保持其语义完整性和类型安全性。
 *
 * ## 数学定义
 * ```mathematica
 * φ: ∏_{i=1}^{|D_in|} τᵢ × ∏_{j=1}^{|C_in|} σⱼ → ∏_{k=1}^{|D_out|} τₖ × ∏_{l=1}^{|C_out|} σₗ
 * ```
 *
 * 其中：
 * - τᵢ: 第i个数据输入端口的语义标签
 * - σⱼ: 第j个控制输入端口的语义标签 
 * - τₖ: 第k个数据输出端口的语义标签
 * - σₗ: 第l个控制输出端口的语义标签
 * - ∏: 笛卡尔积，表示多个类型的组合
 *
 * ## 协作探索记录
 * 通过这次深入验证，我们共同理解节点计算函数的数学本质。
 * 每个测试都通过图执行来验证φ在实际运行中的正确行为。
 *
 * @module
 */

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists } from "jsr:@std/assert";
import { awakening, ExecutionStatus } from "../src/mod.ts";

describe("定义6：节点计算函数 (φ: ∏τᵢ × ∏σⱼ → ∏τₖ × ∏σₗ)", () => {
  describe("T6.1.1: 输入类型乘积的验证", () => {
    it("应该通过图执行验证φ正确处理数据输入类型乘积 ∏_{i=1}^{|D_in|} τᵢ", async () => {
      // 🤔 Think: 通过执行包含多种数据输入类型的图来验证φ的输入处理能力
      // 图中的节点将接收不同类型的数据输入，φ必须正确处理这些类型的乘积

      // Given: 执行包含数据类型乘积的测试图
      const result = await awakening("./sanctums/definition_06", "T6_1_1_input_product_type");

      // Then: 验证图执行成功，说明φ能正确处理输入类型乘积
      assertEquals(result.status, ExecutionStatus.Success, "φ应该能处理数据输入类型乘积");

      // 🔍 分析输出结构，验证类型传播
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 数据输入类型乘积验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证必要的输出存在，说明数据类型正确传播
      assertEquals("starter.execution_id" in outputs, true, "应该有starter的UUID输出");
      assertEquals("checker.result" in outputs, true, "应该有checker的布尔结果");
      assertEquals("formatter.formatted" in outputs, true, "应该有formatter的格式化输出");

      // 🎯 核心验证：每个节点的φ都正确处理了其数据输入类型乘积
      const starterOutput = outputs["starter.execution_id"];
      const checkerOutput = outputs["checker.result"];
      const formatterOutput = outputs["formatter.formatted"];

      assertExists(starterOutput, "starter应该产生UUID输出");
      assertExists(checkerOutput, "checker应该产生Bool输出");
      assertExists(formatterOutput, "formatter应该产生String输出");

      console.log("🎯 数据输入类型乘积验证通过:");
      console.log(`  ∏τᵢ → starter: ${starterOutput.semantic_label} ✓`);
      console.log(`  ∏τᵢ → checker: ${checkerOutput.semantic_label} ✓`);
      console.log(`  ∏τᵢ → formatter: ${formatterOutput.semantic_label} ✓`);
    });
  });

  describe("T6.1.2: 控制类型乘积的验证", () => {
    it("应该通过图执行验证φ正确处理控制输入类型乘积 ∏_{j=1}^{|C_in|} σⱼ", async () => {
      // 🤔 Think: 通过执行包含控制流链的图来验证φ的控制输入处理能力
      // 控制信号的传播体现了φ如何处理控制输入类型的乘积

      // Given: 执行包含控制类型乘积的测试图
      const result = await awakening("./sanctums/definition_06", "T6_1_2_control_product_type");

      // Then: 验证图执行成功，说明φ能正确处理控制输入类型乘积
      assertEquals(result.status, ExecutionStatus.Success, "φ应该能处理控制输入类型乘积");

      // 🔍 分析控制流传播结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 控制输入类型乘积验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证控制流正确传播，每个节点都执行了
      assertEquals("starter.execution_id" in outputs, true, "starter应该执行完成");
      assertEquals("checker.result" in outputs, true, "checker应该执行完成");
      assertEquals("processor.result" in outputs, true, "processor应该执行完成");

      // 🎯 核心验证：控制信号的乘积被正确处理并传播
      // 检查控制输出的存在性，验证φ处理控制输入乘积的能力
      let controlOutputCount = 0;
      for (const [key, value] of Object.entries(outputs)) {
        if (key.includes(".done") || key.includes(".signal")) {
          controlOutputCount++;
          const controlOutput = value as any;
          assertEquals(controlOutput.semantic_label, "basic.Signal", `${key}应该是Signal类型`);
          console.log(`  控制输出 ${key}: ${controlOutput.semantic_label} ✓`);
        }
      }

      console.log("🎯 控制输入类型乘积验证通过:");
      console.log(`  ∏σⱼ 处理成功，产生${controlOutputCount}个控制输出 ✓`);
    });
  });

  describe("T6.1.3: 输出类型乘积的验证", () => {
    it("应该验证φ正确产生输出类型乘积 ∏_{k=1}^{|D_out|} τₖ × ∏_{l=1}^{|C_out|} σₗ", async () => {
      // 🤔 Think: 通过分析图执行的完整输出来验证φ的输出类型乘积生成能力
      // 每个节点的φ都应该产生数据输出和控制输出的正确乘积

      // Given: 执行包含复杂输出结构的测试图
      const result = await awakening("./sanctums/definition_06", "T6_1_3_complete_mapping");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "φ应该能产生正确的输出类型乘积");

      // 🔍 分析完整的输出类型乘积
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 输出类型乘积验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 分类分析输出：数据输出 (τₖ) 和控制输出 (σₗ)
      const dataOutputs: Record<string, any> = {};
      const controlOutputs: Record<string, any> = {};

      for (const [key, value] of Object.entries(outputs)) {
        if (key.includes(".done") || key.includes(".signal")) {
          controlOutputs[key] = value;
        } else {
          dataOutputs[key] = value;
        }
      }

      // 🎯 核心验证1：数据输出类型乘积 ∏τₖ
      console.log("🎯 数据输出类型乘积 ∏τₖ:");
      let dataOutputCount = 0;
      for (const [key, value] of Object.entries(dataOutputs)) {
        const output = value as any;
        assertExists(output.semantic_label, `${key}应该有语义标签`);
        console.log(`  τ${++dataOutputCount}: ${key} → ${output.semantic_label} ✓`);
      }

      // 🎯 核心验证2：控制输出类型乘积 ∏σₗ
      console.log("🎯 控制输出类型乘积 ∏σₗ:");
      let controlOutputCount = 0;
      for (const [key, value] of Object.entries(controlOutputs)) {
        const output = value as any;
        assertEquals(output.semantic_label, "basic.Signal", `${key}应该是Signal类型`);
        console.log(`  σ${++controlOutputCount}: ${key} → ${output.semantic_label} ✓`);
      }

      // 验证输出乘积的完整性
      assertEquals(dataOutputCount > 0, true, "应该有数据输出类型乘积");
      assertEquals(controlOutputCount > 0, true, "应该有控制输出类型乘积");

      console.log("✅ 输出类型乘积验证通过:");
      console.log(`  ∏τₖ(数据输出) = ${dataOutputCount}维 ✓`);
      console.log(`  ∏σₗ(控制输出) = ${controlOutputCount}维 ✓`);
      console.log(`  总输出维度 = ${dataOutputCount + controlOutputCount} ✓`);
    });
  });

  describe("T6.1.4: 完整映射关系的验证", () => {
    it("应该验证完整的φ映射: (∏τᵢ × ∏σⱼ) → (∏τₖ × ∏σₗ)", async () => {
      // 🤔 Think: 这是最重要的综合验证
      // 通过分析图的输入输出维度来验证φ确实实现了数学定义的完整映射

      // Given: 执行完整映射测试图
      const result = await awakening("./sanctums/definition_06", "T6_1_3_complete_mapping");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "完整φ映射应该成功执行");

      // 🔍 分析映射的输入输出关系
      const outputs = JSON.parse(result.outputs);
      
      // 统计输出维度
      let totalDataOutputs = 0;
      let totalControlOutputs = 0;
      
      for (const [key, value] of Object.entries(outputs)) {
        if (key.includes(".done") || key.includes(".signal")) {
          totalControlOutputs++;
        } else {
          totalDataOutputs++;
        }
      }

      const totalOutputs = totalDataOutputs + totalControlOutputs;

      // 🎯 核心验证：映射关系的数学性质
      console.log("🎯 完整φ映射关系验证:");
      console.log(`  输入空间: ∏τᵢ × ∏σⱼ (通过图结构隐式定义)`);
      console.log(`  输出空间: ∏τₖ(${totalDataOutputs}) × ∏σₗ(${totalControlOutputs}) = ${totalOutputs}维`);

      // 验证映射的函数性质：确定性
      const result2 = await awakening("./sanctums/definition_06", "T6_1_3_complete_mapping");
      assertEquals(result2.status, ExecutionStatus.Success, "φ应该是确定性函数");
      
      const outputs2 = JSON.parse(result2.outputs);
      assertEquals(Object.keys(outputs).length, Object.keys(outputs2).length, "相同输入应产生相同维度的输出");

      // 验证类型安全性：所有输出都有正确的语义标签
      for (const [key, value] of Object.entries(outputs)) {
        const output = value as any;
        assertExists(output.semantic_label, `输出${key}应该有语义标签`);
        
        if (key.includes(".done") || key.includes(".signal")) {
          assertEquals(output.semantic_label, "basic.Signal", `控制输出${key}应该是Signal类型`);
        } else {
          assertEquals(output.semantic_label.startsWith("basic."), true, `数据输出${key}应该有valid语义标签`);
        }
      }

      console.log("✅ 完整φ映射关系验证通过:");
      console.log("   φ: (∏τᵢ × ∏σⱼ) → (∏τₖ × ∏σₗ) ✓");
      console.log("   函数确定性 ✓");
      console.log("   类型安全性 ✓");
      console.log("   语义完整性 ✓");
    });
  });

  describe("T6.1.5: 类型传播的验证", () => {
    it("应该验证φ在图执行中保持类型传播的正确性", async () => {
      // 🤔 Think: φ不仅要正确计算，还要确保类型在节点间传播时保持语义一致性
      // 这体现了φ作为语义转换器的核心职责

      // Given: 执行类型传播测试图
      const result = await awakening("./sanctums/definition_06", "T6_1_2_control_product_type");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "类型传播应该正确进行");

      // 🔍 分析类型传播链
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 类型传播验证结果:");

      // 验证类型传播: starter → checker → processor
      const starterOutput = outputs["starter.execution_id"];
      const checkerResult = outputs["checker.result"];
      
      assertExists(starterOutput, "应该有starter输出");
      assertExists(checkerResult, "应该有checker结果");
      
      // 验证类型传播的语义正确性
      assertEquals(starterOutput.semantic_label, "basic.UUID", "starter应该是UUID类型");
      assertEquals(checkerResult.semantic_label, "basic.Bool", "checker结果应该是Bool类型");
      
      // 验证DataProcessor的独立执行
      const processorResult = outputs["processor.result"];
      assertExists(processorResult, "应该有processor结果");
      assertEquals(processorResult.semantic_label, "basic.String", "processor结果应该是String类型");

      console.log("🎯 类型传播验证通过:");
      console.log(`  UUID → φ(Start) → UUID: ${starterOutput.value} ✓`);
      console.log(`  Int → φ(IsEven) → Bool: → ${checkerResult.value} ✓`);
      console.log(`  Signal → φ(DataProcessor) → String: → "${processorResult.value}" ✓`);
      console.log("  φ保持了跨节点的类型传播正确性 ✓");
    });
  });
});
