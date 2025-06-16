/**
 * # Math Vessel - 基础数学运算容器
 * 
 * 提供最基础的数学运算节点，用于验证AnimaWeave的核心封装机制。
 * 这是最小实现的基础积木。
 * 
 * @module
 */

import { AnimaVessel, Node, Port, SemanticLabel } from "../../framework/core.ts";

// ========== 语义标签定义 ==========

export class NumberLabel extends SemanticLabel {
  override readonly labelName = "Number";
  
  constructor(value: number) {
    super(value);
  }
  
  override getConvertibleLabels(): string[] {
    return ["String"]; // 数字可以转换为字符串
  }
  
  override convertTo(targetLabelName: string): any {
    if (targetLabelName === "String") {
      return new StringLabel(this.value.toString());
    }
    return super.convertTo(targetLabelName);
  }
}

export class StringLabel extends SemanticLabel {
  override readonly labelName = "String";
  
  constructor(value: string) {
    super(value);
  }
}

// ========== 节点定义 ==========

export class ConstantNode extends Node {
  readonly nodeName = "Constant";
  readonly description = "产生一个常数值";

  readonly inputs: Port[] = []; // 常量节点没有输入端口

  readonly outputs: Port[] = [
    new Port("output", NumberLabel),
  ];

  // 定义支持的配置参数
  override getConfigSchema(): Record<string, 'number' | 'string' | 'boolean'> {
    return {
      value: 'number'
    };
  }

  execute(inputPorts: Port[]): Port[] {
    // 从配置中获取值
    const value = this.getConfig("value");
    if (value === undefined) {
      throw new Error("Constant节点需要在配置中指定value参数");
    }

    const result = new NumberLabel(value);

    return [
      new Port("output", NumberLabel, result)
    ];
  }
}

export class AddNode extends Node {
  readonly nodeName = "Add";
  readonly description = "两个数字相加";

  readonly inputs: Port[] = [
    new Port("a", NumberLabel),
    new Port("b", NumberLabel),
  ];

  readonly outputs: Port[] = [
    new Port("result", NumberLabel),
  ];

  execute(inputPorts: Port[]): Port[] {
    const aPort = inputPorts.find(p => p.name === "a");
    const bPort = inputPorts.find(p => p.name === "b");

    if (!aPort?.getValue() || !bPort?.getValue()) {
      throw new Error("Add节点需要两个数字输入");
    }

    const a = aPort.getValue()!.value;
    const b = bPort.getValue()!.value;
    const result = new NumberLabel(a + b);

    return [
      new Port("result", NumberLabel, result)
    ];
  }
}

export class InputNode extends Node {
  readonly nodeName = "Input";
  readonly description = "图的输入节点";

  readonly inputs: Port[] = [];

  readonly outputs: Port[] = [
    new Port("value", NumberLabel),
  ];

  execute(inputPorts: Port[]): Port[] {
    // Input节点的值应该由图执行引擎提供
    // 这里暂时返回一个测试值
    const result = new NumberLabel(5);

    return [
      new Port("value", NumberLabel, result)
    ];
  }
}

export class OutputNode extends Node {
  readonly nodeName = "Output";
  readonly description = "图的输出节点";

  readonly inputs: Port[] = [
    new Port("input", NumberLabel),
  ];

  readonly outputs: Port[] = [
    new Port("result", NumberLabel),
  ];

  execute(inputPorts: Port[]): Port[] {
    const inputPort = inputPorts.find(p => p.name === "input");
    
    if (!inputPort?.getValue()) {
      throw new Error("Output节点需要输入值");
    }

    // 直接传递输入值到输出
    return [
      new Port("result", NumberLabel, inputPort.getValue()!)
    ];
  }
}

// ========== 容器定义 ==========

export class MathVessel implements AnimaVessel {
  readonly name = "math";
  readonly version = "0.1.0";
  readonly description = "基础数学运算容器";

  getSupportedNodes(): Array<new () => Node> {
    return [
      ConstantNode,
      AddNode,
      InputNode,
      OutputNode,
    ];
  }

  getSupportedLabels(): Array<new (value: any) => SemanticLabel> {
    return [
      NumberLabel,
      StringLabel,
    ];
  }
} 