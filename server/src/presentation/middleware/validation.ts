import { Request, Response, NextFunction } from 'express';

/**
 * 验证中间件
 * 基础的请求验证
 */
export function validationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 基础验证逻辑
  // 可以在这里添加通用的请求验证规则
  
  // 验证请求体大小
  if (req.body && JSON.stringify(req.body).length > 1024 * 1024) { // 1MB限制
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: '请求体过大'
      }
    });
    return;
  }

  next();
} 