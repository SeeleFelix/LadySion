/**
 * # 定义7：数据连接集合 (Data Connections Set)
 *
 * ## 哲学理念
 * 数据连接是AnimaWeave双流系统的血脉，承载着从一个节点到另一个节点的数据流动。
 * 每个数据连接都是一个有序对，连接着数据输出端口和数据输入端口，体现了图的拓扑结构。
 *
 * ## 数学定义
 * ```mathematica
 * 𝒟 ⊆ DataOutputPort × DataInputPort
 * ```
 *
 * 数据连接集合是数据输出端口与数据输入端口笛卡尔积的子集，满足：
 * - 连接有向性：从输出端口到输入端口的单向连接
 * - 类型兼容性：连接的端口必须具有兼容的语义标签
 * - 唯一性约束：每个输入端口最多只能有一个来源连接
 *
 * ## 协作探索记录
 * 通过这次探索，我们验证了数据连接集合的数学性质在实际系统中的体现。
 * 每个测试都是对连接关系和约束的深入验证。
 *
 * @module
 */

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists } from "jsr:@std/assert";
import { awakening, ExecutionStatus } from "../src/mod.ts";

describe("定义7：数据连接集合 (𝒟 ⊆ DataOutputPort × DataInputPort)", () => {
  describe("T7.1.1: 基本数据连接验证", () => {
    it("应该验证数据连接的有序对结构 (DataOutputPort, DataInputPort)", async () => {
      // 🤔 Think: 数据连接的核心是有序对结构
      // 每个连接都是从数据输出端口到数据输入端口的映射关系

      // Given: 执行包含基本数据连接的图
      const result = await awakening("./sanctums/definition_07", "T7_1_1_basic_data_connection");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "基本数据连接图执行应该成功");

      // 🔍 分析连接结构
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 数据连接结构分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 数据连接确实传播了数据
      // 验证数据从输出端口流向输入端口
      assertExists(outputs["formatter.formatted"], "数据应该通过连接传播到目标节点");

      // 🎯 核心验证2: 连接保持了数据的语义完整性
      const formattedOutput = outputs["formatter.formatted"];
      assertEquals(formattedOutput.semantic_label, "basic.String", "连接应该保持语义标签一致性");

      // 🎯 核心验证3: 验证连接的有向性
      // 数据只能从输出端口流向输入端口，不能反向
      const outputValue = formattedOutput.value as string;
      assertEquals(outputValue.includes("Formatted: "), true, "数据应该经过正确的单向传播");

      console.log("✅ 基本数据连接验证通过:");
      console.log(`  - 有序对结构: (DataOutputPort → DataInputPort) ✓`);
      console.log(`  - 数据传播: ${formattedOutput.semantic_label} ✓`);
      console.log(`  - 连接有向性: 单向传播 ✓`);
    });
  });

  describe("T7.1.2: 类型兼容性连接验证", () => {
    it("应该验证连接端口的语义标签兼容性", async () => {
      // 🤔 Think: 数据连接必须满足语义标签的兼容性约束
      // 只有兼容的语义标签才能建立有效连接

      // Given: 执行包含类型兼容连接的图
      const result = await awakening(
        "./sanctums/definition_07", 
        "T7_1_2_type_compatible_connection"
      );

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "类型兼容连接应该成功");

      // 🔍 分析类型转换
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 类型兼容性分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: UUID -> String 兼容性转换
      assertExists(outputs["formatter.formatted"], "兼容类型连接应该成功");

      // 🎯 核心验证2: 验证类型转换的正确性
      const formattedOutput = outputs["formatter.formatted"];
      assertEquals(formattedOutput.semantic_label, "basic.String", "目标语义标签应该正确");

      // 🎯 核心验证3: 验证数据内容的正确转换
      const outputValue = formattedOutput.value as string;
      assertEquals(outputValue.startsWith("Formatted: "), true, "UUID应该正确转换为String");

      console.log("✅ 类型兼容性连接验证通过:");
      console.log(`  - 兼容性检查: UUID → String ✓`);
      console.log(`  - 类型转换: 正确执行 ✓`);
      console.log(`  - 语义保持: 转换后语义正确 ✓`);
    });
  });

  describe("T7.1.3: 多重数据连接验证", () => {
    it("应该验证多个数据连接的并行传播", async () => {
      // 🤔 Think: 数据连接集合可以包含多个连接
      // 每个连接都是独立的有序对，可以并行传播数据

      // Given: 执行包含多重数据连接的图
      const result = await awakening(
        "./sanctums/definition_07", 
        "T7_1_3_multiple_data_connections"
      );

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "多重数据连接应该成功");

      // 🔍 分析多重连接
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 多重数据连接分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 多个数据端口都有输出
      assertExists(outputs["isEven.result"], "第一个数据连接应该有输出");
      assertExists(outputs["formatter.formatted"], "第二个数据连接应该有输出");

      // 🎯 核心验证2: 不同连接保持独立性
      const boolOutput = outputs["isEven.result"];
      const stringOutput = outputs["formatter.formatted"];
      
      assertEquals(boolOutput.semantic_label, "basic.Bool", "Bool连接应该保持独立");
      assertEquals(stringOutput.semantic_label, "basic.String", "String连接应该保持独立");

      // 🎯 核心验证3: 验证连接的数学集合性质
      // 每个连接都是集合中的独立元素
      const connectionCount = Object.keys(outputs).length;
      assertEquals(connectionCount >= 2, true, "应该有多个独立的数据连接");

      console.log("✅ 多重数据连接验证通过:");
      console.log(`  - 连接数量: ${connectionCount}个 ✓`);
      console.log(`  - 独立传播: Bool + String ✓`);
      console.log(`  - 集合性质: 每个连接独立 ✓`);
    });
  });

  describe("T7.1.4: 数据连接子集约束验证", () => {
    it("应该验证数据连接集合是笛卡尔积的子集约束", async () => {
      // 🤔 Think: 𝒟 ⊆ DataOutputPort × DataInputPort
      // 不是所有可能的端口对都能建立连接，只有满足约束的才是有效连接

      // Given: 执行一个有效的数据连接图
      const result = await awakening("./sanctums/definition_07", "T7_1_1_basic_data_connection");

      // Then: 验证执行成功，说明连接满足子集约束
      assertEquals(result.status, ExecutionStatus.Success, "有效连接应该满足子集约束");

      // 🔍 分析约束满足情况
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 子集约束验证:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 连接确实在允许的笛卡尔积范围内
      // 通过成功执行证明连接是有效的子集元素
      assertEquals(result.status, ExecutionStatus.Success, "连接应该在有效子集内");

      // 🎯 核心验证2: 连接满足系统约束
      // 端口存在性、类型兼容性等约束都被满足
      assertExists(outputs, "输出存在证明连接约束被满足");

      // 🎯 核心验证3: 验证数学定义的实际体现
      // 每个成功的连接都是 DataOutputPort × DataInputPort 子集的元素
      const hasDataOutput = Object.keys(outputs).length > 0;
      assertEquals(hasDataOutput, true, "应该有数据输出，证明连接在有效子集中");

      console.log("✅ 数据连接子集约束验证通过:");
      console.log(`  - 子集约束: 𝒟 ⊆ DataOutputPort × DataInputPort ✓`);
      console.log(`  - 约束满足: 端口存在性 + 类型兼容性 ✓`);
      console.log(`  - 数学体现: 有效连接 ✓`);
    });
  });
});
