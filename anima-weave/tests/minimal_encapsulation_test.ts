/**
 * # 最小实现：子图封装机制验证
 *
 * ## 核心验证目标
 * 这是AnimaWeave最关键的创新 - 子图封装为节点的递归机制。
 * 我们需要验证：
 * 1. 能否成功封装子图为新节点？
 * 2. 新节点能否被其他子图使用？
 * 3. 这种递归构建是否真的有效？
 *
 * ## 测试场景
 * 创建最简单的数学运算验证：
 * - 基础节点：Add(a, b) -> a+b, Constant(value) -> value
 * - 组合子图：Add3(x) = Add(x, Constant(3)) -> x+3
 * - 封装验证：Add3能否成为新节点被其他图使用
 * - 递归验证：Add6(x) = Add3(Add3(x)) -> x+6
 *
 * @module
 */

import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { awakening, ExecutionStatus } from "../src/mod.ts";

describe("最小实现：子图封装机制验证", () => {
  describe("第一阶段：基础数学节点", () => {
    it("应该能执行基础的Add和Constant节点", async () => {
      // 🎯 验证最基础的数学运算能力
      // 这是后续封装的基础
      
      // Given: 执行简单的数学运算图
      // 图内容：Constant(5) -> Add(input, Constant(3)) -> output = 8
      const result = await awakening("./sanctums/minimal", "basic_math");
      
      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "基础数学运算应该成功");
      
      // 验证结果值
      const outputs = result.getOutputs();
      assertEquals(outputs["output.result"]?.value, 8, "5 + 3 应该等于 8");
      assertEquals(outputs["output.result"]?.semantic_label, "math.Number", "结果应该是Number类型");
      
      console.log("✅ 基础数学节点验证通过:", outputs);
    });
  });

  describe("第二阶段：子图创建", () => {
    it("应该能创建Add3子图（给数字加3）", async () => {
      // 🎯 验证子图能正确执行
      // 这是封装前的准备
      
      // Given: 执行Add3子图
      // 子图内容：input -> Add(input, Constant(3)) -> output
      const result = await awakening("./sanctums/minimal", "add3_subgraph");
      
      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "Add3子图应该成功执行");
      
      // 验证结果值
      const outputs = result.getOutputs();
      assertEquals(outputs["result"]?.value, 8, "5 + 3 应该等于 8");
      
      console.log("✅ Add3子图验证通过:", outputs);
    });
  });

  describe("第三阶段：子图封装为节点", () => {
    it("应该能将Add3子图封装为新节点", async () => {
      // 🎯 核心验证：子图封装机制
      // 这是AnimaWeave最关键的创新
      
      // Given: 执行包含封装节点的图
      // 图内容：使用封装后的Add3节点
      const result = await awakening("./sanctums/minimal", "use_add3_node");
      
      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "封装节点应该成功执行");
      
      // 验证结果值
      const outputs = result.getOutputs();
      assertEquals(outputs["result"]?.value, 8, "封装的Add3(5)应该等于 8");
      
      console.log("✅ 子图封装验证通过:", outputs);
    });
  });

  describe("第四阶段：递归使用封装节点", () => {
    it("应该能递归使用封装节点创建更复杂的能力", async () => {
      // 🎯 最终验证：递归构建能力
      // 验证AI能创造自己的积木
      
      // Given: 执行递归使用封装节点的图
      // 图内容：Add6(x) = Add3(Add3(x)) -> x+6
      const result = await awakening("./sanctums/minimal", "add6_recursive");
      
      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "递归封装节点应该成功执行");
      
      // 验证结果值
      const outputs = result.getOutputs();
      assertEquals(outputs["result"]?.value, 11, "Add6(5) = Add3(Add3(5)) = Add3(8) = 11");
      
      console.log("✅ 递归构建验证通过:", outputs);
    });
  });

  describe("第五阶段：动态封装验证", () => {
    it("应该能动态地封装和使用新节点", async () => {
      // 🎯 高级验证：动态封装能力
      // 验证系统能动态创建新的节点类型
      
      // Given: 执行动态封装的图
      // 图内容：在运行时创建新的封装节点
      const result = await awakening("./sanctums/minimal", "dynamic_encapsulation");
      
      // Then: 验证执行成功
      assertEquals(result.status, ExecutionStatus.Success, "动态封装应该成功");
      
      // 验证结果值
      const outputs = result.getOutputs();
      assertEquals(outputs["result"]?.value, 15, "动态创建的Add10(5)应该等于 15");
      
      console.log("✅ 动态封装验证通过:", outputs);
    });
  });
}); 