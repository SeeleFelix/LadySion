// AnimaWeave 图验证器
// 负责静态检查、类型兼容性验证等功能

import type { WeaveGraph, WeaveConnection, WeaveNode, PluginRegistry, IAnimaPlugin } from "./core.ts";

/**
 * 图验证器 - 处理静态检查和类型验证
 */
export class GraphValidator {
  constructor(private registry: PluginRegistry) {}

  /**
   * 静态图验证 - 在执行前进行类型检查和连接验证
   */
  async validateGraph(graph: WeaveGraph): Promise<void> {
    console.log("🔍 开始静态图验证...");
    
    // 检查所有数据连接的类型兼容性
    for (const connection of graph.connections) {
      if (connection.from && connection.to) {
        await this.validateConnection(connection, graph);
      }
    }
    
    console.log("✅ 静态图验证通过");
  }

  /**
   * 验证单个连接的类型兼容性
   */
  private async validateConnection(connection: WeaveConnection, graph: WeaveGraph): Promise<void> {
    const fromNode = graph.nodes[connection.from.node];
    const toNode = graph.nodes[connection.to.node];
    
    if (!fromNode || !toNode) {
      throw new Error(`Connection validation failed: node not found`);
    }

    // 获取节点元数据
    const fromMetadata = this.registry.getNodeMetadata(fromNode.plugin, fromNode.type);
    const toMetadata = this.registry.getNodeMetadata(toNode.plugin, toNode.type);
    
    if (!fromMetadata || !toMetadata) {
      throw new Error(`Node metadata not found for connection validation`);
    }

    console.log(`🔍 验证连接: ${fromNode.plugin}.${fromNode.type} -> ${toNode.plugin}.${toNode.type}`);
    
    // 获取端口信息
    const outputPort = fromMetadata.outputs.find(port => port.name === connection.from.output);
    const inputPort = toMetadata.inputs.find(port => port.name === connection.to.input);
    
    if (!outputPort || !inputPort) {
      throw new Error(`Port not found: ${connection.from.output} -> ${connection.to.input}`);
    }

    // 获取端口的语义标签类型
    const outputLabelInstance = new outputPort.label(null);
    const inputLabelInstance = new inputPort.label(null);
    
    const outputType = `${fromNode.plugin}.${outputLabelInstance.labelName}`;
    const inputType = `${toNode.plugin}.${inputLabelInstance.labelName}`;

    // 类型兼容性检查
    if (!this.areTypesCompatible(outputType, inputType)) {
      const errorMessage = `Type mismatch in static validation: Cannot connect ${outputType} to ${inputType} (${connection.from.node}.${connection.from.output} -> ${connection.to.node}.${connection.to.input})`;
      
      console.log(`❌ 静态类型检查失败: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`✅ 连接类型检查通过: ${outputType} -> ${inputType}`);
  }

  /**
   * 检查两个类型是否兼容
   */
  private areTypesCompatible(outputType: string, inputType: string): boolean {
    // 完全匹配
    if (outputType === inputType) {
      return true;
    }
    
    // 🔧 重构：动态查询插件的类型兼容性规则，而不是硬编码basic.类型
    try {
      // 解析输出类型的插件名
      const [outputPluginName] = outputType.split('.');
      const outputPlugin = this.registry.getPlugin(outputPluginName);
      
      if (!outputPlugin) {
        console.warn(`⚠️ 输出类型的插件未找到: ${outputPluginName}`);
        return false;
      }
      
      // 获取插件的类型兼容性规则
      const compatibilityRules = this.getPluginTypeCompatibilityRules(outputPlugin);
      const compatibleTypes = compatibilityRules[outputType] || [];
      
      return compatibleTypes.includes(inputType);
    } catch (error) {
      console.warn(`⚠️ 类型兼容性检查失败:`, error);
      return false;
    }
  }

  /**
   * 获取插件的类型兼容性规则
   */
  private getPluginTypeCompatibilityRules(plugin: IAnimaPlugin): Record<string, string[]> {
    // 简化实现：基础兼容性规则
    const rules: Record<string, string[]> = {};
    
    // 基础规则：每个类型与自己兼容
    // 特殊规则：UUID可以作为String使用
    const pluginName = plugin.name;
    
    // 硬编码一些基础兼容性规则，将来可以通过Label类的方法来扩展
    rules[`${pluginName}.UUID`] = [`${pluginName}.UUID`, `${pluginName}.String`];
    rules[`${pluginName}.String`] = [`${pluginName}.String`];
    rules[`${pluginName}.Int`] = [`${pluginName}.Int`];
    rules[`${pluginName}.Bool`] = [`${pluginName}.Bool`];
    rules[`${pluginName}.Signal`] = [`${pluginName}.Signal`];
    rules[`${pluginName}.Prompt`] = [`${pluginName}.Prompt`];
    
    return rules;
  }
} 