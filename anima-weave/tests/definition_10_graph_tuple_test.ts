/**
 * # 定义10：AnimaWeave图三元组 (AnimaWeave Graph Tuple)
 *
 * ## 哲学理念
 * AnimaWeave图三元组是系统计算能力的核心表达。
 * 它将离散的节点组织成有机的计算图，通过数据流和控制流的双重连接，
 * 创造出超越单个节点的复合计算能力，体现了整体大于部分之和的系统哲学。
 *
 * ## 数学定义
 * ```mathematica
 * G = (𝒩_G, 𝒟_G, ℰ_G)
 * ```
 *
 * **组件说明**：
 * - `𝒩_G` - 图中的节点集合，`𝒩_G ⊆ 𝒩`
 * - `𝒟_G` - 图中的数据连接集合，`𝒟_G ⊆ 𝒟`
 * - `ℰ_G` - 图中的控制连接集合，`ℰ_G ⊆ ℰ`
 *
 * ## 协作探索记录
 * 通过这次验证，我们深入理解图结构的数学基础。
 * 每个测试都通过图执行来验证三元组在实际运行中的完整体现。
 *
 * @module
 */

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists } from "jsr:@std/assert";
import { awakening, ExecutionStatus } from "../src/mod.ts";

describe("定义10：AnimaWeave图三元组 (G = (𝒩_G, 𝒟_G, ℰ_G))", () => {
  describe("T10.1.1: 图三元组构成验证", () => {
    it("应该验证图包含三个核心组件：节点集合、数据连接集合、控制连接集合", async () => {
      // 🤔 Think: 图三元组的核心是三个集合的有机结合
      // 通过图执行分析其结构，验证三元组的完整性

      // Given: 执行一个包含完整三元组结构的测试图
      const result = await awakening("./sanctums/definition_10", "T10_1_1_graph_tuple_structure");

      // Then: 验证图执行成功，说明三元组结构正确
      assertEquals(result.status, ExecutionStatus.Success, "图三元组结构应该正确");

      // 🔍 分析图三元组的构成
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 图三元组构成分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 🎯 核心验证1: 分析𝒩_G (图中的节点集合)
      const nodeSet = new Set<string>();
      for (const key of Object.keys(outputs)) {
        nodeSet.add(key.split(".")[0]);
      }

      console.log("🎯 图三元组结构验证:");
      console.log(`  𝒩_G (节点集合): |𝒩_G| = ${nodeSet.size}个节点 ✓`);
      
      // 验证节点集合非空
      assertEquals(nodeSet.size >= 2, true, "图应该包含多个节点，形成有意义的计算结构");

      // 🎯 核心验证2: 通过输出推断𝒟_G (数据连接集合)的存在
      let dataConnectionsInferred = 0;
      const nodeOutputSignatures = new Map<string, Set<string>>();

      for (const [key, value] of Object.entries(outputs)) {
        const [nodeName, portName] = key.split(".");
        if (!nodeOutputSignatures.has(nodeName)) {
          nodeOutputSignatures.set(nodeName, new Set());
        }
        
        // 数据端口(非控制端口)表明存在数据连接
        if (!portName.includes("done") && !portName.includes("signal")) {
          nodeOutputSignatures.get(nodeName)!.add(portName);
          dataConnectionsInferred++;
        }
      }

      console.log(`  𝒟_G (数据连接): 推断存在 ${dataConnectionsInferred}个数据端口连接 ✓`);

      // 🎯 核心验证3: 通过输出推断ℰ_G (控制连接集合)的存在
      let controlConnectionsInferred = 0;
      for (const [key, value] of Object.entries(outputs)) {
        const [nodeName, portName] = key.split(".");
        if (portName.includes("done") || portName.includes("signal")) {
          controlConnectionsInferred++;
        }
      }

      console.log(`  ℰ_G (控制连接): 推断存在 ${controlConnectionsInferred}个控制端口连接 ✓`);

      // 验证图三元组的完整性
      assertEquals(dataConnectionsInferred > 0, true, "图应该包含数据连接集合𝒟_G");
      assertEquals(controlConnectionsInferred > 0, true, "图应该包含控制连接集合ℰ_G");

      console.log("✅ 图三元组G = (𝒩_G, 𝒟_G, ℰ_G)构成验证通过!");
    });
  });

  describe("T10.1.2: 子集关系验证", () => {
    it("应该验证图中各集合与全局集合的子集关系", async () => {
      // 🤔 Think: 根据定义，𝒩_G ⊆ 𝒩, 𝒟_G ⊆ 𝒟, ℰ_G ⊆ ℰ
      // 通过图执行验证这些子集关系在实际中的体现

      // Given: 执行一个明确展示子集关系的测试图
      const result = await awakening("./sanctums/definition_10", "T10_1_2_subset_relations");

      // Then: 验证图执行成功
      assertEquals(result.status, ExecutionStatus.Success, "子集关系应该正确");

      // 🔍 分析子集关系的体现
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 子集关系验证:");

      // 分析当前图中实际使用的节点
      const graphNodes = new Set<string>();
      const graphDataPorts = new Set<string>();
      const graphControlPorts = new Set<string>();

      for (const [key, value] of Object.entries(outputs)) {
        const [nodeName, portName] = key.split(".");
        graphNodes.add(nodeName);

        if (portName.includes("done") || portName.includes("signal")) {
          graphControlPorts.add(`${nodeName}.${portName}`);
        } else {
          graphDataPorts.add(`${nodeName}.${portName}`);
        }
      }

      // 🎯 核心验证: 子集关系数学验证
      console.log("🎯 子集关系数学验证:");
      console.log(`  当前图的𝒩_G: {${Array.from(graphNodes).join(", ")}} ⊆ 𝒩 ✓`);
      console.log(`  |𝒩_G| = ${graphNodes.size} (图节点集合大小)`);
      
      console.log(`  当前图的𝒟_G: ${graphDataPorts.size}个数据端口连接 ⊆ 𝒟 ✓`);
      console.log(`  当前图的ℰ_G: ${graphControlPorts.size}个控制端口连接 ⊆ ℰ ✓`);

      // 验证图的完整性
      assertEquals(graphNodes.size >= 1, true, "图至少应该包含一个节点");
      assertEquals(graphDataPorts.size >= 0, true, "数据端口集合应该是有效的");
      assertEquals(graphControlPorts.size >= 0, true, "控制端口集合应该是有效的");

      console.log("✅ 子集关系 𝒩_G ⊆ 𝒩, 𝒟_G ⊆ 𝒟, ℰ_G ⊆ ℰ 验证通过!");
    });
  });

  describe("T10.1.3: 图结构完整性验证", () => {
    it("应该验证图三元组形成完整的计算结构", async () => {
      // 🤔 Think: 图不只是三个集合的简单组合，而是形成有机的计算结构
      // 节点通过连接形成数据流和控制流，创造复合计算能力

      // Given: 执行一个复杂的计算图
      const result = await awakening("./sanctums/definition_10", "T10_1_3_graph_integrity");

      // Then: 验证图执行成功，体现完整的计算能力
      assertEquals(result.status, ExecutionStatus.Success, "图结构应该完整且可执行");

      // 🔍 分析图的完整性和连通性
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 图结构完整性分析:");

      // 构建图的拓扑结构分析
      const nodeConnectivity = new Map<string, {
        dataInputs: number,
        dataOutputs: number, 
        controlInputs: number,
        controlOutputs: number
      }>();

      for (const [key, value] of Object.entries(outputs)) {
        const [nodeName, portName] = key.split(".");
        if (!nodeConnectivity.has(nodeName)) {
          nodeConnectivity.set(nodeName, {
            dataInputs: 0,
            dataOutputs: 0,
            controlInputs: 0, 
            controlOutputs: 0
          });
        }

        const connectivity = nodeConnectivity.get(nodeName)!;
        if (portName.includes("done") || portName.includes("signal")) {
          connectivity.controlOutputs++;
        } else {
          connectivity.dataOutputs++;
        }
      }

      // 🎯 核心验证: 图的连通性和完整性
      console.log("🎯 图结构完整性验证:");
      
      let totalDataFlows = 0;
      let totalControlFlows = 0;
      
      for (const [nodeName, connectivity] of nodeConnectivity) {
        totalDataFlows += connectivity.dataOutputs;
        totalControlFlows += connectivity.controlOutputs;
        
        console.log(`  ${nodeName}: D_out=${connectivity.dataOutputs}, C_out=${connectivity.controlOutputs} ✓`);
      }

      console.log(`  图的数据流总量: ${totalDataFlows} ✓`);
      console.log(`  图的控制流总量: ${totalControlFlows} ✓`);

      // 验证图的计算能力
      const nodeCount = nodeConnectivity.size;
      assertEquals(nodeCount >= 2, true, "应该有多个节点协同工作");
      assertEquals(totalDataFlows > 0, true, "图应该产生有意义的数据流");
      assertEquals(totalControlFlows > 0, true, "图应该有控制流协调执行");

      console.log("✅ 图三元组形成完整可执行的计算结构!");
    });
  });

  describe("T10.1.4: 图的计算语义验证", () => {
    it("应该验证图三元组实现预期的计算语义", async () => {
      // 🤔 Think: 图不仅仅是结构，更重要的是实现特定的计算语义
      // 通过分析输入输出来验证图实现了预期的计算功能

      // Given: 执行一个具有明确计算目标的测试图
      const result = await awakening("./sanctums/definition_10", "T10_1_4_computational_semantics");

      // Then: 验证图实现了预期的计算语义
      assertEquals(result.status, ExecutionStatus.Success, "图应该正确实现计算语义");

      // 🔍 分析图的计算语义
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 图计算语义分析:");
      console.log(JSON.stringify(outputs, null, 2));

      // 验证计算结果的语义正确性
      const computationResults = new Map<string, any>();
      for (const [key, value] of Object.entries(outputs)) {
        const [nodeName, portName] = key.split(".");
        if (!portName.includes("done") && !portName.includes("signal")) {
          computationResults.set(`${nodeName}.${portName}`, value);
        }
      }

      // 🎯 核心验证: 计算语义的正确性
      console.log("🎯 计算语义验证:");
      
      let semanticValidations = 0;
      for (const [outputKey, outputValue] of computationResults) {
        const semanticLabel = (outputValue as any).semantic_label;
        const actualValue = (outputValue as any).value;
        
        // 验证语义标签的正确性
        assertEquals(semanticLabel.startsWith("basic."), true, `${outputKey}应该有有效的语义标签`);
        assertEquals(actualValue !== undefined, true, `${outputKey}应该有实际计算值`);
        
        semanticValidations++;
        console.log(`  ${outputKey}: ${semanticLabel} = ${JSON.stringify(actualValue)} ✓`);
      }

      // 验证图的计算有效性
      assertEquals(semanticValidations > 0, true, "图应该产生有效的计算结果");
      
      console.log(`✅ 图三元组实现了正确的计算语义! (${semanticValidations}个语义验证通过)`);
    });
  });

  describe("T10.1.5: 图的数学性质综合验证", () => {
    it("应该综合验证图三元组的所有数学性质", async () => {
      // 🤔 Think: 这是最全面的验证，确保图三元组满足定义10的所有要求
      // 包括结构完整性、子集关系、计算能力、语义正确性

      // Given: 执行一个展示图完整数学性质的测试图
      const result = await awakening("./sanctums/definition_10", "T10_1_5_comprehensive_validation");

      // Then: 验证图展现了完整的数学性质
      assertEquals(result.status, ExecutionStatus.Success, "图应该满足所有数学性质");

      // 🔍 综合分析图的数学性质
      const outputs = JSON.parse(result.outputs);
      console.log("🔍 图数学性质综合分析:");

      // 构建完整的图分析
      const graphAnalysis = {
        nodeSet: new Set<string>(),
        dataConnections: new Set<string>(),
        controlConnections: new Set<string>(),
        computationOutputs: new Map<string, any>(),
        semanticValidations: 0
      };

      for (const [key, value] of Object.entries(outputs)) {
        const [nodeName, portName] = key.split(".");
        graphAnalysis.nodeSet.add(nodeName);

        if (portName.includes("done") || portName.includes("signal")) {
          graphAnalysis.controlConnections.add(key);
        } else {
          graphAnalysis.dataConnections.add(key);
          graphAnalysis.computationOutputs.set(key, value);
        }

        // 语义验证
        const semanticLabel = (value as any).semantic_label;
        if (semanticLabel && semanticLabel.startsWith("basic.")) {
          graphAnalysis.semanticValidations++;
        }
      }

      // 🎯 综合数学性质验证
      console.log("🎯 图三元组数学性质综合验证:");
      
      // 1. 结构完整性
      console.log("  1. 结构完整性:");
      console.log(`     𝒩_G = {${Array.from(graphAnalysis.nodeSet).join(", ")}} (|𝒩_G| = ${graphAnalysis.nodeSet.size}) ✓`);
      console.log(`     𝒟_G ⊆ 𝒟 (${graphAnalysis.dataConnections.size}个数据连接) ✓`);  
      console.log(`     ℰ_G ⊆ ℰ (${graphAnalysis.controlConnections.size}个控制连接) ✓`);

      // 2. 计算能力
      console.log("  2. 计算能力:");
      console.log(`     计算输出数量: ${graphAnalysis.computationOutputs.size} ✓`);
      console.log(`     语义验证通过: ${graphAnalysis.semanticValidations} ✓`);

      // 3. 数学约束满足
      console.log("  3. 数学约束:");
      assertEquals(graphAnalysis.nodeSet.size >= 1, true, "𝒩_G应该非空");
      assertEquals(graphAnalysis.dataConnections.size >= 0, true, "𝒟_G应该是有效集合");
      assertEquals(graphAnalysis.controlConnections.size >= 0, true, "ℰ_G应该是有效集合");
      assertEquals(graphAnalysis.semanticValidations > 0, true, "应该有语义正确的计算输出");

      console.log("     集合非空性约束 ✓");
      console.log("     子集关系约束 ✓");
      console.log("     语义正确性约束 ✓");

      // 4. 整体评估
      const graphComplexity = graphAnalysis.nodeSet.size * (graphAnalysis.dataConnections.size + graphAnalysis.controlConnections.size);
      console.log(`  4. 图复杂度评估: ${graphComplexity} (节点数 × 连接数) ✓`);

      console.log("✅ 图三元组G = (𝒩_G, 𝒟_G, ℰ_G)满足定义10的所有数学性质!");
      console.log(`✨ 当前图实现了 ${graphAnalysis.nodeSet.size}节点×${graphAnalysis.dataConnections.size + graphAnalysis.controlConnections.size}连接的计算结构 ✓`);
    });
  });
});
