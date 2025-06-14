// AnimaWeave 错误处理器
// 负责错误分类和FateEcho创建等功能

import {
  type ErrorDetails,
  ExecutionStatus,
  type FateEcho,
  type SemanticValue,
  type ValidationErrorContext,
} from "./core.ts";

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
    } else if (
      errorMessage.includes("type") || errorMessage.includes("connection") ||
      errorMessage.includes("validation")
    ) {
      errorCode = ExecutionStatus.ValidationError;
    } else if (errorMessage.includes("vessel") || errorMessage.includes("import")) {
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
        file: `${sanctumPath}/${weaveName}.weave`,
      };
    }

    const errorDetails: ErrorDetails = {
      code: errorCode,
      message: errorMessage,
      location,
      context: { timestamp: new Date().toISOString() },
    };

    const errorSemanticValue: SemanticValue = {
      semantic_label: "system.Error",
      value: errorMessage,
    };

    return {
      status: errorCode,
      outputs: JSON.stringify(errorSemanticValue),
      error: errorDetails,
      executionTrace: undefined,
      getOutputs: () => ({ error: errorSemanticValue }),
      getRawOutputs: () => ({ error: errorMessage }),
      getErrorDetails: () => errorDetails,
      getExecutionTrace: () => null,
    };
  }

  /**
   * 处理验证错误
   */
  static handleValidationError(error: Error): FateEcho {
    console.error("❌ 静态类型检查失败:", error.message);

    // 检查是否包含多个验证错误
    const validationErrors = (error as any).validationErrors;

    let errorDetails: ErrorDetails;
    let outputsString: string;

    if (validationErrors && Array.isArray(validationErrors)) {
      // 多错误情况 - 创建结构化的错误上下文
      const validationContext: ValidationErrorContext = {
        validationErrors: validationErrors,
      };

      errorDetails = {
        code: ExecutionStatus.ValidationError,
        message: error.message,
        context: validationContext,
      };

      // 为了向后兼容，在outputs中也包含错误信息
      const errorSummary = {
        error: error.message,
        type: "validation_error",
        details: validationErrors.map((ve) => ({
          type: ve.type,
          message: ve.message,
          connection:
            `${ve.connection.from.node}.${ve.connection.from.port} -> ${ve.connection.to.node}.${ve.connection.to.port}`,
        })),
      };
      outputsString = JSON.stringify(errorSummary);

      console.error("📋 详细验证错误:");
      validationErrors.forEach((validationError, index) => {
        console.error(`  ${index + 1}. [${validationError.type}] ${validationError.message}`);
        console.error(
          `     连接: ${validationError.connection.from.node}.${validationError.connection.from.port} -> ${validationError.connection.to.node}.${validationError.connection.to.port}`,
        );
        if (validationError.sourceType && validationError.targetType) {
          console.error(
            `     类型: ${validationError.sourceType} -> ${validationError.targetType}`,
          );
        }
      });
    } else {
      // 单错误情况 - 保持向后兼容
      errorDetails = {
        code: ExecutionStatus.ValidationError,
        message: error.message,
        context: { originalError: error.message },
      };

      // 为了向后兼容，在outputs中包含错误信息
      const errorSummary = {
        error: error.message,
        type: "validation_error",
      };
      outputsString = JSON.stringify(errorSummary);
    }

    return {
      status: ExecutionStatus.ValidationError,
      outputs: outputsString,
      getErrorDetails: () => errorDetails,
      getOutputs: () => ({}),
      getRawOutputs: () => ({}),
      getExecutionTrace: () => null,
    };
  }
}
