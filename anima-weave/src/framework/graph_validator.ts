// AnimaWeave 图验证器
// 负责静态检查、类型兼容性验证等功能

import type {
  AnimaVessel,
  ValidationError,
  VesselRegistry,
  WeaveConnection,
  WeaveGraph,
  WeaveNode,
} from "./core.ts";

/**
 * 图验证器 - 处理静态检查和类型验证
 */
export class GraphValidator {
  constructor(private registry: VesselRegistry) {}

  /**
   * 静态图验证 - 在执行前进行类型检查和连接验证
   * 收集所有验证错误，而不是遇到第一个就停止
   */
  async validateGraph(graph: WeaveGraph): Promise<void> {
    console.log("🔍 开始静态图验证...");

    const validationErrors: ValidationError[] = [];

    // 检查所有数据连接的类型兼容性
    for (const connection of graph.connections) {
      if (connection.from && connection.to) {
        try {
          await this.validateConnection(connection, graph);
        } catch (error) {
          // 收集错误而不是立即抛出
          const validationError = this.createValidationError(error, connection, graph);
          validationErrors.push(validationError);
        }
      }
    }

    // 如果有验证错误，抛出包含所有错误的异常
    if (validationErrors.length > 0) {
      const errorMessage = `Found ${validationErrors.length} validation error(s)`;
      const error = new Error(errorMessage);
      (error as any).validationErrors = validationErrors;
      throw error;
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
    const fromMetadata = this.registry.getNodeMetadata(fromNode.vessel, fromNode.type);
    const toMetadata = this.registry.getNodeMetadata(toNode.vessel, toNode.type);

    if (!fromMetadata || !toMetadata) {
      throw new Error(`Node metadata not found for connection validation`);
    }

    console.log(
      `🔍 验证连接: ${fromNode.vessel}.${fromNode.type} -> ${toNode.vessel}.${toNode.type}`,
    );

    // 获取端口信息
    const outputPort = fromMetadata.outputs.find((port) => port.name === connection.from.output);
    const inputPort = toMetadata.inputs.find((port) => port.name === connection.to.input);

    if (!outputPort || !inputPort) {
      throw new Error(`Port not found: ${connection.from.output} -> ${connection.to.input}`);
    }

    // 获取端口的语义标签类型
    const outputLabelInstance = new outputPort.label(null);
    const inputLabelInstance = new inputPort.label(null);

    const outputType = this.registry.getLabelFullTypeName(outputLabelInstance);
    const inputType = this.registry.getLabelFullTypeName(inputLabelInstance);

    // 类型兼容性检查
    if (!this.areTypesCompatible(outputType, inputType)) {
      const errorMessage =
        `Type mismatch in static validation: Cannot connect ${outputType} to ${inputType} (${connection.from.node}.${connection.from.output} -> ${connection.to.node}.${connection.to.input})`;

      console.log(`❌ 静态类型检查失败: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`✅ 连接类型检查通过: ${outputType} -> ${inputType}`);
  }

  /**
   * 检查两个类型是否兼容（支持传递性转换）
   */
  private areTypesCompatible(outputType: string, inputType: string): boolean {
    // 完全匹配
    if (outputType === inputType) {
      return true;
    }

    try {
      // 使用递归查找转换路径
      return this.findConversionPath(outputType, inputType, new Set());
    } catch (error) {
      console.warn(`⚠️ 类型兼容性检查失败:`, error);
      return false;
    }
  }

  /**
   * 递归查找从源类型到目标类型的转换路径
   * @param sourceType 源类型 (如 "basic.Prompts")
   * @param targetType 目标类型 (如 "basic.String")
   * @param visited 已访问的类型集合，防止循环
   * @returns 是否存在转换路径
   */
  private findConversionPath(
    sourceType: string,
    targetType: string,
    visited: Set<string>,
  ): boolean {
    // 防止循环
    if (visited.has(sourceType)) {
      return false;
    }
    visited.add(sourceType);

    // 直接匹配
    if (sourceType === targetType) {
      return true;
    }

    try {
      // 解析源类型
      const [sourceVesselName, sourceLabelName] = sourceType.split(".");
      const [, targetLabelName] = targetType.split(".");

      // 创建源标签实例
      const sourceLabel = this.registry.createLabel(sourceVesselName, sourceLabelName, null);

      // 获取源标签可以直接转换的类型
      const convertibleLabels = sourceLabel.getConvertibleLabels();

      // 检查是否可以直接转换到目标类型
      if (convertibleLabels.includes(targetLabelName)) {
        return true;
      }

      // 递归检查：通过中间类型转换
      for (const intermediateLabelName of convertibleLabels) {
        // 构造中间类型的完整名称
        // 假设中间类型在同一个vessel中（这是一个简化假设）
        const intermediateType = `${sourceVesselName}.${intermediateLabelName}`;

        // 递归查找从中间类型到目标类型的路径
        if (this.findConversionPath(intermediateType, targetType, new Set(visited))) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn(`⚠️ 转换路径查找失败: ${sourceType} -> ${targetType}`, error);
      return false;
    }
  }

  /**
   * 创建结构化的验证错误
   */
  private createValidationError(
    error: unknown,
    connection: WeaveConnection,
    graph: WeaveGraph,
  ): ValidationError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 根据错误消息判断错误类型
    let errorType: ValidationError["type"];
    let sourceType: string | undefined;
    let targetType: string | undefined;

    if (errorMessage.includes("Type mismatch")) {
      errorType = "TYPE_MISMATCH";
      // 尝试从错误消息中提取类型信息
      const typeMatch = errorMessage.match(/Cannot connect ([\w.]+) to ([\w.]+)/);
      if (typeMatch) {
        sourceType = typeMatch[1];
        targetType = typeMatch[2];
      }
    } else if (errorMessage.includes("Port not found")) {
      errorType = "PORT_NOT_FOUND";
    } else if (
      errorMessage.includes("Node metadata not found") || errorMessage.includes("node not found")
    ) {
      errorType = "NODE_NOT_FOUND";
    } else {
      errorType = "CONNECTION_INVALID";
    }

    return {
      type: errorType,
      message: errorMessage,
      connection: {
        from: { node: connection.from.node, port: connection.from.output },
        to: { node: connection.to.node, port: connection.to.input },
      },
      sourceType,
      targetType,
    };
  }
}
