/**
 * # 容器Anima文件生成测试
 * 
 * ## 测试目标
 * 验证VesselManager能够正确地从容器的Node和Label类生成anima文件，
 * 确保生成的anima文件格式正确，包含完整的类型和节点定义。
 * 
 * ## 协作探索记录
 * 这个测试验证了我们重构后的容器系统是否能正确生成AI可读的元数据文件。
 * 直接验证生成的anima文件内容，确保格式正确性。
 * 
 * @module
 */

import { describe, it, beforeEach, afterEach } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert";
import { VesselManager } from "../src/framework/vessel_manager.ts";
import { VesselRegistry } from "../src/framework/core.ts";

describe("容器Anima文件生成测试", () => {
  let vesselManager: VesselManager;
  let registry: VesselRegistry;
  
  beforeEach(() => {
    registry = new VesselRegistry();
    vesselManager = new VesselManager(registry);
  });

  afterEach(async () => {
    // 清理生成的测试文件
    try {
      await Deno.remove("sanctums/basic.anima");
    } catch {
      // 文件可能不存在，忽略错误
    }
  });

  describe("基础容器anima文件生成", () => {
    it("应该正确生成basic容器的anima文件", async () => {
      console.log("🔍 开始测试basic容器anima文件生成");
      
      // Given: 加载basic容器
      await vesselManager.discoverAndLoadVessels();
      
      // Then: 验证basic容器已加载
      const loadedVessels = registry.listVessels();
      assertEquals(loadedVessels.includes("basic"), true, "basic容器应该已加载");
      
      // 验证anima文件已生成
      let animaContent: string;
      try {
        animaContent = await Deno.readTextFile("sanctums/basic.anima");
        console.log("📄 生成的anima文件内容:");
        console.log(animaContent);
      } catch (error) {
        throw new Error(`无法读取生成的anima文件: ${error}`);
      }
      
      // 🎯 验证anima文件基本结构
      assertStringIncludes(animaContent, "-- types", "应该包含types部分");
      assertStringIncludes(animaContent, "-- nodes", "应该包含nodes部分");
      assertStringIncludes(animaContent, "--", "应该以--结尾");
      
      // 🎯 验证基础类型定义
      assertStringIncludes(animaContent, "Signal", "应该包含Signal类型");
      assertStringIncludes(animaContent, "Int", "应该包含Int类型");
      assertStringIncludes(animaContent, "Bool", "应该包含Bool类型");
      assertStringIncludes(animaContent, "String", "应该包含String类型");
      assertStringIncludes(animaContent, "UUID", "应该包含UUID类型");
      assertStringIncludes(animaContent, "Prompt", "应该包含Prompt类型");
      
      // 🎯 验证节点定义
      assertStringIncludes(animaContent, "Start {", "应该包含Start节点定义");
      assertStringIncludes(animaContent, "GetTimestamp {", "应该包含GetTimestamp节点定义");
      assertStringIncludes(animaContent, "IsEven {", "应该包含IsEven节点定义");
      assertStringIncludes(animaContent, "FormatNumber {", "应该包含FormatNumber节点定义");
      assertStringIncludes(animaContent, "CreatePrompt {", "应该包含CreatePrompt节点定义");
      
      // 🎯 验证节点结构
      assertStringIncludes(animaContent, "mode Concurrent", "节点应该有mode定义");
      assertStringIncludes(animaContent, "in {", "节点应该有输入端口定义");
      assertStringIncludes(animaContent, "out {", "节点应该有输出端口定义");
      
      console.log("✅ basic容器anima文件生成验证通过");
    });
  });

  describe("anima文件内容详细验证", () => {
    it("应该正确生成Start节点的完整定义", async () => {
      console.log("🔍 详细验证Start节点定义");
      
      // Given: 加载容器并生成anima文件
      await vesselManager.discoverAndLoadVessels();
      const animaContent = await Deno.readTextFile("sanctums/basic.anima");
      
      // 🎯 验证Start节点的完整结构
      assertStringIncludes(animaContent, "Start {", "应该有Start节点开始");
      assertStringIncludes(animaContent, "mode Concurrent", "Start节点应该是Concurrent模式");
      
      // 验证输出端口
      assertStringIncludes(animaContent, "signal basic.Signal", "应该有signal输出端口");
      assertStringIncludes(animaContent, "execution_id basic.UUID", "应该有execution_id输出端口");
      
      console.log("✅ Start节点定义验证通过");
    });

    it("应该正确生成IsEven节点的输入输出定义", async () => {
      console.log("🔍 详细验证IsEven节点的输入输出");
      
      // Given: 加载容器并生成anima文件
      await vesselManager.discoverAndLoadVessels();
      const animaContent = await Deno.readTextFile("sanctums/basic.anima");
      
      // 验证输入端口
      assertStringIncludes(animaContent, "number basic.Int", "应该有number输入端口");
      assertStringIncludes(animaContent, "trigger basic.Signal", "应该有trigger输入端口");
      
      // 验证输出端口
      assertStringIncludes(animaContent, "result basic.Bool", "应该有result输出端口");
      assertStringIncludes(animaContent, "done basic.Signal", "应该有done输出端口");
      
      console.log("✅ IsEven节点输入输出验证通过");
    });

    it("应该正确生成CreatePrompt节点的复杂类型定义", async () => {
      console.log("🔍 详细验证CreatePrompt节点的复杂类型");
      
      // Given: 加载容器并生成anima文件
      await vesselManager.discoverAndLoadVessels();
      const animaContent = await Deno.readTextFile("sanctums/basic.anima");
      
      // 验证输入端口（多个String类型）
      assertStringIncludes(animaContent, "name basic.String", "应该有name输入端口");
      assertStringIncludes(animaContent, "content basic.String", "应该有content输入端口");
      assertStringIncludes(animaContent, "trigger basic.Signal", "应该有trigger输入端口");
      
      // 验证输出端口（包含复合类型）
      assertStringIncludes(animaContent, "prompt basic.Prompt", "应该有prompt输出端口");
      assertStringIncludes(animaContent, "done basic.Signal", "应该有done输出端口");
      
      console.log("✅ CreatePrompt节点复杂类型验证通过");
    });
  });

  describe("anima文件格式验证", () => {
    it("生成的anima文件应该符合标准格式", async () => {
      console.log("🔍 验证anima文件格式规范");
      
      // Given: 生成anima文件
      await vesselManager.discoverAndLoadVessels();
      const animaContent = await Deno.readTextFile("sanctums/basic.anima");
      
      // 🎯 验证文件结构
      const lines = animaContent.split('\n');
      
      // 验证开始标记
      assertEquals(lines[0], "-- types", "第一行应该是'-- types'");
      
      // 找到types和nodes的分界线
      const typesEndIndex = lines.findIndex((line, index) => index > 0 && line === "--");
      assertEquals(typesEndIndex > 0, true, "应该有types结束标记");
      
      const nodesStartIndex = lines.findIndex(line => line === "-- nodes");
      assertEquals(nodesStartIndex > typesEndIndex, true, "nodes部分应该在types之后");
      
      // 验证结束标记
      const lastNonEmptyLine = lines.filter(line => line.trim() !== "").pop();
      assertEquals(lastNonEmptyLine, "--", "最后一个非空行应该是'--'");
      
      console.log("✅ anima文件格式验证通过");
    });
  });
}); 