// Basic Plugin - 基础插件实现
// 提供基础数据类型和基本操作节点

import {
  SemanticLabel,
  Port,
  Node,
  IAnimaPlugin,
} from "../../framework/core.ts";

// ========== 语义标签定义 ==========

export class SignalLabel extends SemanticLabel {
  readonly labelName = "Signal";
  
  constructor(value: any) {
    super(typeof value === "boolean" ? value : false);
  }
}

export class IntLabel extends SemanticLabel {
  readonly labelName = "Int";
  
  constructor(value: any) {
    super(typeof value === "number" && Number.isInteger(value) ? value : 0);
  }
}

export class BoolLabel extends SemanticLabel {
  readonly labelName = "Bool";
  
  constructor(value: any) {
    super(typeof value === "boolean" ? value : false);
  }
}

export class StringLabel extends SemanticLabel {
  readonly labelName = "String";
  
  constructor(value: any) {
    super(typeof value === "string" ? value : "");
  }
}

export class UUIDLabel extends SemanticLabel {
  readonly labelName = "UUID";
  
  constructor(value: any) {
    const isValid = typeof value === "string" && UUIDLabel.isValidUUID(value);
    super(isValid ? value : crypto.randomUUID());
  }
  
  private static isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}

export class PromptLabel extends SemanticLabel {
  readonly labelName = "Prompt";
  
  constructor(value: any) {
    if (typeof value === "object" && value !== null && 
        value.id instanceof UUIDLabel && 
        value.name instanceof StringLabel && 
        value.content instanceof StringLabel) {
      super(value);
    } else {
      // 默认值也必须是SemanticLabel组成的
      super({
        id: new UUIDLabel(crypto.randomUUID()),
        name: new StringLabel("Default Prompt"),
        content: new StringLabel("")
      });
    }
  }
}

// ========== 节点定义 ==========

export class StartNode extends Node {
  readonly nodeName = "Start";
  readonly inputs: Port[] = [];  // 无输入
  readonly outputs = [
    new Port("signal", SignalLabel),
    new Port("execution_id", UUIDLabel)
  ];
  readonly description = "图执行的起始节点";
  
  execute(inputPorts: Port[]): Port[] {
    return [
      this.outputs[0].setValue(new SignalLabel(true)),
      this.outputs[1].setValue(new UUIDLabel(crypto.randomUUID()))
    ];
  }
}

export class GetTimestampNode extends Node {
  readonly nodeName = "GetTimestamp";
  readonly inputs = [
    new Port("trigger", SignalLabel)
  ];
  readonly outputs = [
    new Port("timestamp", IntLabel),
    new Port("done", SignalLabel)
  ];
  readonly description = "获取当前时间戳";
  
  execute(inputPorts: Port[]): Port[] {
    // inputPorts[0] 对应 trigger
    const timestamp = Date.now();
    return [
      this.outputs[0].setValue(new IntLabel(timestamp)),
      this.outputs[1].setValue(new SignalLabel(true))
    ];
  }
}

export class IsEvenNode extends Node {
  readonly nodeName = "IsEven";
  readonly inputs = [
    new Port("number", IntLabel),
    new Port("trigger", SignalLabel)
  ];
  readonly outputs = [
    new Port("result", BoolLabel),
    new Port("done", SignalLabel)
  ];
  readonly description = "判断数字是否为偶数";
  
  execute(inputPorts: Port[]): Port[] {
    // inputPorts[0] 对应 number, inputPorts[1] 对应 trigger
    const number = inputPorts[0].getValue()!.value as number;
    const isEven = number % 2 === 0;
    
    return [
      this.outputs[0].setValue(new BoolLabel(isEven)),
      this.outputs[1].setValue(new SignalLabel(true))
    ];
  }
}

export class FormatNumberNode extends Node {
  readonly nodeName = "FormatNumber";
  readonly inputs = [
    new Port("number", IntLabel),
    new Port("trigger", SignalLabel)
  ];
  readonly outputs = [
    new Port("formatted", StringLabel),
    new Port("done", SignalLabel)
  ];
  readonly description = "格式化数字为字符串";
  
  execute(inputPorts: Port[]): Port[] {
    // inputPorts[0] 对应 number, inputPorts[1] 对应 trigger
    const number = inputPorts[0].getValue()!.value as number;
    const formatted = `Number: ${number}`;
    
    return [
      this.outputs[0].setValue(new StringLabel(formatted)),
      this.outputs[1].setValue(new SignalLabel(true))
    ];
  }
}

export class CreatePromptNode extends Node {
  readonly nodeName = "CreatePrompt";
  readonly inputs = [
    new Port("name", StringLabel),
    new Port("content", StringLabel),
    new Port("trigger", SignalLabel)
  ];
  readonly outputs = [
    new Port("prompt", PromptLabel),
    new Port("done", SignalLabel)
  ];
  readonly description = "创建Prompt对象";
  
  execute(inputPorts: Port[]): Port[] {
    // inputPorts[0] 对应 name, inputPorts[1] 对应 content, inputPorts[2] 对应 trigger
    const name = inputPorts[0].getValue()!.value as string;
    const content = inputPorts[1].getValue()!.value as string;
    
    // 复合类型必须由SemanticLabel组成
    const prompt = {
      id: new UUIDLabel(crypto.randomUUID()),
      name: new StringLabel(name),
      content: new StringLabel(content)
    };
    
    return [
      this.outputs[0].setValue(new PromptLabel(prompt)),
      this.outputs[1].setValue(new SignalLabel(true))
    ];
  }
}

// ========== 插件实现 ==========

/**
 * Basic插件实现
 * 提供基础数据类型和基本操作节点
 */
export class BasicPlugin implements IAnimaPlugin {
  readonly name = "basic";
  readonly version = "1.0.0";

  constructor() {
    console.log(`🔌 初始化Basic插件 v${this.version}`);
  }

  /**
   * 获取支持的标签类
   */
  getSupportedLabels(): Array<new (value: any) => SemanticLabel> {
    return [
      SignalLabel,
      IntLabel,
      BoolLabel,
      StringLabel,
      UUIDLabel,
      PromptLabel,
    ];
  }

  /**
   * 获取支持的节点类
   */
  getSupportedNodes(): Array<new () => Node> {
    return [
      StartNode,
      GetTimestampNode,
      IsEvenNode,
      FormatNumberNode,
      CreatePromptNode,
    ];
  }
}
