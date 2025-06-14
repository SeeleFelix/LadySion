// OpenRouter Vessel - OpenRouter API 简单封装
// 依赖于 basic 容器，提供 AI 模型调用能力

import { AnimaVessel, Node, Port, SemanticLabel } from "../../framework/core.ts";

// 从 basic 容器导入需要的类型
import { PromptLabel, PromptsLabel, SignalLabel, StringLabel, UUIDLabel } from "../basic/vessel.ts";

// ========== 节点定义 ==========

export class EnhancePromptNode extends Node {
  readonly nodeName = "EnhancePrompt";
  readonly inputs = [
    new Port("prompt", PromptLabel),
    new Port("trigger", SignalLabel),
  ];
  readonly outputs = [
    new Port("prompts", PromptsLabel),
    new Port("done", SignalLabel),
  ];
  readonly description = "增强单个Prompt为Prompts集合";

  execute(inputPorts: Port[]): Port[] {
    // inputPorts[0] 对应 prompt, inputPorts[1] 对应 trigger
    const inputPrompt = inputPorts[0].getValue()!.value;

    // 创建增强版本：原始 + 系统增强版本
    const enhancedPrompt = {
      id: new UUIDLabel(crypto.randomUUID()),
      name: new StringLabel(`Enhanced: ${inputPrompt.name.value}`),
      content: new StringLabel(`System Enhancement: ${inputPrompt.content.value}`),
    };

    const prompts = [inputPrompt, enhancedPrompt];

    return [
      this.outputs[0].setValue(new PromptsLabel(prompts)),
      this.outputs[1].setValue(new SignalLabel(true)),
    ];
  }
}

export class MockOpenRouterCallNode extends Node {
  readonly nodeName = "MockOpenRouterCall";
  readonly inputs = [
    new Port("prompts", PromptsLabel),
    new Port("trigger", SignalLabel),
  ];
  readonly outputs = [
    new Port("response", StringLabel),
    new Port("done", SignalLabel),
  ];
  readonly description = "模拟 OpenRouter API 调用";

  execute(inputPorts: Port[]): Port[] {
    // inputPorts[0] 对应 prompts, inputPorts[1] 对应 trigger
    const prompts = inputPorts[0].getValue()!.value;

    // 虚假的 OpenRouter 响应
    const mockResponse = `Mock OpenRouter Response: Processed ${prompts.length} prompts`;

    return [
      this.outputs[0].setValue(new StringLabel(mockResponse)),
      this.outputs[1].setValue(new SignalLabel(true)),
    ];
  }
}

// ========== 容器实现 ==========

/**
 * OpenRouter容器实现
 * 依赖于basic容器，提供OpenRouter API简单封装
 */
export class OpenrouterVessel implements AnimaVessel {
  readonly name = "openrouter";
  readonly version = "1.0.0";
  readonly description = "OpenRouter API 简单封装，依赖于 basic 容器";

  constructor() {
    console.log(`🔌 初始化OpenRouter容器 v${this.version}`);
  }

  /**
   * 获取支持的标签类 - OpenRouter 容器不定义新的标签类型，使用 basic 容器的类型
   */
  getSupportedLabels(): Array<new (value: any) => SemanticLabel> {
    return [
      // OpenRouter 容器不定义新的标签类型
      // 所有类型都从 basic 容器导入
    ];
  }

  /**
   * 获取支持的节点类
   */
  getSupportedNodes(): Array<new () => Node> {
    return [
      EnhancePromptNode,
      MockOpenRouterCallNode,
    ];
  }
}
