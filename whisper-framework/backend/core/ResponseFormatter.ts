/**
 * ✨ 响应格式化器
 * 将后端方法返回值格式化为标准 Grace 响应格式
 */

import type { Grace, Omen } from "../../types/core.ts";
import { OmenError, WrathError } from "../../types/core.ts";

/**
 * 🌟 响应格式化器
 */
export class ResponseFormatter {
  /**
   * ✅ 格式化成功响应
   */
  formatSuccess<T>(data: T): Grace<T> {
    return {
      eidolon: data,
      omen: {
        code: 200,
        status: "success",
        message: "操作成功",
        signal: "success",
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 🚨 格式化错误响应
   */
  formatError(error: any): Grace<null> {
    // 🔍 区分业务错误和系统错误
    if (error instanceof OmenError) {
      return this.formatBusinessError(error);
    } else if (error instanceof WrathError) {
      return this.formatSystemError(error);
    } else {
      return this.formatUnknownError(error);
    }
  }

  /**
   * 📋 格式化业务错误 (OmenError)
   */
  private formatBusinessError(error: OmenError): Grace<null> {
    return {
      eidolon: null,
      omen: error.omen,
      timestamp: Date.now(),
    };
  }

  /**
   * ⚡ 格式化系统错误 (WrathError)
   */
  private formatSystemError(error: WrathError): Grace<null> {
    return {
      eidolon: null,
      omen: error.omen,
      timestamp: Date.now(),
    };
  }

  /**
   * ❓ 格式化未知错误
   */
  private formatUnknownError(error: any): Grace<null> {
    const message = error instanceof Error ? error.message : String(error);

    return {
      eidolon: null,
      omen: {
        code: 500,
        status: "error",
        message: `内部服务器错误: ${message}`,
        signal: "internal_error",
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 🔍 格式化 404 错误 - Seeker 或方法未找到
   */
  formatNotFoundError(eidolon: string, ritual: string): Grace<null> {
    return {
      eidolon: null,
      omen: {
        code: 404,
        status: "error",
        message: `未找到 ${eidolon}.${ritual} 方法`,
        signal: "method_not_found",
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 🔒 格式化认证错误
   */
  formatAuthError(message: string = "认证失败"): Grace<null> {
    return {
      eidolon: null,
      omen: {
        code: 401,
        status: "error",
        message,
        signal: "auth_failed",
      },
      timestamp: Date.now(),
    };
  }

  /**
   * ⛔ 格式化权限错误
   */
  formatPermissionError(message: string = "权限不足"): Grace<null> {
    return {
      eidolon: null,
      omen: {
        code: 403,
        status: "error",
        message,
        signal: "permission_denied",
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 📊 格式化验证错误
   */
  formatValidationError(message: string, details?: any): Grace<null> {
    const detailsText = details ? ` - ${JSON.stringify(details)}` : "";
    return {
      eidolon: null,
      omen: {
        code: 400,
        status: "error",
        message: `请求验证失败: ${message}${detailsText}`,
        signal: "validation_error",
      },
      timestamp: Date.now(),
    };
  }

  /**
   * ⏱️ 格式化超时错误
   */
  formatTimeoutError(timeout: number): Grace<null> {
    return {
      eidolon: null,
      omen: {
        code: 408,
        status: "error",
        message: `请求超时 (${timeout}ms)`,
        signal: "timeout_error",
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 📈 格式化限流错误
   */
  formatRateLimitError(retryAfter?: number): Grace<null> {
    const message = retryAfter ? `请求频率过高，请在 ${retryAfter} 秒后重试` : "请求频率过高";

    return {
      eidolon: null,
      omen: {
        code: 429,
        status: "error",
        message,
        signal: "rate_limit_exceeded",
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 🔧 格式化自定义 Omen
   */
  formatCustomOmen<T>(data: T | null, omen: Omen): Grace<T> {
    return {
      eidolon: data,
      omen,
      timestamp: Date.now(),
    };
  }

  /**
   * 📊 创建分页响应
   */
  formatPagedResponse<T>(
    data: T[],
    pagination: {
      page: number;
      size: number;
      total: number;
      totalPages: number;
    },
  ): Grace<{
    items: T[];
    pagination: typeof pagination;
  }> {
    return {
      eidolon: {
        items: data,
        pagination,
      },
      omen: {
        code: 200,
        status: "success",
        message: `获取第 ${pagination.page + 1} 页数据成功`,
        signal: "paged_success",
      },
      timestamp: Date.now(),
    };
  }
}
