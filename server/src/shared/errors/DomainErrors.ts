// 基础领域错误类
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 验证错误
export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;
}

// 未找到错误
export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;
}

// 业务规则违反错误
export class BusinessRuleViolationError extends DomainError {
  readonly code = "BUSINESS_RULE_VIOLATION";
  readonly statusCode = 400;
}

// 外部服务错误
export class ExternalServiceError extends DomainError {
  readonly code = "EXTERNAL_SERVICE_ERROR";
  readonly statusCode = 502;
}

// 配置错误
export class ConfigurationError extends DomainError {
  readonly code = "CONFIGURATION_ERROR";
  readonly statusCode = 500;
}

// 认证错误
export class AuthenticationError extends DomainError {
  readonly code = "AUTHENTICATION_ERROR";
  readonly statusCode = 401;
}

// 权限错误
export class AuthorizationError extends DomainError {
  readonly code = "AUTHORIZATION_ERROR";
  readonly statusCode = 403;
}
