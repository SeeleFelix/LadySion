import { Request, Response, NextFunction } from 'express'
import { DomainError } from '../../shared/errors/DomainErrors'

/**
 * 错误处理中间件
 */
export function errorHandlingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Unhandled error:', error)

  if (error instanceof DomainError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    })
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? '内部服务器错误' 
          : error.message
      }
    })
  }
} 