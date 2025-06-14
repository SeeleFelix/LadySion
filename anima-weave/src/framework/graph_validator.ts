// AnimaWeave 图验证器
// 负责静态检查、类型兼容性验证等功能

import type { WeaveGraph, WeaveConnection, WeaveNode, PluginRegistry, IAnimaPlugin, TypeDefinition } from "./core.ts";

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

    // 获取输出端口和输入端口的类型信息
    const fromPlugin = this.registry.getPlugin(fromNode.plugin);
    const toPlugin = this.registry.getPlugin(toNode.plugin);
    
    if (!fromPlugin || !toPlugin) {
      throw new Error(`Plugin not found for connection validation`);
    }

    const fromDefinition = fromPlugin.getPluginDefinition();
    const toDefinition = toPlugin.getPluginDefinition();
    
    // 从 "basic.Start" 中提取 "Start"
    const fromNodeType = fromNode.type.includes('.') ? fromNode.type.split('.')[1] : fromNode.type;
    const toNodeType = toNode.type.includes('.') ? toNode.type.split('.')[1] : toNode.type;
    
    const fromNodeDef = fromDefinition.nodes[fromNodeType];
    const toNodeDef = toDefinition.nodes[toNodeType];
    
    console.log(`🔍 查找节点定义: ${fromNodeType} -> ${toNodeType}`);
    console.log(`📋 可用节点:`, Object.keys(fromDefinition.nodes), Object.keys(toDefinition.nodes));
    
    if (!fromNodeDef || !toNodeDef) {
      throw new Error(`Node definition not found for connection validation`);
    }

    // 获取端口类型
    const outputType = fromNodeDef.outputs[connection.from.output];
    const inputType = toNodeDef.inputs[connection.to.input];
    
    if (!outputType || !inputType) {
      throw new Error(`Port not found: ${connection.from.output} -> ${connection.to.input}`);
    }

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
    try {
      const definition = plugin.getPluginDefinition();
      const rules: Record<string, string[]> = {};
      
      // 为每个语义标签建立兼容性规则
      for (const [typeName, typeDef] of Object.entries(definition.semantic_labels)) {
        const fullTypeName = `${definition.metadata.name}.${typeName}`;
        const typeDefinition = typeDef as TypeDefinition;
        
        // 基础规则：类型与自己兼容
        rules[fullTypeName] = [fullTypeName];
        
        // 特殊兼容性规则
        if (typeName === "UUID") {
          // UUID可以作为String使用
          rules[fullTypeName].push(`${definition.metadata.name}.String`);
        }
        
        // 可以在这里添加更多插件特定的兼容性规则
        // 例如：不同插件间的类型兼容性
      }
      
      return rules;
    } catch (error) {
      console.warn(`⚠️ 获取插件类型兼容性规则失败:`, error);
      return {};
    }
  }
} 