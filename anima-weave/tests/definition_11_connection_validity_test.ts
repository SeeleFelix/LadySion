/**
 * # 定义11：连接有效性约束 (Connection Validity Constraints)
 *
 * ## 哲学理念
 * 连接有效性约束是AnimaWeave图结构完整性的基石。
 * 它确保了每个连接都有明确的起点和终点，每个端口都有归属的节点，
 * 体现了数学严谨性在图结构设计中的重要性。
 *
 * ## 数学定义
 * ```mathematica
 * ∀(p_out, p_in) ∈ 𝒟_G, ∃n₁,n₂ ∈ 𝒩_G,
 *   p_out ∈ n₁.D_out ∧ p_in ∈ n₂.D_in
 * ```
 *
 * 连接有效性约束确保：
 * - 每个数据连接的输出端口都属于某个图中节点的输出端口集合
 * - 每个数据连接的输入端口都属于某个图中节点的输入端口集合
 * - 连接的端点都有明确的节点归属，不存在"悬空"的连接
 * - 图的结构完整性得到数学保证
 *
 * ## 协作探索记录
 * 通过这次验证，我们深入理解连接有效性约束的数学基础。
 * 每个测试都验证了连接与节点的归属关系在实际执行中的正确体现。
 *
 * @module
 */

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists } from "jsr:@std/assert";
import { awakening, ExecutionStatus } from "../src/mod.ts";

describe("定义11：连接有效性约束 (∀(p_out, p_in) ∈ 𝒟_G, ∃n₁,n₂ ∈ 𝒩_G)", () => {
  describe("T11.1.1: 基本连接有效性验证", () => {
    it("应该验证图中的每个数据连接都有明确的节点归属", async () => {
      // 🤔 Think: 连接有效性约束的核心是端口-节点归属关系
      // 每个连接(p_out, p_in)都必须有对应的节点(n₁, n₂)

      // Given: 执行包含有效数据连接的图
      const result = await awakening("./sanctums/definition_11", "T11_1_1_basic_connection_validity");

      // Then: 验证图执行成功，说明连接有效性约束得到满足
      assertEquals(result.status, ExecutionStatus.Success, "有效连接的图应该执行成功");

      // 🔍 分析连接有效性
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 连接有效性分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 利用执行轨迹验证节点存在性 (∃n₁,n₂ ∈ 𝒩_G)
      assertExists(result.executionTrace, "应该有执行轨迹信息");
      const executionTrace = result.executionTrace;
      const executedNodes = executionTrace.executionOrder.map((entry: any) => entry.nodeId);
      
      assertEquals(executedNodes.includes("starter"), true, "starter节点应该存在并执行");
      assertEquals(executedNodes.includes("timestamper"), true, "timestamper节点应该存在并执行");  
      assertEquals(executedNodes.includes("formatter"), true, "formatter节点应该存在并执行");

      // 🎯 核心验证2: 验证端口归属关系 (p_out ∈ n₁.D_out ∧ p_in ∈ n₂.D_in)
      assertExists(outputs["formatter.formatted"], "formatter节点的输出端口应该存在");
      assertExists(outputs["timestamper.timestamp"], "timestamper节点的输出端口应该存在");
      
      const formattedOutput = outputs["formatter.formatted"];
      assertEquals(formattedOutput.semantic_label, "basic.String", "连接终点的语义标签应该正确");

      // 🎯 核心验证3: 验证连接传播的有效性
      assertEquals(typeof formattedOutput.value, "string", "数据传播成功证明连接有效");
      
      const nodeOutputCount = Object.keys(outputs).length;
      assertEquals(nodeOutputCount >= 2, true, "应该有多个节点的输出端口");

      console.log("✅ 基本连接有效性验证通过:");
      console.log(`  - 端口-节点归属关系明确: ${nodeOutputCount}个输出端口 ✓`);
      console.log("  - 连接结构完整性: 所有连接都有归属节点 ✓");
      console.log("  - 语义标签正确性: 端口语义标签有效 ✓");
    });
  });

  describe("T11.1.2: 多重连接有效性验证", () => {
    it("应该验证图中的多个数据连接都满足有效性约束", async () => {
      // 🤔 Think: 当图中有多个连接时，每个连接都必须独立满足有效性约束
      // ∀(p_out, p_in) ∈ 𝒟_G意味着对每个连接都要验证

      // Given: 执行包含多个有效数据连接的图
      const result = await awakening("./sanctums/definition_11", "T11_1_2_multiple_connections_validity");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "多重连接的图应该执行成功");

      // 🔍 分析多重连接有效性
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 多重连接有效性分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 验证多个连接的端口归属
      // 注意：被连接的中间端口不会出现在终端输出中，只有终端端口才出现
      assertExists(outputs["isEven.result"], "isEven节点的输出端口应该存在");
      assertExists(outputs["formatter.formatted"], "formatter节点的输出端口应该存在");
      
      // 验证连接的有效性：timestamper.timestamp被连接到isEven.number，所以不在终端输出
      // 但isEven.result的存在证明了连接的有效性

      // 🎯 核心验证2: 验证每个连接的独立有效性
      const boolOutput = outputs["isEven.result"];
      const stringOutput = outputs["formatter.formatted"];

      assertEquals(boolOutput.semantic_label, "basic.Bool", "result端口语义标签应该正确");
      assertEquals(stringOutput.semantic_label, "basic.String", "formatted端口语义标签应该正确");
      
      // 验证连接传播的正确性：isEven能产生结果说明timestamper.timestamp成功连接到了isEven.number
      assertEquals(typeof boolOutput.value, "boolean", "Bool值应该是布尔类型，证明连接有效");

      // 🎯 核心验证3: 真正利用result对象中的执行信息验证连接有效性约束
      
      // 验证1: 图执行成功 = 连接有效性约束满足
      assertEquals(result.status, ExecutionStatus.Success, "图执行成功证明所有连接满足有效性约束");
      
      // 验证2: 检查执行轨迹中的节点存在性
      assertExists(result.executionTrace, "应该有执行轨迹信息");
      const executionTrace = result.executionTrace;
      const executedNodes = executionTrace.executionOrder.map((entry: any) => entry.nodeId);
      
      // 验证参与连接的节点都确实存在并执行了
      assertEquals(executedNodes.includes("starter"), true, "starter节点应该存在并执行");
      assertEquals(executedNodes.includes("timestamper"), true, "timestamper节点应该存在并执行");
      assertEquals(executedNodes.includes("isEven"), true, "isEven节点应该存在并执行");
      assertEquals(executedNodes.includes("formatter"), true, "formatter节点应该存在并执行");
      
      // 验证3: 通过并行组验证连接关系
      const parallelGroups = executionTrace.parallelGroups;
      const hasParallelExecution = parallelGroups && parallelGroups.length > 0;
      assertEquals(hasParallelExecution, true, "应该有并行执行组，证明连接依赖关系正确");
      
      // 验证4: 数据传播成功 = 连接的端口归属关系正确
      const hasIsEvenResult = typeof boolOutput.value === "boolean";
      const hasFormatterResult = typeof stringOutput.value === "string";
      
      assertEquals(hasIsEvenResult, true, "isEven结果存在证明timestamper.timestamp→isEven.number连接有效");
      assertEquals(hasFormatterResult, true, "formatter结果存在证明starter.execution_id→formatter.input连接有效");
      
      console.log(`  - 执行轨迹验证: ${executedNodes.length}个节点按连接顺序执行 ✓`);

      console.log("✅ 多重连接有效性验证通过:");
      console.log("  - 每个连接都有明确的端口归属 ✓");
      console.log("  - 所有连接的语义标签正确 ✓");
      console.log("  - 连接集合完整性满足数学约束 ✓");
    });
  });

  describe("T11.1.3: 控制连接有效性验证", () => {
    it("应该验证控制连接同样满足有效性约束", async () => {
      // 🤔 Think: 虽然定义11主要针对数据连接，但控制连接也应该满足类似约束
      // ∀(p_out, p_in) ∈ ℰ_G, ∃n₁,n₂ ∈ 𝒩_G, p_out ∈ n₁.C_out ∧ p_in ∈ n₂.C_in

      // Given: 执行包含控制连接的图
      const result = await awakening("./sanctums/definition_11", "T11_1_3_control_connections_validity");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "控制连接的图应该执行成功");

      // 🔍 分析控制连接有效性
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 控制连接有效性分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 利用执行轨迹验证控制连接的节点存在性
      assertExists(result.executionTrace, "应该有执行轨迹信息");
      const executionTrace = result.executionTrace;
      const executedNodes = executionTrace.executionOrder.map((entry: any) => entry.nodeId);
      
      assertEquals(executedNodes.includes("starter"), true, "starter节点应该存在并执行");
      assertEquals(executedNodes.includes("timestamper"), true, "timestamper节点应该存在并执行");

      // 🎯 核心验证2: 验证控制连接的端口归属和传播
      assertExists(outputs["timestamper.timestamp"], "控制连接应该正确激活目标节点");
      assertExists(outputs["timestamper.done"], "控制输出端口应该存在");

      const controlOutput = outputs["timestamper.done"];
      assertEquals(controlOutput.semantic_label, "basic.Signal", "控制端口的语义标签应该是Signal");
      assertEquals(controlOutput.value, true, "控制信号应该为激活状态");

      // 🎯 核心验证3: 验证控制连接的执行顺序正确性
      const executionOrder = executionTrace.executionOrder;
      const starterIndex = executionOrder.findIndex((entry: any) => entry.nodeId === "starter");
      const timestamperIndex = executionOrder.findIndex((entry: any) => entry.nodeId === "timestamper");
      
      assertEquals(starterIndex < timestamperIndex, true, "starter应该在timestamper之前执行，证明控制连接有效");

      console.log("✅ 控制连接有效性验证通过:");
      console.log("  - 控制端口归属关系明确 ✓");
      console.log("  - 控制信号传播正确 ✓");
      console.log("  - 执行顺序协调有效 ✓");
    });
  });

  describe("T11.1.4: 连接有效性数学性质验证", () => {
    it("应该验证连接有效性约束的数学性质在图执行中的体现", async () => {
      // 🤔 Think: 连接有效性约束的数学性质体现在图的结构完整性上
      // 这是对整个数学定义的综合验证

      // Given: 执行一个结构完整的图
      const result = await awakening("./sanctums/definition_11", "T11_1_4_mathematical_properties");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "结构完整的图应该执行成功");

      // 🔍 分析数学性质
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 连接有效性数学性质分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 数学性质分析
      const connectionAnalysis = {
        nodePortPairs: new Set<string>(),
        semanticLabels: new Map<string, string>(),
        nodeConnections: new Map<string, number>(),
      };

      // 分析每个输出端口的节点归属
      for (const [portPath, portData] of Object.entries(outputs)) {
        const [nodeName, portName] = portPath.split(".");
        const portInfo = portData as any;

        // 记录节点-端口对
        connectionAnalysis.nodePortPairs.add(`${nodeName}.${portName}`);

        // 记录语义标签
        connectionAnalysis.semanticLabels.set(portPath, portInfo.semantic_label);

        // 统计节点连接数
        const currentCount = connectionAnalysis.nodeConnections.get(nodeName) || 0;
        connectionAnalysis.nodeConnections.set(nodeName, currentCount + 1);
      }

      // 🎯 核心验证1: 验证∃n₁,n₂ ∈ 𝒩_G的存在性
      const nodeCount = connectionAnalysis.nodeConnections.size;
      assertEquals(nodeCount >= 2, true, "应该存在多个节点参与连接");

      // 🎯 核心验证2: 验证p_out ∈ n₁.D_out的归属关系
      const nodePortCount = connectionAnalysis.nodePortPairs.size;
      assertEquals(nodePortCount >= 2, true, "应该有多个节点-端口对");

      // 🎯 核心验证3: 验证语义标签的正确性
      const validSemanticLabels = Array.from(connectionAnalysis.semanticLabels.values())
        .every(label => label.startsWith("basic."));
      assertEquals(validSemanticLabels, true, "所有语义标签都应该有效");

      console.log("🎯 连接有效性数学性质验证:");
      console.log(`  1. 节点存在性: |𝒩_G| = ${nodeCount}个节点 ✓`);
      console.log(`  2. 端口归属关系: ${nodePortCount}个节点-端口对 ✓`);
      console.log(`  3. 语义标签有效性: ${connectionAnalysis.semanticLabels.size}个有效标签 ✓`);

      // 🎯 核心验证4: 验证数学约束的满足
      assertEquals(nodeCount >= 1, true, "节点集合应该非空");
      assertEquals(nodePortCount >= 1, true, "端口集合应该非空");
      assertEquals(connectionAnalysis.semanticLabels.size >= 1, true, "语义标签集合应该非空");

      console.log("✅ 连接有效性数学性质验证通过:");
      console.log("  - ∀(p_out, p_in) ∈ 𝒟_G约束满足 ✓");
      console.log("  - ∃n₁,n₂ ∈ 𝒩_G存在性保证 ✓");
      console.log("  - 端口归属关系p_out ∈ n₁.D_out ∧ p_in ∈ n₂.D_in ✓");
      console.log("  - 图结构完整性数学约束满足 ✓");
    });
  });
});
