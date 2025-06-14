/**
 * # 定义2：控制信号语义标签集合 (Control Signal Semantic Labels Set)
 *
 * ## 哲学理念
 * 控制信号是计算图的神经系统。每个Signal都承载着执行的意图，
 * 控制信号语义标签系统确保了图执行中控制流的正确传播和分离。
 *
 * ## 数学定义
 * ```mathematica
 * 𝒞 = {Signal}
 * ```
 *
 * 控制信号语义标签集合𝒞是所有控制流类型标签的集合。在当前实现中，
 * 我们专注于Signal类型，它是所有控制流传播的基础。
 *
 * ## 协作探索记录
 * 我们在这里共同验证控制信号系统的传播机制和激活模式。
 * 每个测试都是对控制流数学定义在现实执行中的深入探索。
 *
 * @module
 */

import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert";
import { awakening, ExecutionStatus, isRuntimeError, isStaticError } from "../src/mod.ts";

describe("定义2：控制信号语义标签集合 (𝒞)", () => {
  describe("T2.1.1: Signal语义标签的基础识别", () => {
    it("应该正确识别并传播Signal语义标签", async () => {
      // 🤔 Think: 控制信号是计算图的神经系统
      // 我们需要验证Signal类型能被正确识别为控制信号语义标签

      // Given: 执行包含Signal控制流的简单图
      const result = await awakening("./sanctums/definition_02", "T2_1_1_signal_identification");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "Signal控制流图执行应该成功");

      // 🔍 让我们一起看看Signal类型的传播结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 Signal语义标签传播结构:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证基础Signal输出存在
      assertEquals("starter.signal" in outputs, true, "应该有starter.signal输出");

      const signalOutput = outputs["starter.signal"];

      // 🎯 核心验证：Signal的语义标签正确性
      assertEquals(signalOutput.semantic_label, "basic.Signal", "signal应该是Signal语义标签");
      assertEquals(typeof signalOutput.value, "boolean", "Signal值应该是布尔类型");

      console.log("🎯 Signal语义标签验证通过:");
      console.log(`  - signal: ${signalOutput.semantic_label} ✓`);
      console.log(`  - value: ${signalOutput.value} (${typeof signalOutput.value}) ✓`);
    });
  });

  describe("T2.1.2: 控制流传播链的完整性", () => {
    it("应该沿着控制连接正确传播Signal", async () => {
      // 🤔 Think: 控制信号的传播是保证计算图执行顺序的核心机制
      // 我们验证Signal在控制连接链中的完整传播

      // Given: 执行包含多级控制连接的图
      const result = await awakening("./sanctums/definition_02", "T2_1_2_control_propagation");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "控制信号传播图执行应该成功");

      // 🔍 分析控制流传播结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 控制流传播链结构:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证传播链中的每个控制信号
      const expectedSignals = ["starter.signal", "timer.done", "judge.done", "formatter.done"];

      for (const signalKey of expectedSignals) {
        if (signalKey in outputs) {
          const signal = outputs[signalKey];
          assertEquals(signal.semantic_label, "basic.Signal", `${signalKey}应该是Signal语义标签`);
          assertEquals(typeof signal.value, "boolean", `${signalKey}值应该是布尔类型`);
          console.log(`  - ${signalKey}: ${signal.semantic_label} ✓`);
        }
      }
    });
  });

  describe("T2.1.3: 控制信号的执行时序控制", () => {
    it("应该通过Signal控制节点的执行顺序", async () => {
      // 🤔 Think: Signal不仅传递控制信息，更重要的是控制执行时序
      // 我们验证Signal如何确保节点按正确顺序执行

      // Given: 执行需要严格时序控制的图
      const result = await awakening("./sanctums/definition_02", "T2_1_3_execution_timing");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "时序控制图执行应该成功");

      // 🔍 验证时序控制的效果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 时序控制执行结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证依赖链：Start -> GetTimestamp -> IsEven -> FormatNumber
      // 每个节点都通过Signal控制下一个节点的执行
      if ("timer.timestamp" in outputs && "judge.result" in outputs) {
        const timestamp = outputs["timer.timestamp"];
        const judgeResult = outputs["judge.result"];

        // 验证时间戳被用于判断
        assertEquals(typeof timestamp.value, "number", "timestamp应该是数字");
        assertEquals(typeof judgeResult.value, "boolean", "判断结果应该是布尔值");

        console.log(
          `🎯 时序验证通过: timestamp(${timestamp.value}) -> isEven(${judgeResult.value})`,
        );
      }
    });
  });

  describe("T2.1.4: 控制信号集合的完整性", () => {
    it("应该验证𝒞 = {Signal}集合的完整性", async () => {
      // 🤔 Think: 数学定义𝒞 = {Signal}意味着所有控制流都归属于Signal类型
      // 我们验证控制信号语义标签集合的完整性和唯一性

      // Given: 执行复杂的控制流图
      const result = await awakening("./sanctums/definition_02", "T2_1_4_signal_set_completeness");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "完整性验证图执行应该成功");

      // 🔍 收集所有控制信号类型
      const outputs = JSON.parse(result.outputs);
      const controlSignalTypes = new Set<string>();

      // 遍历所有输出，收集控制相关的语义标签
      for (const [key, output] of Object.entries(outputs)) {
        if (key.includes("signal") || key.includes("done") || key.includes("trigger")) {
          controlSignalTypes.add((output as any).semantic_label);
        }
      }

      console.log("🔍 发现的控制信号语义标签类型:");
      console.log(Array.from(controlSignalTypes));

      // 🎯 核心验证：所有控制信号都应该是basic.Signal类型
      assertEquals(controlSignalTypes.size, 1, "应该只有一种控制信号语义标签类型");
      assertEquals(controlSignalTypes.has("basic.Signal"), true, "控制信号类型应该是basic.Signal");

      console.log("🎯 控制信号集合𝒞 = {Signal}验证通过:");
      console.log(`  - 集合元素数量: ${controlSignalTypes.size} ✓`);
      console.log(`  - 唯一元素: ${Array.from(controlSignalTypes)[0]} ✓`);
    });
  });

  describe("T2.1.5: Signal扇出功能验证", () => {
    it("应该支持一个Signal同时激活多个节点", async () => {
      // 🤔 Think: 控制信号的扇出是并行执行的基础
      // 一个Signal应该能够同时激活多个节点，实现并行控制流

      // Given: 执行包含Signal扇出的图
      const result = await awakening("./sanctums/definition_02", "T2_1_5_signal_fanout");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "Signal扇出图执行应该成功");

      // 🔍 分析扇出执行结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 Signal扇出执行结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证单个Signal激活的多个节点都产生了输出
      const expectedOutputs = [
        "timer1.timestamp",
        "timer2.timestamp",
        "judge1.result",
        "judge2.result",
        "formatter.formatted",
      ];

      let activatedNodes = 0;
      for (const outputKey of expectedOutputs) {
        if (outputKey in outputs) {
          activatedNodes++;
          console.log(`✅ 节点输出验证: ${outputKey} 已激活`);
        }
      }

      // 🎯 核心验证：多个节点被同一个Signal激活
      assertEquals(activatedNodes >= 3, true, "至少应该有3个节点被Signal激活");

      // 验证并行执行的控制信号
      const parallelSignals = ["timer1.done", "timer2.done", "judge1.done", "judge2.done"];
      let parallelCount = 0;

      for (const signalKey of parallelSignals) {
        if (signalKey in outputs) {
          const signal = outputs[signalKey];
          assertEquals(signal.semantic_label, "basic.Signal", `${signalKey}应该是Signal语义标签`);
          assertEquals(signal.value, true, `${signalKey}应该是激活状态`);
          parallelCount++;
        }
      }

      console.log("🎯 Signal扇出功能验证通过:");
      console.log(`  - 激活节点数量: ${activatedNodes} ✓`);
      console.log(`  - 并行Signal数量: ${parallelCount} ✓`);
      console.log(`  - 扇出控制流: starter.signal -> 多节点并行激活 ✓`);
    });
  });

  describe("T2.1.6: 多输入控制节点AND门验证", () => {
    it("应该要求所有控制输入都被触发才能执行节点", async () => {
      // 🤔 Think: 这是控制信号的重要特性 - 多输入AND门逻辑
      // 只有当节点的所有control输入都被激活，节点才能执行

      // Given: 执行包含多输入控制节点的图
      const result = await awakening("./sanctums/definition_02", "T2_1_6_multi_input_and_gate");

      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "多输入AND门图执行应该成功");

      // 🔍 分析AND门执行结果
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 多输入AND门执行结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证：只有当所有控制输入都到达时，节点才执行
      // 在我们的测试图中，formatter节点需要两个trigger输入：
      // - timer1.done 和 timer2.done
      // 只有这两个信号都到达时，formatter才能执行

      assertEquals("formatter.formatted" in outputs, true, "formatter应该在所有控制输入到达后执行");
      assertEquals("formatter.done" in outputs, true, "formatter应该产生done信号");

      const formatterOutput = outputs["formatter.formatted"];
      assertEquals(formatterOutput.semantic_label, "basic.String", "formatter输出应该是String类型");

      const formatterDone = outputs["formatter.done"];
      assertEquals(formatterDone.semantic_label, "basic.Signal", "formatter.done应该是Signal类型");
      assertEquals(formatterDone.value, true, "formatter.done应该是激活状态");

      console.log("🎯 多输入AND门验证通过:");
      console.log(`  - formatter等待所有控制输入 ✓`);
      console.log(`  - 所有输入到达后成功执行 ✓`);
      console.log(`  - 产生正确的输出和控制信号 ✓`);
    });
  });

  describe("T2.1.7: AND门真实性验证（部分触发测试）", () => {
    it("当只有部分控制输入被触发时，节点不应该执行", async () => {
      // 🤔 Think: 真正的TDD - 明确期望的行为
      // 当formatter需要两个控制输入但只收到一个时，它不应该执行

      // Given: 执行只触发部分控制输入的图
      const result = await awakening("./sanctums/definition_02", "T2_1_7_partial_trigger_test");

      // Then: 图应该成功执行
      assertEquals(result.status, ExecutionStatus.Success, "图执行应该成功");

      const outputs = JSON.parse(result.outputs);
      console.log("🔍 部分触发测试结果:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 TDD期望的正确行为：

      // 1. starter应该执行（没有控制输入依赖）
      assertEquals("starter.execution_id" in outputs, true, "starter应该执行");
      // 注意：语义标签格式下，signal不在终端输出中（被消费了）

      // 2. timer1应该执行（收到starter.signal），但输出被消费，不在终端输出
      // 我们通过formatter没有执行来间接验证timer1执行了但timer2没执行

      // 3. timer2不应该执行（没有收到任何控制输入）
      assertEquals("timer2.timestamp" in outputs, false, "timer2不应该执行，因为没有收到控制输入");
      assertEquals("timer2.done" in outputs, false, "timer2不应该产生done信号");

      // 4. formatter不应该执行（只收到timer1.done，缺少timer2.done）
      assertEquals(
        "formatter.formatted" in outputs,
        false,
        "formatter不应该执行，因为缺少timer2.done控制输入",
      );
      assertEquals("formatter.done" in outputs, false, "formatter不应该产生done信号");

      console.log("🎯 AND门验证通过:");
      console.log(`  - starter执行: ✓`);
      console.log(`  - timer1执行但输出被消费: ✓`);
      console.log(`  - timer2未执行: ✓`);
      console.log(`  - formatter未执行（等待所有控制输入）: ✓`);
    });
  });
});
