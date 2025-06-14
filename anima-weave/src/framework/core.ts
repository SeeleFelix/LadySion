// AnimaWeave 框架核心定义

// ========== 语义标签系统 ==========

export abstract class SemanticLabel {
  abstract readonly labelName: string;
  readonly value: any;
  
  constructor(value: any) {
    this.value = value;
  }
  
  getConvertibleLabels(): string[] {
    return [];
  }
  
  convertTo(targetLabelName: string): any {
    throw new Error(`Conversion from ${this.labelName} to ${targetLabelName} not supported`);
  }
}

export class Port {
  readonly name: string;
  readonly label: new (value: any) => SemanticLabel;
  private _value?: SemanticLabel;
  
  constructor(name: string, label: new (value: any) => SemanticLabel, value?: SemanticLabel) {
    this.name = name;
    this.label = label;
    this._value = value;
  }
  
  getValue(): SemanticLabel | undefined {
    return this._value;
  }
  
  setValue(value: SemanticLabel): Port {
    return new Port(this.name, this.label, value);
  }
}

export abstract class Node {
  abstract readonly nodeName: string;
  abstract readonly inputs: Port[];
  abstract readonly outputs: Port[];
  abstract readonly description: string;
  
  abstract execute(inputPorts: Port[]): Promise<Port[]> | Port[];
}

// ========== 插件系统 ==========

export interface IAnimaPlugin {
  readonly name: string;
  readonly version: string;
  
  // 插件只提供Node类的列表
  getSupportedNodes(): Array<new () => Node>;
  
  // 插件只提供Label类的列表  
  getSupportedLabels(): Array<new (value: any) => SemanticLabel>;
}

export class PluginRegistry {
  private plugins = new Map<string, IAnimaPlugin>();
  private nodeClasses = new Map<string, new () => Node>(); // fullNodeName -> NodeClass
  private labelClasses = new Map<string, new (value: any) => SemanticLabel>(); // fullLabelName -> LabelClass

  register(plugin: IAnimaPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    
    this.plugins.set(plugin.name, plugin);
    
    // 收集插件的所有Node类
    const supportedNodes = plugin.getSupportedNodes();
    for (const NodeClass of supportedNodes) {
      const nodeInstance = new NodeClass(); // 临时实例获取nodeName
      const fullNodeName = `${plugin.name}.${nodeInstance.nodeName}`;
      this.nodeClasses.set(fullNodeName, NodeClass);
    }
    
    // 收集插件的所有Label类
    const supportedLabels = plugin.getSupportedLabels();
    for (const LabelClass of supportedLabels) {
      const labelInstance = new LabelClass(null); // 临时实例获取labelName
      const fullLabelName = `${plugin.name}.${labelInstance.labelName}`;
      this.labelClasses.set(fullLabelName, LabelClass);
    }
  }

  getPlugin(name: string): IAnimaPlugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  // 框架直接执行Node，不通过插件
  async executeNode(pluginName: string, nodeName: string, inputPorts: Port[]): Promise<Port[]> {
    const fullNodeName = `${pluginName}.${nodeName}`;
    const NodeClass = this.nodeClasses.get(fullNodeName);
    
    if (!NodeClass) {
      throw new Error(`Node not found: ${fullNodeName}`);
    }
    
    const nodeInstance = new NodeClass();
    return await nodeInstance.execute(inputPorts);
  }

  // 框架直接创建Label，不通过插件
  createLabel(pluginName: string, labelName: string, value: any): SemanticLabel {
    const fullLabelName = `${pluginName}.${labelName}`;
    const LabelClass = this.labelClasses.get(fullLabelName);
    
    if (!LabelClass) {
      throw new Error(`Label not found: ${fullLabelName}`);
    }
    
    return new LabelClass(value);
  }

  // 获取Node的元数据信息（通过实例化获取）
  getNodeMetadata(pluginName: string, nodeName: string): { inputs: Port[], outputs: Port[], description: string } | undefined {
    const fullNodeName = `${pluginName}.${nodeName}`;
    const NodeClass = this.nodeClasses.get(fullNodeName);
    
    if (!NodeClass) {
      return undefined;
    }
    
    const nodeInstance = new NodeClass();
    return {
      inputs: nodeInstance.inputs,
      outputs: nodeInstance.outputs,
      description: nodeInstance.description
    };
  }

  // 检查Node是否存在
  hasNode(pluginName: string, nodeName: string): boolean {
    const fullNodeName = `${pluginName}.${nodeName}`;
    return this.nodeClasses.has(fullNodeName);
  }

  // 获取所有注册的Node
  getAllNodes(): string[] {
    return Array.from(this.nodeClasses.keys());
  }
}

// ========== 图结构 ==========

export interface WeaveGraph {
  nodes: Record<string, WeaveNode>;
  connections: WeaveConnection[];
  imports: string[];
  metadata: {
    name: string;
    entry_points: string[];
  };
}

export interface WeaveNode {
  id: string;
  type: string;
  plugin: string;
  parameters?: Record<string, unknown>;
}

export interface WeaveConnection {
  from: { node: string; output: string };
  to: { node: string; input: string };
}

export interface SemanticValue {
  semantic_label: string;
  value: unknown;
}

// ========== 执行结果 ==========

export enum ExecutionStatus {
  Success = "success",
  ParseError = "parse_error",
  ValidationError = "validation_error",
  ConfigError = "config_error",
  RuntimeError = "runtime_error",
  DataError = "data_error",
  FlowError = "flow_error",
}

export interface ErrorDetails {
  code: ExecutionStatus;
  message: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
    node?: string;
    connection?: string;
  };
  context?: Record<string, unknown>;
}

export interface FateEcho {
  status: ExecutionStatus;
  outputs: string;
  error?: ErrorDetails;
  getOutputs(): Record<string, SemanticValue>;
  getRawOutputs(): Record<string, unknown>;
  getErrorDetails(): ErrorDetails | null;
}

export function isStaticError(status: ExecutionStatus): boolean {
  return status === ExecutionStatus.ParseError || 
         status === ExecutionStatus.ValidationError || 
         status === ExecutionStatus.ConfigError;
}

export function isRuntimeError(status: ExecutionStatus): boolean {
  return status === ExecutionStatus.RuntimeError || 
         status === ExecutionStatus.DataError || 
         status === ExecutionStatus.FlowError;
}
