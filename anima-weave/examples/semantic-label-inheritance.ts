// 基于继承的语义标签系统设计
// 框架处理SemanticValue创建，插件只需要定义标签类

/**
 * 语义标签基类 - 框架提供
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
   * 验证值是否符合这个语义标签
   */
  abstract validate(value: unknown): boolean;
  
  /**
   * 创建默认值
   */
  abstract createDefault(): unknown;
  
  /**
   * 类型转换（可选重写）
   */
  convertFrom(other: SemanticLabel, value: unknown): unknown | null {
    // 默认不支持转换
    return null;
  }
}

/**
 * 原始类型标签基类
 */
abstract class PrimitiveLabel extends SemanticLabel {
  abstract readonly baseType: "number" | "string" | "boolean";
  
  validate(value: unknown): boolean {
    return typeof value === this.baseType;
  }
}

/**
 * 复合类型标签基类
 */
abstract class CompositeLabel extends SemanticLabel {
  abstract readonly fields: Record<string, SemanticLabel>;
  
  validate(value: unknown): boolean {
    if (typeof value !== "object" || value === null) return false;
    
    const obj = value as Record<string, unknown>;
    for (const [fieldName, fieldLabel] of Object.entries(this.fields)) {
      if (!(fieldName in obj) || !fieldLabel.validate(obj[fieldName])) {
        return false;
      }
    }
    return true;
  }
  
  createDefault(): unknown {
    const result: Record<string, unknown> = {};
    for (const [fieldName, fieldLabel] of Object.entries(this.fields)) {
      result[fieldName] = fieldLabel.createDefault();
    }
    return result;
  }
}

/**
 * 语义类型标签基类（带额外验证规则）
 */
abstract class SemanticTypeLabel extends SemanticLabel {
  abstract readonly baseLabel: SemanticLabel;
  abstract readonly validationRules: string[];
  
  validate(value: unknown): boolean {
    // 首先检查基础类型
    if (!this.baseLabel.validate(value)) return false;
    
    // 然后检查语义规则
    return this.validateSemantics(value);
  }
  
  createDefault(): unknown {
    return this.baseLabel.createDefault();
  }
  
  /**
   * 子类实现具体的语义验证
   */
  protected abstract validateSemantics(value: unknown): boolean;
}

// ========== 框架提供的基础标签 ==========

class BasicStringLabel extends PrimitiveLabel {
  readonly pluginName = "basic";
  readonly typeName = "String";
  readonly baseType = "string" as const;
  
  createDefault(): string {
    return "";
  }
}

class BasicNumberLabel extends PrimitiveLabel {
  readonly pluginName = "basic";
  readonly typeName = "Number";
  readonly baseType = "number" as const;
  
  createDefault(): number {
    return 0;
  }
}

class BasicBooleanLabel extends PrimitiveLabel {
  readonly pluginName = "basic";
  readonly typeName = "Boolean";
  readonly baseType = "boolean" as const;
  
  createDefault(): boolean {
    return false;
  }
}

// ========== 插件自定义标签示例 ==========

// 数学插件的数字标签
class MathNumberLabel extends PrimitiveLabel {
  readonly pluginName = "math";
  readonly typeName = "Number";
  readonly baseType = "number" as const;
  
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

// UUID语义标签
class UUIDLabel extends SemanticTypeLabel {
  readonly pluginName = "basic";
  readonly typeName = "UUID";
  readonly baseLabel = new BasicStringLabel();
  readonly validationRules = ["uuid-format"];
  
  protected validateSemantics(value: unknown): boolean {
    if (typeof value !== "string") return false;
    // UUID格式验证
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
  
  override createDefault(): string {
    return crypto.randomUUID();
  }
}

// 向量标签
class Vector2Label extends CompositeLabel {
  readonly pluginName = "math";
  readonly typeName = "Vector2";
  readonly fields = {
    x: new MathNumberLabel(),
    y: new MathNumberLabel()
  };
}

// Prompt复合标签
class PromptLabel extends CompositeLabel {
  readonly pluginName = "basic";
  readonly typeName = "Prompt";
  readonly fields = {
    id: new UUIDLabel(),
    name: new BasicStringLabel(),
    content: new BasicStringLabel()
  };
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
 * 框架的语义值工厂
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
   * 创建语义值 - 框架调用
   */
  static create(labelString: string, value: unknown): SemanticValue {
    const label = this.labelInstances.get(labelString);
    if (!label) {
      throw new Error(`Unknown semantic label: ${labelString}`);
    }
    
    if (!label.validate(value)) {
      throw new Error(`Value ${value} is not valid for label ${labelString}`);
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
    
    return new SemanticValue(label, label.createDefault());
  }
  
  /**
   * 类型转换
   */
  static convert(from: SemanticValue, toLabelString: string): SemanticValue | null {
    const toLabel = this.labelInstances.get(toLabelString);
    if (!toLabel) return null;
    
    const convertedValue = toLabel.convertFrom(from.label, from.value);
    if (convertedValue === null) return null;
    
    return new SemanticValue(toLabel, convertedValue);
  }
}

// ========== 简化的插件定义 ==========

/**
 * 节点实现函数 - 现在接收原始值，返回原始值
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
  
  // 注册的标签类
  labels: Array<new () => SemanticLabel>;
  
  // 节点定义
  nodes: Record<string, NodeDefinition>;
}

// ========== 使用示例 ==========

// 数学插件定义 - 超级简洁！
const mathPlugin: PluginDefinition = {
  name: "math",
  version: "1.0.0",
  description: "数学计算插件",
  
  // 注册标签类
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
          result: a + b  // 框架会自动包装成SemanticValue
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
          vector: { x, y }  // 框架会自动包装成SemanticValue
        };
      },
      description: "创建二维向量"
    }
  }
};

// ========== 框架插件适配器 ==========

/**
 * 框架插件适配器 - 将新的插件定义转换为框架接口
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

export {
  SemanticLabel,
  PrimitiveLabel,
  CompositeLabel,
  SemanticTypeLabel,
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
  // 示例插件
  mathPlugin
}; 