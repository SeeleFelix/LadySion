// 插件注册和管理系统
// 实现一比一的anima定义到TypeScript实现的映射

import type { AnimaDefinition, TypeDefinition, NodeDefinition } from "../graph/parser.ts";

// 插件运行时接口
export interface PluginRuntime {
  readonly name: string;
  readonly version: string;
  
  // 类型系统
  getTypeDefinition(typeName: string): TypeDefinition | undefined;
  validateValue(value: unknown, typeName: string): boolean;
  castValue(value: unknown, fromType: string, toType: string): unknown;
  
  // 节点执行
  getNodeDefinition(nodeName: string): NodeDefinition | undefined;
  executeNode(nodeName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>>;
}

// 节点执行上下文
export interface NodeExecutionContext {
  nodeId: string;
  nodeName: string;
  inputs: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// 节点实现接口
export interface NodeImplementation {
  (context: NodeExecutionContext): Promise<Record<string, unknown>>;
}

// 插件实现基类
export abstract class BasePlugin implements PluginRuntime {
  protected anima: AnimaDefinition;
  protected nodeImplementations: Record<string, NodeImplementation> = {};

  constructor(anima: AnimaDefinition) {
    this.anima = anima;
    this.registerNodeImplementations();
  }

  get name(): string {
    return this.anima.metadata.name;
  }

  get version(): string {
    return this.anima.metadata.version;
  }

  // 子类必须实现：注册所有节点的具体实现
  protected abstract registerNodeImplementations(): void;

  getTypeDefinition(typeName: string): TypeDefinition | undefined {
    return this.anima.types[typeName];
  }

  getNodeDefinition(nodeName: string): NodeDefinition | undefined {
    return this.anima.nodes[nodeName];
  }

  validateValue(value: unknown, typeName: string): boolean {
    const typeDef = this.getTypeDefinition(typeName);
    if (!typeDef) return false;

    switch (typeDef.kind) {
      case 'primitive':
        return this.validatePrimitive(value, typeName);
      case 'semantic':
        return this.validateSemantic(value, typeDef);
      case 'composite':
        return this.validateComposite(value, typeDef);
      default:
        return false;
    }
  }

  castValue(value: unknown, fromType: string, toType: string): unknown {
    // 实现类型转换逻辑
    if (fromType === toType) return value;
    
    const fromDef = this.getTypeDefinition(fromType);
    const toDef = this.getTypeDefinition(toType);
    
    if (!fromDef || !toDef) {
      throw new Error(`Cannot cast from ${fromType} to ${toType}: type not found`);
    }

    // 语义类型转换逻辑
    if (fromDef.kind === 'semantic' && toDef.kind === 'semantic') {
      if (fromDef.baseType === toDef.baseType) {
        // 同样的底层类型，但不同的语义含义，需要显式转换
        return this.performSemanticCast(value, fromType, toType);
      }
    }

    throw new Error(`Unsupported cast from ${fromType} to ${toType}`);
  }

  async executeNode(nodeName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    const implementation = this.nodeImplementations[nodeName];
    if (!implementation) {
      throw new Error(`Node implementation not found: ${nodeName}`);
    }

    const context: NodeExecutionContext = {
      nodeId: `${nodeName}_${Date.now()}`, // 临时ID生成
      nodeName,
      inputs,
    };

    return await implementation(context);
  }

  // 辅助方法
  private validatePrimitive(value: unknown, typeName: string): boolean {
    switch (typeName) {
      case 'basic.Int':
        return Number.isInteger(value);
      case 'basic.Bool':
        return typeof value === 'boolean';
      case 'basic.String':
        return typeof value === 'string';
      case 'basic.UUID':
        return typeof value === 'string' && this.isValidUUID(value as string);
      case 'basic.Signal':
        return value === null || value === undefined;
      default:
        return false;
    }
  }

  private validateSemantic(value: unknown, typeDef: TypeDefinition): boolean {
    // 先验证底层类型
    if (typeDef.baseType && !this.validateValue(value, typeDef.baseType)) {
      return false;
    }

    // 再验证语义约束
    if (typeDef.validation) {
      return this.validateConstraints(value, typeDef.validation);
    }

    return true;
  }

  private validateComposite(value: unknown, typeDef: TypeDefinition): boolean {
    if (typeof value !== 'object' || value === null) return false;

    const obj = value as Record<string, unknown>;
    
    if (!typeDef.fields) return false;

    // 检查所有必需字段
    for (const [fieldName, fieldType] of Object.entries(typeDef.fields)) {
      if (!(fieldName in obj)) return false;
      if (!this.validateValue(obj[fieldName], fieldType)) return false;
    }

    return true;
  }

  private validateConstraints(value: unknown, constraints: string[]): boolean {
    // 实现约束验证逻辑
    // 这里可以实现各种语义约束检查
    return true; // 简化实现
  }

  private performSemanticCast(value: unknown, fromType: string, toType: string): unknown {
    // 实现语义类型转换
    // 例如：Prompt -> Rules 的转换逻辑
    return value; // 简化实现
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}

// 插件注册表
export class PluginRegistry {
  private plugins: Map<string, PluginRuntime> = new Map();

  register(plugin: PluginRuntime): void {
    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): PluginRuntime | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  async executeNode(pluginName: string, nodeName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    const plugin = this.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    return await plugin.executeNode(nodeName, inputs);
  }
} 