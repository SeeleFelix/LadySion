// 最终简化的语义标签系统设计
// 框架只做label名称对比，不做数据校验

/**
 * 语义标签基类 - 框架唯一关心的接口
 */
abstract class SemanticLabel {
  abstract readonly labelName: string;  // 简单的label名称，不带插件前缀
  readonly value: any;  // 任意值
  
  constructor(value: any) {
    this.value = value;
  }
  
  /**
   * 声明这个label能转换到哪些其他label
   * 返回目标label名称数组（可以是其他插件的label）
   */
  getConvertibleLabels(): string[] {
    return [];  // 默认不支持转换
  }
  
  /**
   * 转换到指定的目标label
   * 只有在getConvertibleLabels()中声明的label才能调用
   */
  convertTo(targetLabelName: string): any {
    throw new Error(`Cannot convert ${this.labelName} to ${targetLabelName}`);
  }
}

/**
 * 端口定义
 */
class Port {
  readonly name: string;
  readonly label: new (value: any) => SemanticLabel;  // SemanticLabel类
  private _value?: SemanticLabel;  // 实际的值
  
  constructor(name: string, label: new (value: any) => SemanticLabel, value?: SemanticLabel) {
    this.name = name;
    this.label = label;
    this._value = value;
  }
  
  /**
   * 获取完整的label名称（插件前缀会在运行时解析）
   */
  getLabelName(): string {
    const instance = new this.label(null);
    return instance.labelName;
  }
  
  /**
   * 创建带值的SemanticLabel实例
   */
  createLabel(value: any): SemanticLabel {
    return new this.label(value);
  }
  
  /**
   * 设置端口的值
   */
  setValue(value: SemanticLabel): Port {
    return new Port(this.name, this.label, value);
  }
  
  /**
   * 获取端口的值
   */
  getValue(): SemanticLabel | undefined {
    return this._value;
  }
  
  /**
   * 检查端口是否有值
   */
  hasValue(): boolean {
    return this._value !== undefined;
  }
}

/**
 * 节点基类 - 框架唯一关心的接口
 */
abstract class Node {
  abstract readonly nodeName: string;  // 简单的node名称，不带插件前缀
  abstract readonly inputs: Port[];    // 输入端口数组
  abstract readonly outputs: Port[];   // 输出端口数组
  abstract readonly description: string;  // 必填描述
  
  /**
   * 节点执行逻辑 - 接收Port数组，返回Port数组
   */
  abstract execute(inputPorts: Port[]): Promise<Port[]> | Port[];
  
  /**
   * 获取节点分类 - 可选实现
   */
  getCategory(): string | undefined {
    return undefined;
  }
  
  /**
   * 辅助方法：根据名称查找输入端口的值
   */
  protected getInputValue(inputPorts: Port[], name: string): SemanticLabel {
    const port = inputPorts.find(p => p.name === name);
    if (!port || !port.hasValue()) {
      throw new Error(`Input port '${name}' not found or has no value`);
    }
    return port.getValue()!;
  }
  
  /**
   * 辅助方法：创建输出端口
   */
  protected createOutputPort(name: string, value: any): Port {
    const outputDef = this.outputs.find(p => p.name === name);
    if (!outputDef) {
      throw new Error(`Output port '${name}' not defined`);
    }
    return outputDef.setValue(outputDef.createLabel(value));
  }
}

// ========== 基础插件标签示例 ==========

// 字符串标签
class StringLabel extends SemanticLabel {
  readonly labelName = "String";  // 简单名称
  
  constructor(value: any) {
    super(value);
  }
}

// 数字标签
class NumberLabel extends SemanticLabel {
  readonly labelName = "Number";
  
  constructor(value: any) {
    super(value);
  }
  
  // 声明能转换到数学插件的数字（跨插件转换）
  override getConvertibleLabels(): string[] {
    return ["math.Number"];  // 完整名称指定其他插件
  }
  
  // 实现转换逻辑
  override convertTo(targetLabelName: string): any {
    if (targetLabelName === "math.Number") {
      return this.value;  // 直接返回值，框架会包装成目标label
    }
    return super.convertTo(targetLabelName);
  }
}

// UUID标签
class UUIDLabel extends SemanticLabel {
  readonly labelName = "UUID";
  
  constructor(value: any) {
    super(value);
  }
  
  // UUID可以转换为基础插件的字符串
  override getConvertibleLabels(): string[] {
    return ["basic.String"];  // 跨插件引用
  }
  
  override convertTo(targetLabelName: string): any {
    if (targetLabelName === "basic.String") {
      return this.value;
    }
    return super.convertTo(targetLabelName);
  }
}

// Prompt标签
class PromptLabel extends SemanticLabel {
  readonly labelName = "Prompt";
  
  constructor(value: any) {
    super(value);
  }
}

// ========== 基础插件节点示例 ==========

// 创建字符串节点
class CreateStringNode extends Node {
  readonly nodeName = "createString";
  readonly inputs = [
    new Port("text", StringLabel)
  ];
  readonly outputs = [
    new Port("result", StringLabel)
  ];
  readonly description = "创建字符串";
  
  execute(inputPorts: Port[]) {
    return [
      this.createOutputPort("result", this.getInputValue(inputPorts, "text").value)
    ];
  }
  
  override getCategory() {
    return "basic";
  }
}

// 生成UUID节点
class GenerateUUIDNode extends Node {
  readonly nodeName = "generateUUID";
  readonly inputs: Port[] = [];  // 无输入
  readonly outputs = [
    new Port("uuid", UUIDLabel)
  ];
  readonly description = "生成UUID";
  
  execute(inputPorts: Port[]) {
    return [
      this.createOutputPort("uuid", crypto.randomUUID())
    ];
  }
}

// 转换为Prompt节点
class ConvertToPromptNode extends Node {
  readonly nodeName = "convertToPrompt";
  readonly inputs = [
    new Port("text", StringLabel)
  ];
  readonly outputs = [
    new Port("prompt", PromptLabel)
  ];
  readonly description = "转换为Prompt";
  
  execute(inputPorts: Port[]) {
    return [
      this.createOutputPort("prompt", this.getInputValue(inputPorts, "text").value)
    ];
  }
}

// ========== 数学插件标签示例 ==========

// 数学数字标签
class MathNumberLabel extends SemanticLabel {
  readonly labelName = "Number";  // 在math插件内就叫Number
  
  constructor(value: any) {
    super(value);
  }
  
  // 声明能转换到基础数字
  override getConvertibleLabels(): string[] {
    return ["basic.Number"];  // 跨插件转换
  }
  
  override convertTo(targetLabelName: string): any {
    if (targetLabelName === "basic.Number") {
      return this.value;
    }
    return super.convertTo(targetLabelName);
  }
}

// 向量标签
class Vector2Label extends SemanticLabel {
  readonly labelName = "Vector2";
  
  constructor(value: any) {
    super(value);
  }
  
  // 向量可以转换为数组
  override getConvertibleLabels(): string[] {
    return ["collections.NumberArray"];
  }
  
  override convertTo(targetLabelName: string): any {
    if (targetLabelName === "collections.NumberArray") {
      // 假设value是{x: number, y: number}
      return [this.value.x, this.value.y];
    }
    return super.convertTo(targetLabelName);
  }
}

// ========== 数学插件节点示例 ==========

// 加法节点
class AddNode extends Node {
  readonly nodeName = "add";
  readonly inputs = [
    new Port("a", MathNumberLabel),  // 本插件内的标签类
    new Port("b", MathNumberLabel)
  ];
  readonly outputs = [
    new Port("result", MathNumberLabel)
  ];
  readonly description = "加法运算";
  
  execute(inputPorts: Port[]) {
    return {
      result: this.outputs[0].createLabel(this.getInputValue(inputPorts, "a").value + this.getInputValue(inputPorts, "b").value)
    };
  }
  
  override getCategory() {
    return "arithmetic";
  }
}

// 从基础数字转换节点 - 演示跨插件引用
class ConvertFromBasicNode extends Node {
  readonly nodeName = "convertFromBasic";
  readonly inputs = [
    new Port("basicNum", NumberLabel)  // 引用基础插件的标签类
  ];
  readonly outputs = [
    new Port("mathNum", MathNumberLabel)  // 本插件的标签类
  ];
  readonly description = "从基础数字转换为数学数字";
  
  execute(inputPorts: Port[]) {
    return {
      mathNum: this.outputs[0].createLabel(this.getInputValue(inputPorts, "basicNum").value)
    };
  }
}

// 创建向量节点
class CreateVectorNode extends Node {
  readonly nodeName = "createVector";
  readonly inputs = [
    new Port("x", MathNumberLabel),
    new Port("y", MathNumberLabel)
  ];
  readonly outputs = [
    new Port("vector", Vector2Label)
  ];
  readonly description = "创建二维向量";
  
  execute(inputPorts: Port[]) {
    return {
      vector: this.outputs[0].createLabel({ x: this.getInputValue(inputPorts, "x").value, y: this.getInputValue(inputPorts, "y").value })
    };
  }
}

// 跨插件处理节点
class ProcessWithBasicNode extends Node {
  readonly nodeName = "processWithBasic";
  readonly inputs = [
    new Port("value", MathNumberLabel)
  ];
  readonly outputs = [
    new Port("processed", StringLabel)  // 跨插件输出
  ];
  readonly description = "使用基础插件处理数学数字";
  
  async execute(inputPorts: Port[]) {
    // 这里可以调用其他插件的节点
    // 实际实现中，框架会处理跨插件调用
    return {
      processed: this.outputs[0].createLabel(`Processed: ${this.getInputValue(inputPorts, "value").value}`)
    };
  }
}

// ========== 验证插件标签示例 ==========

// 邮箱标签
class EmailLabel extends SemanticLabel {
  readonly labelName = "Email";
  
  constructor(value: any) {
    super(value);
  }
  
  // 邮箱可以转换为字符串
  override getConvertibleLabels(): string[] {
    return ["basic.String"];
  }
  
  override convertTo(targetLabelName: string): any {
    if (targetLabelName === "basic.String") {
      return this.value;
    }
    return super.convertTo(targetLabelName);
  }
}

// ========== 验证插件节点示例 ==========

// 创建邮箱节点
class CreateEmailNode extends Node {
  readonly nodeName = "createEmail";
  readonly inputs = [
    new Port("emailString", StringLabel)  // 跨插件引用
  ];
  readonly outputs = [
    new Port("email", EmailLabel)  // 本插件标签
  ];
  readonly description = "创建邮箱对象";
  
  execute(inputPorts: Port[]) {
    return {
      email: this.getInputValue(inputPorts, "emailString").value
    };
  }
}

// 验证邮箱节点
class ValidateEmailNode extends Node {
  readonly nodeName = "validateEmail";
  readonly inputs = [
    new Port("email", EmailLabel)
  ];
  readonly outputs = [
    new Port("isValid", NumberLabel),  // 跨插件输出，用数字表示布尔值
    new Port("message", StringLabel)
  ];
  readonly description = "验证邮箱格式";
  
  execute(inputPorts: Port[]) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(this.getInputValue(inputPorts, "email").value);
    return {
      isValid: this.outputs[0].createLabel(isValid ? 1 : 0),
      message: this.outputs[1].createLabel(isValid ? "Valid email" : "Invalid email format")
    };
  }
}

// ========== 集合插件标签示例 ==========

// 数组标签
class NumberArrayLabel extends SemanticLabel {
  readonly labelName = "NumberArray";
  
  constructor(value: any) {
    super(value);
  }
  
  // 数组可以转换为向量（如果长度为2）
  override getConvertibleLabels(): string[] {
    return ["math.Vector2"];
  }
  
  override convertTo(targetLabelName: string): any {
    if (targetLabelName === "math.Vector2") {
      // 假设value是number[]
      if (Array.isArray(this.value) && this.value.length >= 2) {
        return { x: this.value[0], y: this.value[1] };
      }
      throw new Error("Cannot convert array to Vector2: insufficient elements");
    }
    return super.convertTo(targetLabelName);
  }
}

// ========== 集合插件节点示例 ==========

// 创建数组节点
class CreateArrayNode extends Node {
  readonly nodeName = "createArray";
  readonly inputs = [
    new Port("size", NumberLabel)
  ];
  readonly outputs = [
    new Port("array", NumberArrayLabel)
  ];
  readonly description = "创建数字数组";
  
  execute(inputPorts: Port[]) {
    return {
      array: this.outputs[0].createLabel(new Array(this.getInputValue(inputPorts, "size").value).fill(0))
    };
  }
}

// 处理数组节点
class ProcessArrayNode extends Node {
  readonly nodeName = "processArray";
  readonly inputs = [
    new Port("array", NumberArrayLabel)
  ];
  readonly outputs = [
    new Port("sum", MathNumberLabel),  // 跨插件输出
    new Port("length", NumberLabel)
  ];
  readonly description = "处理数组，返回总和和长度";
  
  execute(inputPorts: Port[]) {
    const arrayValue = this.getInputValue(inputPorts, "array").value as number[];
    const sum = arrayValue.reduce((a: number, b: number) => a + b, 0);
    return {
      sum: this.outputs[0].createLabel(sum),
      length: this.outputs[1].createLabel(arrayValue.length)
    };
  }
}

// ========== 工作流插件节点示例 ==========

// 数学数字转字符串节点
class MathToStringNode extends Node {
  readonly nodeName = "mathToString";
  readonly inputs = [
    new Port("number", MathNumberLabel)
  ];
  readonly outputs = [
    new Port("text", StringLabel)
  ];
  readonly description = "将数学数字转换为字符串";
  
  execute(inputPorts: Port[]) {
    return {
      text: `Number: ${this.getInputValue(inputPorts, "number").value}`
    };
  }
}

// 复合处理节点
class ComplexProcessNode extends Node {
  readonly nodeName = "complexProcess";
  readonly inputs = [
    new Port("value", NumberLabel)
  ];
  readonly outputs = [
    new Port("result", StringLabel),
    new Port("uuid", UUIDLabel)
  ];
  readonly description = "复合处理流程";
  
  async execute(inputPorts: Port[]) {
    // 在实际实现中，这里会通过框架调用其他节点
    // 比如：math.convertFromBasic -> math.add -> workflow.mathToString
    // 以及：basic.generateUUID
    return {
      result: `Processed value: ${this.getInputValue(inputPorts, "value").value * 2}`,
      uuid: crypto.randomUUID()
    };
  }
}

// ========== 框架的语义值系统 ==========

/**
 * 框架的语义值工厂 - 管理插件名前缀和label映射
 */
class SemanticValueFactory {
  private static labelClasses = new Map<string, new (value: any) => SemanticLabel>();
  private static pluginNames = new Set<string>();
  
  /**
   * 注册插件的标签类 - 自动添加插件名前缀
   */
  static registerPluginLabels(pluginName: string, labelClasses: Array<new (value: any) => SemanticLabel>): void {
    if (this.pluginNames.has(pluginName)) {
      throw new Error(`Plugin name already exists: ${pluginName}`);
    }
    
    this.pluginNames.add(pluginName);
    
    for (const LabelClass of labelClasses) {
      const instance = new LabelClass(null);  // 临时实例获取labelName
      const fullLabelName = `${pluginName}.${instance.labelName}`;  // 自动添加前缀
      this.labelClasses.set(fullLabelName, LabelClass);
    }
  }
  
  /**
   * 创建语义标签 - 框架调用，使用完整名称
   */
  static create(fullLabelName: string, value: any): SemanticLabel {
    const LabelClass = this.labelClasses.get(fullLabelName);
    if (!LabelClass) {
      throw new Error(`Unknown semantic label: ${fullLabelName}`);
    }
    
    return new LabelClass(value);
  }
  
  /**
   * 类型转换
   */
  static convert(from: SemanticLabel, toFullLabelName: string): SemanticLabel | null {
    // 检查是否支持转换
    if (!from.getConvertibleLabels().includes(toFullLabelName)) {
      return null;
    }
    
    try {
      const convertedValue = from.convertTo(toFullLabelName);
      return this.create(toFullLabelName, convertedValue);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 获取所有注册的标签（完整名称）
   */
  static getAllLabels(): string[] {
    return Array.from(this.labelClasses.keys());
  }
  
  /**
   * 检查标签是否存在
   */
  static hasLabel(fullLabelName: string): boolean {
    return this.labelClasses.has(fullLabelName);
  }
  
  /**
   * 获取标签的转换关系
   */
  static getConversionGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    for (const [fullLabelName, LabelClass] of this.labelClasses.entries()) {
      const instance = new LabelClass(null);
      graph[fullLabelName] = instance.getConvertibleLabels();
    }
    
    return graph;
  }
  
  /**
   * 获取插件的所有标签
   */
  static getPluginLabels(pluginName: string): string[] {
    const prefix = `${pluginName}.`;
    return Array.from(this.labelClasses.keys()).filter(name => name.startsWith(prefix));
  }
}

// ========== 框架的节点系统 ==========

/**
 * 框架的节点工厂 - 管理插件名前缀和节点映射
 */
class NodeFactory {
  private static nodeClasses = new Map<string, new () => Node>();
  
  /**
   * 注册插件的节点类 - 自动添加插件名前缀
   */
  static registerPluginNodes(pluginName: string, nodeClasses: Array<new () => Node>): void {
    for (const NodeClass of nodeClasses) {
      const instance = new NodeClass();  // 临时实例获取nodeName
      const fullNodeName = `${pluginName}.${instance.nodeName}`;  // 自动添加前缀
      this.nodeClasses.set(fullNodeName, NodeClass);
    }
  }
  
  /**
   * 创建节点 - 框架调用，使用完整名称
   */
  static create(fullNodeName: string): Node {
    const NodeClass = this.nodeClasses.get(fullNodeName);
    if (!NodeClass) {
      throw new Error(`Unknown node: ${fullNodeName}`);
    }
    
    return new NodeClass();
  }
  
  /**
   * 获取所有注册的节点（完整名称）
   */
  static getAllNodes(): string[] {
    return Array.from(this.nodeClasses.keys());
  }
  
  /**
   * 检查节点是否存在
   */
  static hasNode(fullNodeName: string): boolean {
    return this.nodeClasses.has(fullNodeName);
  }
  
  /**
   * 获取插件的所有节点
   */
  static getPluginNodes(pluginName: string): string[] {
    const prefix = `${pluginName}.`;
    return Array.from(this.nodeClasses.keys()).filter(name => name.startsWith(prefix));
  }
}

// ========== 插件定义 ==========

/**
 * 插件定义
 */
interface PluginDefinition {
  name: string;  // 插件名，必须唯一
  version: string;
  description?: string;
  
  // 注册的标签类
  labels: Array<new (value: any) => SemanticLabel>;
  
  // 注册的节点类
  nodes: Array<new () => Node>;
}

// ========== 使用示例 ==========

// 基础插件定义
const basicPlugin: PluginDefinition = {
  name: "basic",
  version: "1.0.0",
  description: "基础数据类型插件",
  
  labels: [
    StringLabel,
    NumberLabel,
    UUIDLabel,
    PromptLabel
  ],
  
  nodes: [
    CreateStringNode,
    GenerateUUIDNode,
    ConvertToPromptNode
  ]
};

// 数学插件定义
const mathPlugin: PluginDefinition = {
  name: "math",
  version: "1.0.0",
  description: "数学计算插件",
  
  labels: [
    MathNumberLabel,
    Vector2Label
  ],
  
  nodes: [
    AddNode,
    ConvertFromBasicNode,
    CreateVectorNode,
    ProcessWithBasicNode
  ]
};

// 验证插件定义
const validationPlugin: PluginDefinition = {
  name: "validation",
  version: "1.0.0",
  description: "数据验证插件",
  
  labels: [
    EmailLabel
  ],
  
  nodes: [
    CreateEmailNode,
    ValidateEmailNode
  ]
};

// 集合插件定义
const collectionsPlugin: PluginDefinition = {
  name: "collections",
  version: "1.0.0",
  description: "集合数据类型插件",
  
  labels: [
    NumberArrayLabel
  ],
  
  nodes: [
    CreateArrayNode,
    ProcessArrayNode
  ]
};

// 工作流插件定义
const workflowPlugin: PluginDefinition = {
  name: "workflow",
  version: "1.0.0",
  description: "工作流编排插件",
  
  labels: [],  // 不定义新的标签类型
  
  nodes: [
    MathToStringNode,
    ComplexProcessNode
  ]
};

// ========== 框架插件适配器 ==========

/**
 * 框架插件适配器 - 处理端口解析和转换
 */
class PluginAdapter {
  constructor(private definition: PluginDefinition) {
    // 注册所有标签类到框架
    SemanticValueFactory.registerPluginLabels(definition.name, definition.labels);
    // 注册所有节点类到框架
    NodeFactory.registerPluginNodes(definition.name, definition.nodes);
  }
  
  get name(): string {
    return this.definition.name;
  }
  
  get version(): string {
    return this.definition.version;
  }
  
  getSupportedLabels(): string[] {
    return SemanticValueFactory.getPluginLabels(this.definition.name);
  }
  
  getSupportedNodes(): string[] {
    return NodeFactory.getPluginNodes(this.definition.name);
  }
  
  /**
   * 解析端口的完整label名称
   */
  private resolvePortLabelName(port: Port): string {
    const labelName = port.getLabelName();
    
    // 检查是否是本插件的标签
    const ownLabels = this.definition.labels.map(LabelClass => {
      const instance = new LabelClass(null);
      return instance.labelName;
    });
    
    if (ownLabels.includes(labelName)) {
      return `${this.definition.name}.${labelName}`;  // 本插件标签，添加前缀
    }
    
    // 跨插件标签，需要找到对应的插件名
    // 这里简化处理，实际应该有更完善的解析逻辑
    for (const fullLabelName of SemanticValueFactory.getAllLabels()) {
      if (fullLabelName.endsWith(`.${labelName}`)) {
        return fullLabelName;
      }
    }
    
    throw new Error(`Cannot resolve label: ${labelName}`);
  }
  
  async executeNode(nodeName: string, inputPorts: Port[]): Promise<Port[]> {
    const fullNodeName = nodeName.includes('.') ? nodeName : `${this.definition.name}.${nodeName}`;
    const nodeInstance = NodeFactory.create(fullNodeName);
    
    // 执行节点
    const rawOutputs = await nodeInstance.execute(inputPorts);
    
    // 将原始值转换为SemanticLabel
    const semanticOutputs: Port[] = [];
    for (const outputPort of nodeInstance.outputs) {
      const fullLabelName = this.resolvePortLabelName(outputPort);
      const rawValue = rawOutputs[outputPort.name];
      semanticOutputs.push(outputPort.setValue(SemanticValueFactory.create(fullLabelName, rawValue)));
    }
    
    return semanticOutputs;
  }
  
  /**
   * 获取节点的输入输出定义（解析后的完整名称）
   */
  getNodeDefinition(nodeName: string): { inputs: Record<string, string>, outputs: Record<string, string> } | null {
    const fullNodeName = nodeName.includes('.') ? nodeName : `${this.definition.name}.${nodeName}`;
    
    if (!NodeFactory.hasNode(fullNodeName)) {
      return null;
    }
    
    const nodeInstance = NodeFactory.create(fullNodeName);
    const inputs: Record<string, string> = {};
    const outputs: Record<string, string> = {};
    
    for (const inputPort of nodeInstance.inputs) {
      inputs[inputPort.name] = this.resolvePortLabelName(inputPort);
    }
    
    for (const outputPort of nodeInstance.outputs) {
      outputs[outputPort.name] = this.resolvePortLabelName(outputPort);
    }
    
    return { inputs, outputs };
  }
}

// ========== 框架执行引擎 ==========

/**
 * 跨插件节点执行引擎
 */
class CrossPluginExecutor {
  private static pluginAdapters = new Map<string, PluginAdapter>();
  
  /**
   * 注册插件适配器
   */
  static registerPlugin(adapter: PluginAdapter): void {
    this.pluginAdapters.set(adapter.name, adapter);
  }
  
  /**
   * 执行任意插件的节点
   */
  static async executeNode(fullNodeName: string, inputPorts: Port[]): Promise<Port[]> {
    const [pluginName] = fullNodeName.split('.');
    const adapter = this.pluginAdapters.get(pluginName);
    if (!adapter) {
      throw new Error(`Plugin not registered: ${pluginName}`);
    }
    
    return await adapter.executeNode(fullNodeName, inputPorts);
  }
  
  /**
   * 获取所有可用的节点
   */
  static getAllAvailableNodes(): Record<string, { inputs: Record<string, string>, outputs: Record<string, string> }> {
    const result: Record<string, { inputs: Record<string, string>, outputs: Record<string, string> }> = {};
    
    for (const fullNodeName of NodeFactory.getAllNodes()) {
      const [pluginName] = fullNodeName.split('.');
      const adapter = this.pluginAdapters.get(pluginName);
      if (adapter) {
        const definition = adapter.getNodeDefinition(fullNodeName);
        if (definition) {
          result[fullNodeName] = definition;
        }
      }
    }
    
    return result;
  }
}

// 使用示例
const basicPluginAdapter = new PluginAdapter(basicPlugin);
const mathPluginAdapter = new PluginAdapter(mathPlugin);
const validationPluginAdapter = new PluginAdapter(validationPlugin);
const collectionsPluginAdapter = new PluginAdapter(collectionsPlugin);
const workflowPluginAdapter = new PluginAdapter(workflowPlugin);

// 注册到执行引擎
CrossPluginExecutor.registerPlugin(basicPluginAdapter);
CrossPluginExecutor.registerPlugin(mathPluginAdapter);
CrossPluginExecutor.registerPlugin(validationPluginAdapter);
CrossPluginExecutor.registerPlugin(collectionsPluginAdapter);
CrossPluginExecutor.registerPlugin(workflowPluginAdapter);

// 演示跨插件执行
async function demonstrateCrossPluginExecution() {
  // 创建基础数字
  const basicNumber = SemanticValueFactory.create("basic.Number", 42);
  
  // 调用数学插件转换
  const mathResult = await CrossPluginExecutor.executeNode("math.convertFromBasic", [
    new Port("basicNum", NumberLabel, basicNumber)
  ]);
  
  console.log("Math conversion result:", mathResult[0].getValue()!.value);
  
  // 调用数学插件加法
  const addResult = await CrossPluginExecutor.executeNode("math.add", [
    new Port("a", MathNumberLabel, mathResult[0].getValue()!),
    new Port("b", MathNumberLabel, SemanticValueFactory.create("math.Number", 8))
  ]);
  
  console.log("Addition result:", addResult[0].getValue()!.value);
  
  // 查看所有可用节点
  console.log("All available nodes:", Object.keys(CrossPluginExecutor.getAllAvailableNodes()));
}

// 演示类型转换
const basicNumber = SemanticValueFactory.create("basic.Number", 42);
console.log("Basic number can convert to:", basicNumber.getConvertibleLabels());

const mathNumber = SemanticValueFactory.convert(basicNumber, "math.Number");
if (mathNumber) {
  console.log("Converted to math.Number:", mathNumber.value);
}

// 演示插件查询
console.log("Math plugin labels:", SemanticValueFactory.getPluginLabels("math"));
console.log("Math plugin nodes:", NodeFactory.getPluginNodes("math"));
console.log("All registered labels:", SemanticValueFactory.getAllLabels());
console.log("All registered nodes:", NodeFactory.getAllNodes());

// 演示端口信息
const addNode = new AddNode();
console.log("Add node inputs:", addNode.inputs.map(p => `${p.name}: ${p.getLabelName()}`));
console.log("Add node outputs:", addNode.outputs.map(p => `${p.name}: ${p.getLabelName()}`));

export {
  SemanticLabel,
  Port,
  Node,
  SemanticValueFactory,
  NodeFactory,
  PluginAdapter,
  CrossPluginExecutor,
  type PluginDefinition,
  // 示例标签
  StringLabel,
  NumberLabel,
  UUIDLabel,
  PromptLabel,
  MathNumberLabel,
  Vector2Label,
  EmailLabel,
  NumberArrayLabel,
  // 示例节点
  CreateStringNode,
  GenerateUUIDNode,
  ConvertToPromptNode,
  AddNode,
  ConvertFromBasicNode,
  CreateVectorNode,
  ProcessWithBasicNode,
  CreateEmailNode,
  ValidateEmailNode,
  CreateArrayNode,
  ProcessArrayNode,
  MathToStringNode,
  ComplexProcessNode,
  // 示例插件
  basicPlugin,
  mathPlugin,
  validationPlugin,
  collectionsPlugin,
  workflowPlugin
}; 