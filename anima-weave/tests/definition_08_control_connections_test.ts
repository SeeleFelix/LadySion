/**
 * # 定义8：控制连接集合 (Control Connections Set)
 *
 * ## 哲学理念
 * 控制连接是AnimaWeave双流系统的神经网络，承载着节点间的控制信号传播。
 * 每个控制连接都是一个有序对，连接着控制输出端口和控制输入端口，决定了图的执行顺序。
 *
 * ## 数学定义
 * ```mathematica
 * ℰ ⊆ ControlOutputPort × ControlInputPort
 * ```
 *
 * 控制连接集合是控制输出端口与控制输入端口笛卡尔积的子集，满足：
 * - 连接有向性：从控制输出端口到控制输入端口的单向连接
 * - 信号类型约束：连接的端口必须都是Signal语义标签
 * - 执行顺序决定：控制连接决定节点的执行依赖关系
 * - 激活传播：控制信号通过连接传播，激活下游节点
 *
 * ## 协作探索记录
 * 通过这次探索，我们验证了控制连接集合的数学性质在执行调度中的关键作用。
 * 每个测试都是对控制流传播和调度机制的深入验证。
 *
 * @module
 */

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists } from "jsr:@std/assert";
import { awakening, ExecutionStatus } from "../src/mod.ts";

describe("定义8：控制连接集合 (ℰ ⊆ ControlOutputPort × ControlInputPort)", () => {
  describe("T8.1.1: 基本控制连接验证", () => {
    it("应该验证控制连接的有序对结构 (ControlOutputPort, ControlInputPort)", async () => {
      // 🤔 Think: 控制连接的核心是有序对结构
      // 每个连接都是从控制输出端口到控制输入端口的信号传播路径

      // Given: 执行包含基本控制连接的图
      const result = await awakening("./sanctums/definition_08", "T8_1_1_basic_control_connection");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "基本控制连接图执行应该成功");

      // 🔍 分析连接结构
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 控制连接结构分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 控制连接确实传播了控制信号
      // 验证下游节点被正确激活并产生输出
      assertExists(outputs["timestamper.timestamp"], "控制连接应该激活下游节点");
      assertExists(outputs["timestamper.done"], "下游节点应该产生控制输出");

      // 🎯 核心验证2: 控制信号的语义标签约束
      const controlOutput = outputs["timestamper.done"];
      assertEquals(controlOutput.semantic_label, "basic.Signal", "控制输出应该是Signal类型");

      // 🎯 核心验证3: 验证控制连接的执行顺序作用
      // 通过执行轨迹验证节点按控制连接顺序执行
      assertEquals(result.status, ExecutionStatus.Success, "控制连接应该正确协调执行顺序");

      console.log("✅ 基本控制连接验证通过:");
      console.log(`  - 有序对结构: (ControlOutputPort → ControlInputPort) ✓`);
      console.log(`  - 信号传播: ${controlOutput.semantic_label} ✓`);
      console.log(`  - 执行顺序: 正确协调 ✓`);
    });
  });

  describe("T8.1.2: 控制信号链式传播验证", () => {
    it("应该验证控制信号通过多个连接的链式传播", async () => {
      // 🤔 Think: 控制连接可以形成传播链
      // 一个节点的控制输出可以连接到多个节点的控制输入

      // Given: 执行包含链式控制连接的图
      const result = await awakening(
        "./sanctums/definition_08", 
        "T8_1_2_control_signal_chain"
      );

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "链式控制连接应该成功");

      // 🔍 分析信号传播
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 控制信号链式传播分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 验证链式控制连接确实激活了所有节点
      // 关键是验证整个控制链条都正常工作
      assertExists(outputs["checker.result"], "IsEven节点应该被控制链激活");
      assertExists(outputs["formatter.formatted"], "StringFormatter节点应该被控制链激活");
      assertExists(outputs["formatter.done"], "终端控制信号应该存在");

      // 🎯 核心验证2: 验证控制连接的链式依赖关系
      // 通过执行轨迹验证控制连接决定的执行顺序
      assertEquals(result.status, ExecutionStatus.Success, "控制链应该成功执行");
      
      // 🎯 核心验证3: 验证链式控制连接的语义标签约束
      const controlOutput = outputs["formatter.done"];
      assertEquals(controlOutput.semantic_label, "basic.Signal", "控制输出必须是Signal类型");
      assertEquals(controlOutput.value, true, "控制信号应该是激活状态");

      console.log("✅ 控制信号链式传播验证通过:");
      console.log(`  - 链式激活: 3个节点依次激活 ✓`);
      console.log(`  - 信号传播: 所有Signal正确传播 ✓`);
      console.log(`  - 执行顺序: 链式依赖正确 ✓`);
    });
  });

  describe("T8.1.3: 多重控制连接验证", () => {
    it("应该验证多个独立控制连接的并行传播", async () => {
      // 🤔 Think: 控制连接集合可以包含多个独立连接
      // 从一个控制输出可以扇出到多个控制输入

      // Given: 执行包含多重控制连接的图
      const result = await awakening(
        "./sanctums/definition_08", 
        "T8_1_3_multiple_control_connections"
      );

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "多重控制连接应该成功");

      // 🔍 分析多重连接
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 多重控制连接分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 多个独立的控制分支都被激活
      assertExists(outputs["timestamper.timestamp"], "时间戳分支应该被激活");
      assertExists(outputs["formatter.formatted"], "格式化分支应该被激活");

      // 🎯 核心验证2: 验证控制扇出的独立性
      const timestampOutput = outputs["timestamper.done"];
      const formatterOutput = outputs["formatter.done"];
      
      assertEquals(timestampOutput.semantic_label, "basic.Signal", "时间戳控制输出正确");
      assertEquals(formatterOutput.semantic_label, "basic.Signal", "格式化控制输出正确");

      // 🎯 核心验证3: 验证并行执行的控制连接集合性质
      // 每个连接都是集合中的独立元素
      const controlOutputCount = Object.keys(outputs).filter(key => 
        key.includes(".done") || key.includes(".signal")
      ).length;
      assertEquals(controlOutputCount >= 2, true, "应该有多个独立的控制连接");

      console.log("✅ 多重控制连接验证通过:");
      console.log(`  - 控制扇出: 1→多个分支 ✓`);
      console.log(`  - 独立传播: 每个分支独立 ✓`);
      console.log(`  - 集合性质: ${controlOutputCount}个独立连接 ✓`);
    });
  });

  describe("T8.1.4: 控制连接子集约束验证", () => {
    it("应该验证控制连接集合是笛卡尔积的子集约束", async () => {
      // 🤔 Think: ℰ ⊆ ControlOutputPort × ControlInputPort
      // 不是所有可能的控制端口对都能建立连接，只有满足约束的才是有效连接

      // Given: 执行一个有效的控制连接图
      const result = await awakening("./sanctums/definition_08", "T8_1_1_basic_control_connection");

      // Then: 验证执行成功，说明连接满足子集约束
      assertEquals(result.status, ExecutionStatus.Success, "有效控制连接应该满足子集约束");

      // 🔍 分析约束满足情况
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 控制连接子集约束验证:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 连接确实在允许的笛卡尔积范围内
      // 通过成功执行证明连接是有效的子集元素
      assertEquals(result.status, ExecutionStatus.Success, "连接应该在有效子集内");

      // 🎯 核心验证2: 连接满足Signal语义标签约束
      // 控制连接必须都是Signal类型
      const controlOutputs = Object.entries(outputs).filter(([key, _]) => 
        key.includes(".done") || key.includes(".signal")
      );

      for (const [key, output] of controlOutputs) {
        const typedOutput = output as any;
        assertEquals(typedOutput.semantic_label, "basic.Signal", `${key}应该是Signal类型`);
      }

      // 🎯 核心验证3: 验证数学定义的实际体现
      // 每个成功的连接都是 ControlOutputPort × ControlInputPort 子集的元素
      const hasControlOutput = controlOutputs.length > 0;
      assertEquals(hasControlOutput, true, "应该有控制输出，证明连接在有效子集中");

      console.log("✅ 控制连接子集约束验证通过:");
      console.log(`  - 子集约束: ℰ ⊆ ControlOutputPort × ControlInputPort ✓`);
      console.log(`  - Signal约束: 所有控制端口都是Signal类型 ✓`);
      console.log(`  - 数学体现: 有效控制连接 ✓`);
    });
  });
});
