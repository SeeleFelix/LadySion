// AnimaWeave 框架核心
// 定义纯抽象的插件接口，不依赖任何具体插件

// ========== 框架抽象接口 ==========

/**
 * 插件运行时接口 - 框架定义的标准
 */
export interface IAnimaPlugin {
  readonly name: string;
  readonly version: string;

  // 类型系统接口
  getSupportedTypes(): string[];
  validateValue(value: unknown, typeName: string): boolean;
  createDefaultValue(typeName: string): unknown;

  // 节点系统接口
  getSupportedNodes(): string[];
  executeNode(nodeName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>>;

  // 插件元数据
  getPluginDefinition(): PluginDefinition;
}

/**
 * 插件定义结构 - 从anima文件解析出的结构
 */
export interface PluginDefinition {
  metadata: {
    name: string;
    version: string;
    description?: string;
  };
  types: Record<string, TypeDefinition>;
  nodes: Record<string, NodeDefinition>;
}

export interface TypeDefinition {
  name: string;
  kind: "primitive" | "composite" | "semantic";
  baseType?: string;
  fields?: Record<string, string>;
  validation?: string[];
}

export interface NodeDefinition {
  name: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  mode: "Concurrent" | "Sequential";
  description?: string;
}

/**
 * 图执行上下文
 */
export interface ExecutionContext {
  nodeId: string;
  nodeName: string;
  inputs: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * 插件注册表 - 框架核心组件
 */
export class PluginRegistry {
  private plugins = new Map<string, IAnimaPlugin>();

  /**
   * 注册插件
   */
  register(plugin: IAnimaPlugin): void {
    console.log(`🔌 注册插件: ${plugin.name} v${plugin.version}`);

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): IAnimaPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 列出所有插件
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 执行节点
   */
  async executeNode(
    pluginName: string,
    nodeName: string,
    inputs: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const plugin = this.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    if (!plugin.getSupportedNodes().includes(nodeName)) {
      throw new Error(`Node ${nodeName} not supported by plugin ${pluginName}`);
    }

    console.log(`⚙️ 执行节点: ${pluginName}.${nodeName}`, inputs);
    return await plugin.executeNode(nodeName, inputs);
  }

  /**
   * 验证类型值
   */
  validateValue(pluginName: string, typeName: string, value: unknown): boolean {
    const plugin = this.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    return plugin.validateValue(value, typeName);
  }
}

/**
 * DSL解析结果接口
 */
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
  type: string; // 节点类型名
  plugin: string; // 插件名
  parameters?: Record<string, unknown>;
}

export interface WeaveConnection {
  from: { node: string; output: string };
  to: { node: string; input: string };
}

/**
 * 执行结果
 */
export enum ExecutionStatus {
  Success = "success",
  Error = "error",
}

export interface FateEcho {
  status: ExecutionStatus;
  outputs: string;
  getOutputs(): Record<string, unknown>;
}
