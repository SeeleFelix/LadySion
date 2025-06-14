// 语义标签数据结构抽象设计
// 运行时没有类型，所以我们用语义标签来承载类型信息

/**
 * 语义值 - 运行时的类型载体
 */
class SemanticValue {
  constructor(
    public readonly label: string,    // 语义标签，如 "basic.UUID", "math.Number"
    public readonly value: unknown,   // 实际值，运行时什么都可能是
    public readonly metadata?: Record<string, unknown> // 额外元数据
  ) {}

  /**
   * 类型安全的值获取
   */
  as<T>(): T {
    return this.value as T;
  }

  /**
   * 类型检查
   */
  is(label: string): boolean {
    return this.label === label;
  }

  /**
   * 语义标签匹配
   */
  matches(pattern: string): boolean {
    // 支持通配符匹配，如 "basic.*" 匹配所有basic插件的类型
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(this.label);
  }

  /**
   * 转换为其他语义标签
   */
  transform(newLabel: string, transformer?: (value: unknown) => unknown): SemanticValue {
    const newValue = transformer ? transformer(this.value) : this.value;
    return new SemanticValue(newLabel, newValue, this.metadata);
  }

  /**
   * 序列化
   */
  toJSON() {
    return {
      label: this.label,
      value: this.value,
      metadata: this.metadata
    };
  }

  /**
   * 反序列化
   */
  static fromJSON(json: any): SemanticValue {
    return new SemanticValue(json.label, json.value, json.metadata);
  }
}

/**
 * 语义值工厂 - 简化创建过程
 */
class SemanticValueFactory {
  /**
   * 创建基础类型的语义值
   */
  static primitive(pluginName: string, typeName: string, value: unknown): SemanticValue {
    return new SemanticValue(`${pluginName}.${typeName}`, value);
  }

  /**
   * 创建复合类型的语义值
   */
  static composite(pluginName: string, typeName: string, fields: Record<string, SemanticValue>): SemanticValue {
    const value = Object.fromEntries(
      Object.entries(fields).map(([key, semanticValue]) => [key, semanticValue.value])
    );
    
    const metadata = {
      fields: Object.fromEntries(
        Object.entries(fields).map(([key, semanticValue]) => [key, semanticValue.label])
      )
    };

    return new SemanticValue(`${pluginName}.${typeName}`, value, metadata);
  }

  /**
   * 从原始值推断语义标签
   */
  static infer(value: unknown, defaultPlugin = "basic"): SemanticValue {
    if (typeof value === "number") {
      return new SemanticValue(`${defaultPlugin}.Number`, value);
    } else if (typeof value === "string") {
      return new SemanticValue(`${defaultPlugin}.String`, value);
    } else if (typeof value === "boolean") {
      return new SemanticValue(`${defaultPlugin}.Boolean`, value);
    } else if (value === null || value === undefined) {
      return new SemanticValue(`${defaultPlugin}.Null`, value);
    } else {
      return new SemanticValue(`${defaultPlugin}.Any`, value);
    }
  }
}

/**
 * 插件基类 - 使用语义值抽象
 */
abstract class SemanticPlugin {
  abstract readonly name: string;
  abstract readonly version: string;

  /**
   * 获取支持的语义标签
   */
  abstract getSupportedLabels(): string[];

  /**
   * 获取支持的节点
   */
  abstract getSupportedNodes(): string[];

  /**
   * 验证语义值
   */
  abstract validateSemanticValue(semanticValue: SemanticValue): boolean;

  /**
   * 创建默认语义值
   */
  abstract createDefaultSemanticValue(label: string): SemanticValue;

  /**
   * 执行节点 - 输入输出都是语义值
   */
  abstract executeNode(
    nodeName: string, 
    inputs: Record<string, SemanticValue>
  ): Promise<Record<string, SemanticValue>>;

  /**
   * 语义值转换 - 插件间类型转换
   */
  convertSemanticValue(from: SemanticValue, toLabel: string): SemanticValue | null {
    // 默认实现：如果标签相同就直接返回
    if (from.label === toLabel) {
      return from;
    }
    
    // 子类可以重写实现自定义转换逻辑
    return null;
  }
}

/**
 * 示例：数学插件使用语义值抽象
 */
class MathPlugin extends SemanticPlugin {
  readonly name = "math";
  readonly version = "1.0.0";

  getSupportedLabels(): string[] {
    return ["math.Number", "math.Result"];
  }

  getSupportedNodes(): string[] {
    return ["add", "multiply", "power"];
  }

  validateSemanticValue(semanticValue: SemanticValue): boolean {
    if (semanticValue.is("math.Number")) {
      return typeof semanticValue.value === "number";
    }
    if (semanticValue.is("math.Result")) {
      const value = semanticValue.value as any;
      return typeof value?.result === "number" && typeof value?.operation === "string";
    }
    return false;
  }

  createDefaultSemanticValue(label: string): SemanticValue {
    if (label === "math.Number") {
      return new SemanticValue("math.Number", 0);
    }
    if (label === "math.Result") {
      return new SemanticValue("math.Result", { result: 0, operation: "unknown" });
    }
    throw new Error(`Unknown label: ${label}`);
  }

  async executeNode(
    nodeName: string, 
    inputs: Record<string, SemanticValue>
  ): Promise<Record<string, SemanticValue>> {
    
    switch (nodeName) {
      case "add": {
        const a = inputs.a?.as<number>() ?? 0;
        const b = inputs.b?.as<number>() ?? 0;
        const result = a + b;
        
        return {
          result: new SemanticValue("math.Number", result),
          operation: new SemanticValue("basic.String", `${a} + ${b} = ${result}`)
        };
      }
      
      case "multiply": {
        const a = inputs.a?.as<number>() ?? 0;
        const b = inputs.b?.as<number>() ?? 0;
        const result = a * b;
        
        return {
          result: new SemanticValue("math.Number", result),
          operation: new SemanticValue("basic.String", `${a} × ${b} = ${result}`)
        };
      }
      
      case "power": {
        const base = inputs.base?.as<number>() ?? 0;
        const exponent = inputs.exponent?.as<number>() ?? 0;
        const result = Math.pow(base, exponent);
        
        return {
          result: new SemanticValue("math.Number", result),
          operation: new SemanticValue("basic.String", `${base}^${exponent} = ${result}`)
        };
      }
      
      default:
        throw new Error(`Unknown node: ${nodeName}`);
    }
  }

     /**
    * 数学插件的类型转换逻辑
    */
   override convertSemanticValue(from: SemanticValue, toLabel: string): SemanticValue | null {
    // math.Number 可以转换为 basic.Number
    if (from.is("math.Number") && toLabel === "basic.Number") {
      return new SemanticValue("basic.Number", from.value);
    }
    
    // basic.Number 可以转换为 math.Number
    if (from.is("basic.Number") && toLabel === "math.Number") {
      return new SemanticValue("math.Number", from.value);
    }
    
    return super.convertSemanticValue(from, toLabel);
  }
}

/**
 * 声明式插件定义 - 使用语义值
 */
interface SemanticPluginDefinition {
  name: string;
  version: string;
  
  // 语义标签定义
  labels: Record<string, {
    kind: "primitive" | "composite" | "semantic";
    baseType?: string;
    fields?: Record<string, string>;
    validation?: string[];
  }>;
  
  // 节点定义 - 输入输出都是语义标签
  nodes: Record<string, {
    inputs: Record<string, string>;   // 端口名 -> 语义标签
    outputs: Record<string, string>;  // 端口名 -> 语义标签
    implement: (inputs: Record<string, SemanticValue>) => Promise<Record<string, SemanticValue>> | Record<string, SemanticValue>;
  }>;
}

/**
 * 声明式插件工厂
 */
function defineSemanticPlugin(definition: SemanticPluginDefinition): SemanticPlugin {
  return new class extends SemanticPlugin {
    override readonly name = definition.name;
    override readonly version = definition.version;

    override getSupportedLabels(): string[] {
      return Object.keys(definition.labels).map(label => `${this.name}.${label}`);
    }

    override getSupportedNodes(): string[] {
      return Object.keys(definition.nodes);
    }

    override validateSemanticValue(semanticValue: SemanticValue): boolean {
      // 根据定义自动生成验证逻辑
      const [pluginName, typeName] = semanticValue.label.split('.');
      if (pluginName !== this.name) return false;
      
      const labelDef = definition.labels[typeName];
      if (!labelDef) return false;
      
      // 这里可以根据labelDef.kind和validation规则进行验证
      return true; // 简化实现
    }

    override createDefaultSemanticValue(label: string): SemanticValue {
      const [pluginName, typeName] = label.split('.');
      const labelDef = definition.labels[typeName];
      
      if (labelDef?.kind === "primitive") {
        const defaultValue = labelDef.baseType === "number" ? 0 : 
                           labelDef.baseType === "string" ? "" : 
                           labelDef.baseType === "boolean" ? false : null;
        return new SemanticValue(label, defaultValue);
      }
      
      return new SemanticValue(label, null);
    }

    override async executeNode(
      nodeName: string, 
      inputs: Record<string, SemanticValue>
    ): Promise<Record<string, SemanticValue>> {
      const nodeDef = definition.nodes[nodeName];
      if (!nodeDef) {
        throw new Error(`Unknown node: ${nodeName}`);
      }
      
      const result = await nodeDef.implement(inputs);
      return result;
    }
  };
}

// 使用示例
const declarativeMathPlugin = defineSemanticPlugin({
  name: "math",
  version: "1.0.0",
  
  labels: {
    "Number": { kind: "primitive", baseType: "number" },
    "Result": { 
      kind: "composite", 
      fields: { 
        value: "math.Number", 
        operation: "basic.String" 
      } 
    }
  },
  
  nodes: {
    add: {
      inputs: { a: "math.Number", b: "math.Number" },
      outputs: { result: "math.Number" },
      implement: (inputs) => {
        const a = inputs.a?.as<number>() ?? 0;
        const b = inputs.b?.as<number>() ?? 0;
        return {
          result: new SemanticValue("math.Number", a + b)
        };
      }
    }
  }
});

export {
  SemanticValue,
  SemanticValueFactory,
  SemanticPlugin,
  defineSemanticPlugin,
  type SemanticPluginDefinition
}; 