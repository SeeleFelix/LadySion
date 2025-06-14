// AnimaWeave 语义处理器
// 负责语义标签处理、输出转换等功能

import type { SemanticValue } from "./core.ts";

/**
 * 语义处理器 - 处理语义标签和输出转换
 */
export class SemanticHandler {
  /**
   * 将语义标签感知的输出转换为原始值（向后兼容）
   */
  extractRawOutputs(semanticOutputs: Record<string, SemanticValue>): Record<string, unknown> {
    const rawOutputs: Record<string, unknown> = {};

    for (const [key, semanticValue] of Object.entries(semanticOutputs)) {
      rawOutputs[key] = this.extractRawValue(semanticValue);
    }

    return rawOutputs;
  }

  /**
   * 从语义标签值中提取原始值
   */
  private extractRawValue(semanticValue: SemanticValue): unknown {
    if (typeof semanticValue.value === "object" && semanticValue.value !== null) {
      // 检查是否为嵌套的语义标签结构
      const firstValue = Object.values(semanticValue.value)[0];
      if (firstValue && typeof firstValue === "object" && "semantic_label" in firstValue) {
        // 这是嵌套的语义标签结构，递归提取
        const rawObject: Record<string, unknown> = {};
        for (
          const [fieldName, fieldSemanticValue] of Object.entries(
            semanticValue.value as Record<string, SemanticValue>,
          )
        ) {
          rawObject[fieldName] = this.extractRawValue(fieldSemanticValue);
        }
        return rawObject;
      }
    }

    return semanticValue.value;
  }
}
