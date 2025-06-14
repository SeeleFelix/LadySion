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

// ========== 容器系统 ==========

export interface AnimaVessel {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  
  // 容器只提供Node类的列表
  getSupportedNodes(): Array<new () => Node>;
  
  // 容器只提供Label类的列表  
  getSupportedLabels(): Array<new (value: any) => SemanticLabel>;
}

export class VesselRegistry {
  private vessels = new Map<string, AnimaVessel>();
  private nodeClasses = new Map<string, new () => Node>(); // fullNodeName -> NodeClass
  private labelClasses = new Map<string, new (value: any) => SemanticLabel>(); // fullLabelName -> LabelClass

  register(vessel: AnimaVessel): void {
    if (this.vessels.has(vessel.name)) {
      throw new Error(`Vessel ${vessel.name} already registered`);
    }
    
    this.vessels.set(vessel.name, vessel);
    
    // 收集容器的所有Node类
    const supportedNodes = vessel.getSupportedNodes();
    for (const NodeClass of supportedNodes) {
      const nodeInstance = new NodeClass(); // 临时实例获取nodeName
      const fullNodeName = `${vessel.name}.${nodeInstance.nodeName}`;
      this.nodeClasses.set(fullNodeName, NodeClass);
    }
    
    // 收集容器的所有Label类
    const supportedLabels = vessel.getSupportedLabels();
    for (const LabelClass of supportedLabels) {
      const labelInstance = new LabelClass(null); // 临时实例获取labelName
      const fullLabelName = `${vessel.name}.${labelInstance.labelName}`;
      this.labelClasses.set(fullLabelName, LabelClass);
    }
  }

  getVessel(name: string): AnimaVessel | undefined {
    return this.vessels.get(name);
  }

  listVessels(): string[] {
    return Array.from(this.vessels.keys());
  }

  // 框架直接执行Node，不通过容器
  async executeNode(vesselName: string, nodeName: string, inputPorts: Port[]): Promise<Port[]> {
    const fullNodeName = `${vesselName}.${nodeName}`;
    const NodeClass = this.nodeClasses.get(fullNodeName);
    
    if (!NodeClass) {
      throw new Error(`Node not found: ${fullNodeName}`);
    }
    
    const nodeInstance = new NodeClass();
    return await nodeInstance.execute(inputPorts);
  }

  // 框架直接创建Label，不通过容器
  createLabel(vesselName: string, labelName: string, value: any): SemanticLabel {
    const fullLabelName = `${vesselName}.${labelName}`;
    const LabelClass = this.labelClasses.get(fullLabelName);
    
    if (!LabelClass) {
      throw new Error(`Label not found: ${fullLabelName}`);
    }
    
    return new LabelClass(value);
  }

  // 获取Node的元数据信息（通过实例化获取）
  getNodeMetadata(vesselName: string, nodeName: string): { inputs: Port[], outputs: Port[], description: string } | undefined {
    const fullNodeName = `${vesselName}.${nodeName}`;
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
  hasNode(vesselName: string, nodeName: string): boolean {
    const fullNodeName = `${vesselName}.${nodeName}`;
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
  vessel: string;
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
