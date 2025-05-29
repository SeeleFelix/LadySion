import { Response } from 'express'
import { DomainError } from '../../shared/errors/DomainErrors'

/**
 * 基础控制器 - 提供通用的错误处理和请求处理逻辑
 */
export abstract class BaseController {
  
  /**
   * 统一的请求处理方法
   */
  protected async handleRequest(
    handler: () => Promise<void>,
    res: Response
  ): Promise<void> {
    try {
      await handler()
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * 错误处理方法
   */
  private handleError(error: unknown, res: Response): void {
    console.error('Controller error:', error)

    if (error instanceof DomainError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      })
    } else if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      })
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: '未知错误'
        }
      })
    }
  }

  /**
   * 验证必需参数
   */
  protected validateRequired(params: Record<string, any>, required: string[]): void {
    for (const field of required) {
      if (params[field] === undefined || params[field] === null || params[field] === '') {
        throw new Error(`缺少必需参数: ${field}`)
      }
    }
  }

  /**
   * 发送成功响应
   */
  protected sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data
    })
  }

  /**
   * 发送错误响应
   */
  protected sendError(
    res: Response, 
    code: string, 
    message: string, 
    statusCode: number = 400
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message
      }
    })
  }
} 