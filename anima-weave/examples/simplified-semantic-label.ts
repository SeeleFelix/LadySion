// 简化的语义标签系统设计
// 框架只关心统一的SemanticLabel接口，不关心内部实现

/**
 * 语义标签基类 - 框架唯一关心的接口
 */
abstract class SemanticLabel {
  abstract readonly pluginName: string;
  abstract readonly typeName: string;
  
  /**
   * 获取完整的语义标签字符串
   */
  get label(): string {
    return `${this.pluginName}.${this.typeName}`;
  }
  
  /**
   * 验证值是否符合这个语义标签 - 插件自己决定怎么验证
   */
  abstract validate(value: unknown): boolean;
  
  /**
   * 创建默认值 - 插件自己决定怎么创建
   */
  abstract createDefault(): unknown;
  
  /**
   * 类型转换（可选重写）- 插件自己决定是否支持转换
   */
  convertFrom(other: SemanticLabel, value: unknown): unknown | null {
    // 默认不支持转换
    return null;
  }
}

// ========== 插件自定义标签示例 ==========

// 基础字符串标签
class BasicStringLabel extends SemanticLabel {
  readonly pluginName = "basic";
  readonly typeName = "String";
  
  validate(value: unknown): boolean {
    return typeof value === "string";
  }
  
  createDefault(): string {
    return "";
  }
}

// 基础数字标签
class BasicNumberLabel extends SemanticLabel {
  readonly pluginName = "basic";
  readonly typeName = "Number";
  
  validate(value: unknown): boolean {
    return typeof value === "number";
  }
  
  createDefault(): number {
    return 0;
  }
}

// 数学数字标签 - 插件可以有自己的实现方式
class MathNumberLabel extends SemanticLabel {
  readonly pluginName = "math";
  readonly typeName = "Number";
  
  validate(value: unknown): boolean {
    return typeof value === "number" && !isNaN(value) && isFinite(value);
  }
  
  createDefault(): number {
    return 0;
  }
  
  // 支持从basic.Number转换
  override convertFrom(other: SemanticLabel, value: unknown): number | null {
    if (other instanceof BasicNumberLabel && typeof value === "number") {
      return value;
    }
    return null;
  }
}

// UUID标签 - 插件内部实现语义验证
class UUIDLabel extends SemanticLabel {
  readonly pluginName = "basic";
  readonly typeName = "UUID";
  
  validate(value: unknown): boolean {
    if (typeof value !== "string") return false;
    // UUID格式验证 - 插件自己的实现逻辑
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
  
  createDefault(): string {
    return crypto.randomUUID();
  }
}

// 向量标签 - 插件内部实现复合类型逻辑
class Vector2Label extends SemanticLabel {
  readonly pluginName = "math";
  readonly typeName = "Vector2";
  
  validate(value: unknown): boolean {
    // 插件自己决定怎么验证复合类型
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return typeof obj.x === "number" && typeof obj.y === "number";
  }
  
  createDefault(): { x: number; y: number } {
    return { x: 0, y: 0 };
  }
}

// Prompt标签 - 插件内部实现复杂验证逻辑
class PromptLabel extends SemanticLabel {
  readonly pluginName = "basic";
  readonly typeName = "Prompt";
  
  validate(value: unknown): boolean {
    // 插件自己决定怎么验证
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      typeof obj.id === "string" &&
      typeof obj.name === "string" &&
      typeof obj.content === "string"
    );
  }
  
  createDefault(): { id: string; name: string; content: string } {
    return {
      id: crypto.randomUUID(),
      name: "",
      content: ""
    };
  }
}

// 自定义复杂类型 - 插件可以实现任意复杂的验证逻辑
class EmailLabel extends SemanticLabel {
  readonly pluginName = "validation";
  readonly typeName = "Email";
  
  validate(value: unknown): boolean {
    if (typeof value !== "string") return false;
    // 插件自己的邮箱验证逻辑
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
  
  createDefault(): string {
    return "example@example.com";
  }
}

// 数组类型 - 插件可以实现泛型数组
class NumberArrayLabel extends SemanticLabel {
  readonly pluginName = "collections";
  readonly typeName = "NumberArray";
  
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) return false;
    return value.every(item => typeof item === "number");
  }
  
  createDefault(): number[] {
    return [];
  }
}

// ========== 框架的语义值系统 ==========

/**
 * 语义值 - 框架内部使用
 */
class SemanticValue {
  constructor(
    public readonly label: SemanticLabel,
    public readonly value: unknown
  ) {}
  
  /**
   * 类型安全的值获取
   */
  as<T>(): T {
    return this.value as T;
  }
  
  /**
   * 检查是否是特定标签
   */
  is(labelClass: new () => SemanticLabel): boolean {
    return this.label instanceof labelClass;
  }
  
  /**
   * 获取标签字符串
   */
  get labelString(): string {
    return this.label.label;
  }
}

/**
 * 框架的语义值工厂 - 框架只关心这个接口
 */
class SemanticValueFactory {
  private static labelInstances = new Map<string, SemanticLabel>();
  
  /**
   * 注册标签类
   */
  static registerLabel(labelClass: new () => SemanticLabel): void {
    const instance = new labelClass();
    this.labelInstances.set(instance.label, instance);
  }
  
  /**
   * 创建语义值 - 框架调用，不关心插件内部实现
   */
  static create(labelString: string, value: unknown): SemanticValue {
    const label = this.labelInstances.get(labelString);
    if (!label) {
      throw new Error(`Unknown semantic label: ${labelString}`);
    }
    
    // 调用插件的验证逻辑，不关心怎么实现的
    if (!label.validate(value)) {
      throw new Error(`Value ${JSON.stringify(value)} is not valid for label ${labelString}`);
    }
    
    return new SemanticValue(label, value);
  }
  
  /**
   * 创建默认语义值
   */
  static createDefault(labelString: string): SemanticValue {
    const label = this.labelInstances.get(labelString);
    if (!label) {
      throw new Error(`Unknown semantic label: ${labelString}`);
    }
    
    // 调用插件的默认值创建逻辑，不关心怎么实现的
    return new SemanticValue(label, label.createDefault());
  }
  
  /**
   * 类型转换
   */
  static convert(from: SemanticValue, toLabelString: string): SemanticValue | null {
    const toLabel = this.labelInstances.get(toLabelString);
    if (!toLabel) return null;
    
    // 调用插件的转换逻辑，不关心怎么实现的
    const convertedValue = toLabel.convertFrom(from.label, from.value);
    if (convertedValue === null) return null;
    
    return new SemanticValue(toLabel, convertedValue);
  }
  
  /**
   * 获取所有注册的标签
   */
  static getAllLabels(): string[] {
    return Array.from(this.labelInstances.keys());
  }
  
  /**
   * 检查标签是否存在
   */
  static hasLabel(labelString: string): boolean {
    return this.labelInstances.has(labelString);
  }
}

// ========== 插件定义 ==========

/**
 * 节点实现函数 - 接收原始值，返回原始值
 */
type NodeImplementation = (inputs: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;

/**
 * 节点定义
 */
interface NodeDefinition {
  inputs: Record<string, new () => SemanticLabel>;   // 端口名 -> 标签类
  outputs: Record<string, new () => SemanticLabel>;  // 端口名 -> 标签类
  implement: NodeImplementation;
  description?: string;
  category?: string;
}

/**
 * 插件定义
 */
interface PluginDefinition {
  name: string;
  version: string;
  description?: string;
  
  // 注册的标签类 - 框架不关心具体实现
  labels: Array<new () => SemanticLabel>;
  
  // 节点定义
  nodes: Record<string, NodeDefinition>;
}

// ========== 使用示例 ==========

// 数学插件定义
const mathPlugin: PluginDefinition = {
  name: "math",
  version: "1.0.0",
  description: "数学计算插件",
  
  // 注册标签类 - 框架不关心是原始类型还是复合类型
  labels: [
    MathNumberLabel,
    Vector2Label
  ],
  
  // 定义节点
  nodes: {
    add: {
      inputs: { 
        a: MathNumberLabel, 
        b: MathNumberLabel 
      },
      outputs: { 
        result: MathNumberLabel 
      },
      implement: (inputs) => {
        const a = inputs.a as number;
        const b = inputs.b as number;
        return {
          result: a + b
        };
      },
      description: "加法运算"
    },
    
    createVector: {
      inputs: {
        x: MathNumberLabel,
        y: MathNumberLabel
      },
      outputs: {
        vector: Vector2Label
      },
      implement: (inputs) => {
        const x = inputs.x as number;
        const y = inputs.y as number;
        return {
          vector: { x, y }
        };
      },
      description: "创建二维向量"
    },
    
    vectorMagnitude: {
      inputs: {
        vector: Vector2Label
      },
      outputs: {
        magnitude: MathNumberLabel
      },
      implement: (inputs) => {
        const vector = inputs.vector as { x: number; y: number };
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return {
          magnitude
        };
      },
      description: "计算向量模长"
    }
  }
};

// 验证插件定义
const validationPlugin: PluginDefinition = {
  name: "validation",
  version: "1.0.0",
  description: "数据验证插件",
  
  labels: [
    EmailLabel
  ],
  
  nodes: {
    validateEmail: {
      inputs: {
        email: BasicStringLabel
      },
      outputs: {
        isValid: BasicNumberLabel, // 用1/0表示布尔值
        validEmail: EmailLabel
      },
      implement: (inputs) => {
        const email = inputs.email as string;
        const emailLabel = new EmailLabel();
        const isValid = emailLabel.validate(email);
        
        return {
          isValid: isValid ? 1 : 0,
          validEmail: isValid ? email : emailLabel.createDefault()
        };
      },
      description: "验证邮箱格式"
    }
  }
};

// ========== 框架插件适配器 ==========

/**
 * 框架插件适配器 - 框架只关心统一接口
 */
class PluginAdapter {
  constructor(private definition: PluginDefinition) {
    // 注册所有标签类
    for (const LabelClass of definition.labels) {
      SemanticValueFactory.registerLabel(LabelClass);
    }
  }
  
  get name(): string {
    return this.definition.name;
  }
  
  get version(): string {
    return this.definition.version;
  }
  
  getSupportedLabels(): string[] {
    return this.definition.labels.map(LabelClass => {
      const instance = new LabelClass();
      return instance.label;
    });
  }
  
  getSupportedNodes(): string[] {
    return Object.keys(this.definition.nodes);
  }
  
  async executeNode(nodeName: string, inputs: Record<string, SemanticValue>): Promise<Record<string, SemanticValue>> {
    const nodeDef = this.definition.nodes[nodeName];
    if (!nodeDef) {
      throw new Error(`Unknown node: ${nodeName}`);
    }
    
    // 将SemanticValue转换为原始值
    const rawInputs: Record<string, unknown> = {};
    for (const [inputName, semanticValue] of Object.entries(inputs)) {
      rawInputs[inputName] = semanticValue.value;
    }
    
    // 执行节点
    const rawOutputs = await nodeDef.implement(rawInputs);
    
    // 将原始值转换为SemanticValue
    const semanticOutputs: Record<string, SemanticValue> = {};
    for (const [outputName, OutputLabelClass] of Object.entries(nodeDef.outputs)) {
      const outputLabel = new OutputLabelClass();
      const rawValue = rawOutputs[outputName];
      semanticOutputs[outputName] = SemanticValueFactory.create(outputLabel.label, rawValue);
    }
    
    return semanticOutputs;
  }
}

// 使用示例
const mathPluginAdapter = new PluginAdapter(mathPlugin);
const validationPluginAdapter = new PluginAdapter(validationPlugin);

export {
  SemanticLabel,
  SemanticValue,
  SemanticValueFactory,
  PluginAdapter,
  type NodeDefinition,
  type PluginDefinition,
  // 示例标签
  BasicStringLabel,
  BasicNumberLabel,
  MathNumberLabel,
  UUIDLabel,
  Vector2Label,
  PromptLabel,
  EmailLabel,
  NumberArrayLabel,
  // 示例插件
  mathPlugin,
  validationPlugin
}; 