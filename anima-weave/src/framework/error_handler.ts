// AnimaWeave 错误处理器
// 负责错误分类和FateEcho创建等功能

import { ExecutionStatus, type ErrorDetails, type FateEcho, type SemanticValue } from "./core.ts";

/**
 * 错误处理器 - 处理错误分类和FateEcho创建
 */
export class ErrorHandler {
  /**
   * 创建错误FateEcho - 根据错误类型分类
   */
  createErrorFateEcho(error: unknown, sanctumPath?: string, weaveName?: string): FateEcho {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ 图执行失败:", errorMessage);

    // 错误分类逻辑
    let errorCode: ExecutionStatus;
    let location: any = undefined;

    if (errorMessage.includes("parse") || errorMessage.includes("syntax")) {
      errorCode = ExecutionStatus.ParseError;
    } else if (errorMessage.includes("type") || errorMessage.includes("connection") || errorMessage.includes("validation")) {
      errorCode = ExecutionStatus.ValidationError;
    } else if (errorMessage.includes("plugin") || errorMessage.includes("import")) {
      errorCode = ExecutionStatus.ConfigError;
    } else if (errorMessage.includes("requires") && errorMessage.includes("input")) {
      // 这是运行时的节点执行错误
      errorCode = ExecutionStatus.RuntimeError;
    } else if (errorMessage.includes("data") || errorMessage.includes("conversion")) {
      errorCode = ExecutionStatus.DataError;
    } else {
      errorCode = ExecutionStatus.FlowError;
    }

    if (sanctumPath && weaveName) {
      location = {
        file: `${sanctumPath}/${weaveName}.weave`
      };
    }

    const errorDetails: ErrorDetails = {
      code: errorCode,
      message: errorMessage,
      location,
      context: { timestamp: new Date().toISOString() }
    };

    const errorSemanticValue: SemanticValue = {
      semantic_label: "system.Error",
      value: errorMessage
    };

    return {
      status: errorCode,
      outputs: JSON.stringify({ error: errorSemanticValue }),
      error: errorDetails,
      getOutputs: () => ({ error: errorSemanticValue }),
      getRawOutputs: () => ({ error: errorMessage }),
      getErrorDetails: () => errorDetails,
    };
  }
} 