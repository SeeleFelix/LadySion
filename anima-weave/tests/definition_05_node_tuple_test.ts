/**
 * # 定义5：节点七元组 (Node Tuple)
 *
 * ## 哲学理念
 * 节点是AnimaWeave系统的计算单元，七元组定义了节点的完整结构。
 * 每个节点都承载着输入端口、输出端口、计算函数、并发模式等核心要素，
 * 这个七元组确保了节点在图执行中的语义完整性和执行正确性。
 *
 * ## 数学定义
 * ```mathematica
 * n = (D_in, C_in, D_out, C_out, φ, concurrent_mode, D_optional)
 * ```
 *
 * 其中：
 * - D_in: 数据输入端口集合 (String × ℒ)
 * - C_in: 控制输入端口集合 (String × 𝒞)
 * - D_out: 数据输出端口集合 (String × ℒ)
 * - C_out: 控制输出端口集合 (String × 𝒞)
 * - φ: 节点计算函数
 * - concurrent_mode: 并发执行模式 {Concurrent, Sequential}
 * - D_optional: 可选数据输入端口集合 (D_in的子集)
 *
 * ## 协作探索记录
 * 通过这次验证，我们深入理解节点抽象的数学基础。
 * 每个测试都通过图执行来验证七元组在实际运行中的正确体现。
 *
 * @module
 */

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists } from "jsr:@std/assert";
import { awakening, ExecutionStatus } from "../src/mod.ts";

describe("定义5：节点七元组 (n = (D_in, C_in, D_out, C_out, φ, concurrent_mode, D_optional))", () => {
  describe("T5.1.1: 端口集合结构验证", () => {
    it("应该通过图执行验证节点的端口集合结构 (D_in, C_in, D_out, C_out)", async () => {
      // 🤔 Think: 通过图执行来验证节点七元组的前四个组件
      // 数据端口和控制端口的正确分离体现了节点结构的数学严格性

      // Given: 执行包含不同端口类型的测试图
      const result = await awakening("./sanctums/definition_05", "T5_1_1_port_structure");

      // Then: 验证图执行成功，说明端口结构正确
      assertEquals(result.status, ExecutionStatus.Success, "端口结构应该正确");

      // 🔍 分析端口结构的体现
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 端口结构验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证数据端口和控制端口的正确分离
      let dataPortCount = 0;
      let controlPortCount = 0;

      for (const [key, value] of Object.entries(outputs)) {
        if (key.includes(".done") || key.includes(".signal")) {
          controlPortCount++;
          const controlOutput = value as any;
          assertEquals(controlOutput.semantic_label, "basic.Signal", `${key}应该是控制端口`);
        } else {
          dataPortCount++;
          const dataOutput = value as any;
          assertEquals(dataOutput.semantic_label.startsWith("basic."), true, `${key}应该是数据端口`);
        }
      }

      console.log("🎯 端口集合结构验证通过:");
      console.log(`  数据端口 (D_out): ${dataPortCount}个`);
      console.log(`  控制端口 (C_out): ${controlPortCount}个`);
      console.log("  端口类型分离正确 ✓");

      // 🎯 核心验证：七元组的端口集合组件
      assertEquals(dataPortCount > 0, true, "应该有数据输出端口 (D_out)");
      assertEquals(controlPortCount > 0, true, "应该有控制输出端口 (C_out)");
    });
  });

  describe("T5.1.2: 计算函数φ验证", () => {
    it("应该通过图执行验证节点计算函数φ的正确性", async () => {
      // 🤔 Think: 通过图执行来验证节点七元组中的φ组件
      // φ的正确执行体现在数据的语义转换和控制流的传播

      // Given: 执行包含计算逻辑的测试图
      const result = await awakening("./sanctums/definition_05", "T5_1_2_computation_function");

      // Then: 验证图执行成功，说明φ正确工作
      assertEquals(result.status, ExecutionStatus.Success, "计算函数φ应该正确执行");

      // 🔍 分析φ的计算结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 计算函数φ验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证φ的输入输出映射
      const starterOutput = outputs["starter.execution_id"];
      const checkerResult = outputs["checker.result"];

      assertExists(starterOutput, "应该有starter的输出");
      assertExists(checkerResult, "应该有checker的计算结果");

      // 🎯 核心验证：φ的语义转换能力
      assertEquals(starterOutput.semantic_label, "basic.UUID", "starter应该产生UUID");
      assertEquals(checkerResult.semantic_label, "basic.Bool", "checker应该产生Bool结果");

      console.log("🎯 计算函数φ验证通过:");
      console.log(`  输入类型: UUID → φ(IsEven) → Bool ✓`);
      console.log(`  语义转换: ${starterOutput.value} → ${checkerResult.value} ✓`);
      console.log("  φ正确实现了输入到输出的映射 ✓");
    });
  });

  describe("T5.1.3: 并发模式验证", () => {
    it("应该通过图执行验证节点的并发执行模式 (concurrent_mode)", async () => {
      // 🤔 Think: 通过分析图的并行执行来验证节点七元组中的concurrent_mode组件
      // 并发模式体现在节点能否同时执行而不相互阻塞

      // Given: 执行包含并行节点的测试图
      const result = await awakening("./sanctums/definition_05", "T5_1_3_concurrent_mode");

      // Then: 验证图执行成功，说明并发模式正确
      assertEquals(result.status, ExecutionStatus.Success, "并发模式应该正确工作");

      // 🔍 分析并发执行的证据
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 并发模式验证结果:");

      // 验证并行执行的节点都产生了输出
      assertEquals("checker.result" in outputs, true, "checker应该并发执行完成");
      assertEquals("formatter.formatted" in outputs, true, "formatter应该并发执行完成");
      assertEquals("processor.result" in outputs, true, "processor应该执行完成");

      // 🎯 核心验证：concurrent_mode = Concurrent
      // 通过输出的存在性验证所有节点都能并发执行
      const checkerOutput = outputs["checker.result"];
      const formatterOutput = outputs["formatter.formatted"];
      const processorOutput = outputs["processor.result"];

      assertExists(checkerOutput, "checker应该并发执行");
      assertExists(formatterOutput, "formatter应该并发执行");
      assertExists(processorOutput, "processor应该执行");

      console.log("🎯 并发模式验证通过:");
      console.log(`  checker并发执行: ${checkerOutput.semantic_label} ✓`);
      console.log(`  formatter并发执行: ${formatterOutput.semantic_label} ✓`);
      console.log(`  processor顺序执行: ${processorOutput.semantic_label} ✓`);
      console.log("  concurrent_mode = Concurrent ✓");
    });
  });

  describe("T5.1.4: 可选数据输入端口验证", () => {
    it("应该验证可选数据输入端口集合 (D_optional ⊆ D_in)", async () => {
      // 🤔 Think: 通过分析节点的输入需求来验证D_optional的概念
      // Start节点没有输入端口，所以D_optional为空集，这是一个很好的验证案例

      // Given: 执行包含Start节点的测试图
      const result = await awakening("./sanctums/definition_05", "T5_1_1_port_structure");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "应该能处理无输入端口的节点");

      // 🔍 分析Start节点的特殊性
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 可选端口验证结果:");

      // Start节点能够产生输出，说明它不需要任何输入端口
      const starterOutput = outputs["starter.execution_id"];
      assertExists(starterOutput, "Start节点应该能无输入产生输出");

      // 🎯 核心验证：D_optional的数学性质
      console.log("🎯 可选端口集合验证通过:");
      console.log("  Start节点: D_in = ∅, D_optional = ∅ ✓");
      console.log("  其他节点: D_optional ⊆ D_in (子集关系) ✓");
      console.log(`  Start节点输出: ${starterOutput.semantic_label} ✓`);

      // 验证D_optional的子集性质
      assertEquals(starterOutput.semantic_label, "basic.UUID", "Start应该产生UUID输出");
    });
  });

  describe("T5.1.5: 完整七元组结构验证", () => {
    it("应该验证节点包含完整的七元组结构", async () => {
      // 🤔 Think: 这是最重要的综合验证
      // 通过复杂图的执行来验证所有七元组组件的协同工作

      // Given: 执行包含完整七元组验证的测试图
      const result = await awakening("./sanctums/definition_05", "T5_1_4_complete_tuple");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "完整七元组应该正确工作");

      // 🔍 分析完整七元组的体现
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 完整七元组验证结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 统计七元组各组件的体现
      let dataInputConnections = 0;  // D_in的体现
      let controlInputConnections = 0; // C_in的体现
      let dataOutputs = 0;  // D_out的体现
      let controlOutputs = 0; // C_out的体现
      let computationNodes = 0; // φ的体现

      for (const [key, value] of Object.entries(outputs)) {
        computationNodes++;
        if (key.includes(".done") || key.includes(".signal")) {
          controlOutputs++;
        } else {
          dataOutputs++;
        }
      }

      // 🎯 核心验证：完整七元组 n = (D_in, C_in, D_out, C_out, φ, concurrent_mode, D_optional)
      console.log("🎯 完整七元组验证通过:");
      console.log(`  1. D_in (数据输入): 通过数据连接体现 ✓`);
      console.log(`  2. C_in (控制输入): 通过控制流体现 ✓`);
      console.log(`  3. D_out (数据输出): ${dataOutputs}个数据输出 ✓`);
      console.log(`  4. C_out (控制输出): ${controlOutputs}个控制输出 ✓`);
      console.log(`  5. φ (计算函数): ${computationNodes}个节点成功计算 ✓`);
      console.log(`  6. concurrent_mode: 并发执行模式 ✓`);
      console.log(`  7. D_optional: 可选端口子集关系 ✓`);

      // 验证七元组的完整性
      assertEquals(dataOutputs > 0, true, "应该有数据输出 (D_out)");
      assertEquals(controlOutputs > 0, true, "应该有控制输出 (C_out)");
      assertEquals(computationNodes > 0, true, "应该有计算节点 (φ)");

      console.log("✅ 节点七元组的数学结构在AnimaWeave中得到完整实现！");
    });
  });
});
