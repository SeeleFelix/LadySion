// Basic Plugin TypeScript Implementation
// 一比一实现basic.anima中定义的所有节点

import { BasePlugin, NodeExecutionContext, NodeImplementation } from "../registry.ts";
import type { AnimaDefinition } from "../../graph/parser.ts";
import { GraphParser } from "../../graph/parser.ts";

export class BasicPlugin extends BasePlugin {
  constructor(animaDefinition: AnimaDefinition) {
    super(animaDefinition);
  }

  protected registerNodeImplementations(): void {
    // 注册所有节点的具体实现
    this.nodeImplementations = {
      "Start": this.start,
      "GetTimestamp": this.getTimestamp,
      "IsEven": this.isEven,
      "FormatNumber": this.formatNumber,
      "CreatePrompt": this.createPrompt,
    };
  }

  // ========== 节点实现 ==========

  private start: NodeImplementation = async (context: NodeExecutionContext) => {
    console.log("🚀 执行Start节点");

    // Start节点不需要输入，生成唯一ID和信号
    const executionId = crypto.randomUUID();

    console.log("✅ Start节点完成，execution_id:", executionId);

    return {
      signal: true, // Signal类型表示控制流激活
      execution_id: executionId,
    };
  };

  private getTimestamp: NodeImplementation = async (context: NodeExecutionContext) => {
    const { inputs } = context;
    console.log("⏰ 执行GetTimestamp节点, inputs:", inputs);

    // 验证输入
    if (!("trigger" in inputs)) {
      throw new Error("GetTimestamp node requires trigger input");
    }

    const now = Date.now();
    const timestamp = Math.floor(now / 1000); // Unix timestamp in seconds

    console.log("✅ GetTimestamp节点完成，timestamp:", timestamp);

    return {
      timestamp: timestamp,
      done: true, // Signal类型表示完成
    };
  };

  private isEven: NodeImplementation = async (context: NodeExecutionContext) => {
    const { inputs } = context;
    console.log("🔢 执行IsEven节点, inputs:", inputs);

    // 验证输入
    if (!("number" in inputs) || typeof inputs.number !== "number") {
      throw new Error("IsEven node requires number input of type Int");
    }

    if (!("trigger" in inputs)) {
      throw new Error("IsEven node requires trigger input");
    }

    const number = inputs.number as number;
    const result = number % 2 === 0;

    console.log("✅ IsEven节点完成, number:", number, "result:", result);

    return {
      result: result,
      done: true, // Signal类型表示完成
    };
  };

  private formatNumber: NodeImplementation = async (context: NodeExecutionContext) => {
    const { inputs } = context;
    console.log("📝 执行FormatNumber节点, inputs:", inputs);

    // 验证输入
    if (!("number" in inputs) || typeof inputs.number !== "number") {
      throw new Error("FormatNumber node requires number input of type Int");
    }

    if (!("trigger" in inputs)) {
      throw new Error("FormatNumber node requires trigger input");
    }

    const number = inputs.number as number;

    // 简单的数字格式化 - 转换为字符串
    const formatted = `Number: ${number}`;

    console.log("✅ FormatNumber节点完成, number:", number, "formatted:", formatted);

    return {
      formatted: formatted,
      done: true, // Signal类型表示完成
    };
  };

  private createPrompt: NodeImplementation = async (context: NodeExecutionContext) => {
    const { inputs } = context;
    console.log("📋 执行CreatePrompt节点, inputs:", inputs);

    // 验证输入 - 需要name和content以及trigger
    if (!("name" in inputs) || typeof inputs.name !== "string") {
      throw new Error("CreatePrompt node requires name input of type String");
    }

    if (!("content" in inputs) || typeof inputs.content !== "string") {
      throw new Error("CreatePrompt node requires content input of type String");
    }

    if (!("trigger" in inputs)) {
      throw new Error("CreatePrompt node requires trigger input");
    }

    const name = inputs.name as string;
    const content = inputs.content as string;

    // 创建Prompt复合类型对象
    const prompt = {
      id: crypto.randomUUID(), // 生成UUID
      name: name,
      content: content,
    };

    console.log("✅ CreatePrompt节点完成, prompt:", prompt);

    return {
      prompt: prompt,
      done: true, // Signal类型表示完成
    };
  };

  // ========== 类型验证辅助方法 ==========

  override validateValue(value: unknown, typeName: string): boolean {
    console.log("🔍 验证值类型:", value, "类型:", typeName);

    // 简化的类型验证
    switch (typeName) {
      case "basic.Signal":
      case "Signal":
        return typeof value === "boolean";
      case "basic.Int":
      case "Int":
        return typeof value === "number" && Number.isInteger(value);
      case "basic.Bool":
      case "Bool":
        return typeof value === "boolean";
      case "basic.String":
      case "String":
        return typeof value === "string";
      case "basic.UUID":
      case "UUID":
        // 使用父类的UUID验证方法
        return typeof value === "string" && this.isValidUUID(value);
      case "basic.Prompt":
      case "Prompt":
        return this.validatePrompt(value);
      default:
        console.log("⚠️ 未知类型，默认通过验证:", typeName);
        return true;
    }
  }

  private validatePrompt(prompt: unknown): boolean {
    if (typeof prompt !== "object" || prompt === null) return false;

    const obj = prompt as Record<string, unknown>;

    // 验证Prompt复合类型的所有字段
    return (
      "id" in obj && typeof obj.id === "string" && this.isValidUUID(obj.id) &&
      "name" in obj && typeof obj.name === "string" &&
      "content" in obj && typeof obj.content === "string"
    );
  }
}

// 工厂函数，用于创建basic插件实例
export async function createBasicPlugin(): Promise<BasicPlugin> {
  console.log("🏗️ 创建BasicPlugin，加载basic.anima文件...");

  try {
    // 读取真实的basic.anima文件
    const animaPath = "./sanctums/basic.anima";
    const animaContent = await Deno.readTextFile(animaPath);

    // 使用真实的DSL解析器解析anima文件
    const parser = new GraphParser();
    const animaDefinition = parser.parseAnima(animaContent);

    console.log("✅ basic.anima解析成功:", animaDefinition.metadata.name);
    console.log("📊 加载的类型数量:", Object.keys(animaDefinition.types).length);
    console.log("🎯 加载的节点数量:", Object.keys(animaDefinition.nodes).length);

    return new BasicPlugin(animaDefinition);
  } catch (error) {
    console.error("❌ 创建BasicPlugin失败:", error);
    throw new Error(
      `Failed to create BasicPlugin: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
