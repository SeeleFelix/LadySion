//! AnimaWeave 分层错误处理系统
//!
//! 设计原则：
//! 1. 业务错误 - 可恢复，记录日志，返回结果
//! 2. 系统错误 - 可重试，降级处理
//! 3. 配置错误 - 启动时检查，快速失败
//! 4. 致命错误 - 优雅停止，保存状态

// TODO: 看起来设计的不错，但是好像没有用起来
use crate::types::{ExecutionId, NodeName};
use std::fmt;
use thiserror::Error;

/// 错误严重程度级别
#[derive(Debug, Clone, PartialEq)]
pub enum ErrorSeverity {
    /// 信息级别 - 记录但不影响执行
    Info,
    /// 警告级别 - 潜在问题，需要关注
    Warning,
    /// 错误级别 - 影响当前操作，但系统可继续
    Error,
    /// 严重级别 - 影响系统功能，需要人工介入
    Critical,
    /// 致命级别 - 系统无法继续，必须停止
    Fatal,
}

/// 错误恢复策略
#[derive(Debug, Clone)]
pub enum RecoveryStrategy {
    /// 忽略错误，继续执行
    Ignore,
    /// 重试操作（带最大重试次数）
    Retry { max_attempts: u32, delay_ms: u64 },
    /// 降级处理（使用备选方案）
    Fallback { alternative: String },
    /// 跳过当前操作，继续下一个
    Skip,
    /// 停止当前节点，但系统继续
    StopNode,
    /// 停止整个系统
    Shutdown,
}

/// 业务逻辑错误 - 节点执行过程中的错误
#[derive(Error, Debug)]
pub enum BusinessError {
    #[error("输入验证失败: {port} - {reason}")]
    InputValidation { port: String, reason: String },

    #[error("类型转换失败: {from_type} -> {to_type}, 原因: {reason}")]
    TypeConversion {
        from_type: String,
        to_type: String,
        reason: String,
    },

    #[error("节点执行逻辑错误: {node_name} - {reason}")]
    ExecutionLogic { node_name: NodeName, reason: String },

    #[error("资源不足: {resource} - {details}")]
    ResourceExhausted { resource: String, details: String },
}

/// 系统通信错误 - Actor间通信问题
#[derive(Error, Debug)]
pub enum CommunicationError {
    #[error("Actor消息发送失败: {target_actor} - {reason}")]
    MessageSendFailure {
        target_actor: String,
        reason: String,
    },

    #[error("Actor不可达: {actor_name}")]
    ActorUnreachable { actor_name: String },

    #[error("消息超时: {timeout_ms}ms")]
    MessageTimeout { timeout_ms: u64 },

    #[error("Actor已停止: {actor_name}")]
    ActorStopped { actor_name: String },
}

/// 配置错误 - 启动时的配置问题
#[derive(Error, Debug)]
pub enum ConfigurationError {
    #[error("图定义无效: {reason}")]
    InvalidGraph { reason: String },

    #[error("节点类型未注册: {node_type}")]
    UnregisteredNodeType { node_type: String },

    #[error("循环依赖: {cycle:?}")]
    CircularDependency { cycle: Vec<NodeName> },

    #[error("端口连接无效: {from_port} -> {to_port}, 原因: {reason}")]
    InvalidConnection {
        from_port: String,
        to_port: String,
        reason: String,
    },
}

/// 系统级错误 - 运行时系统问题
#[derive(Error, Debug)]
pub enum SystemError {
    #[error("内存不足")]
    OutOfMemory,

    #[error("线程池饱和")]
    ThreadPoolSaturated,

    #[error("数据存储错误: {reason}")]
    DataStoreFailure { reason: String },

    #[error("系统资源错误: {resource} - {reason}")]
    ResourceFailure { resource: String, reason: String },
}

/// 统一错误类型 - 包含所有可能的错误
#[derive(Error, Debug)]
pub enum AnimaWeaveError {
    #[error("业务错误: {0}")]
    Business(#[from] BusinessError),

    #[error("通信错误: {0}")]
    Communication(#[from] CommunicationError),

    #[error("配置错误: {0}")]
    Configuration(#[from] ConfigurationError),

    #[error("系统错误: {0}")]
    System(#[from] SystemError),
}

impl AnimaWeaveError {
    /// 获取错误的严重程度
    pub fn severity(&self) -> ErrorSeverity {
        match self {
            AnimaWeaveError::Business(BusinessError::InputValidation { .. }) => {
                ErrorSeverity::Warning
            }
            AnimaWeaveError::Business(BusinessError::TypeConversion { .. }) => ErrorSeverity::Error,
            AnimaWeaveError::Business(BusinessError::ExecutionLogic { .. }) => ErrorSeverity::Error,
            AnimaWeaveError::Business(BusinessError::ResourceExhausted { .. }) => {
                ErrorSeverity::Critical
            }

            AnimaWeaveError::Communication(CommunicationError::MessageTimeout { .. }) => {
                ErrorSeverity::Warning
            }
            AnimaWeaveError::Communication(CommunicationError::MessageSendFailure { .. }) => {
                ErrorSeverity::Error
            }
            AnimaWeaveError::Communication(CommunicationError::ActorUnreachable { .. }) => {
                ErrorSeverity::Critical
            }
            AnimaWeaveError::Communication(CommunicationError::ActorStopped { .. }) => {
                ErrorSeverity::Critical
            }

            AnimaWeaveError::Configuration(_) => ErrorSeverity::Fatal,

            AnimaWeaveError::System(SystemError::OutOfMemory) => ErrorSeverity::Fatal,
            AnimaWeaveError::System(SystemError::ThreadPoolSaturated) => ErrorSeverity::Critical,
            AnimaWeaveError::System(SystemError::DataStoreFailure { .. }) => {
                ErrorSeverity::Critical
            }
            AnimaWeaveError::System(SystemError::ResourceFailure { .. }) => ErrorSeverity::Critical,
        }
    }

    /// 获取推荐的恢复策略
    pub fn recovery_strategy(&self) -> RecoveryStrategy {
        match self {
            AnimaWeaveError::Business(BusinessError::InputValidation { .. }) => {
                RecoveryStrategy::Skip
            }
            AnimaWeaveError::Business(BusinessError::TypeConversion { .. }) => {
                RecoveryStrategy::StopNode
            }
            AnimaWeaveError::Business(BusinessError::ExecutionLogic { .. }) => {
                RecoveryStrategy::Retry {
                    max_attempts: 3,
                    delay_ms: 1000,
                }
            }
            AnimaWeaveError::Business(BusinessError::ResourceExhausted { .. }) => {
                RecoveryStrategy::Retry {
                    max_attempts: 5,
                    delay_ms: 5000,
                }
            }

            AnimaWeaveError::Communication(CommunicationError::MessageTimeout { .. }) => {
                RecoveryStrategy::Retry {
                    max_attempts: 3,
                    delay_ms: 500,
                }
            }
            AnimaWeaveError::Communication(CommunicationError::MessageSendFailure { .. }) => {
                RecoveryStrategy::Retry {
                    max_attempts: 2,
                    delay_ms: 1000,
                }
            }
            AnimaWeaveError::Communication(CommunicationError::ActorUnreachable { .. }) => {
                RecoveryStrategy::Fallback {
                    alternative: "重启Actor".to_string(),
                }
            }
            AnimaWeaveError::Communication(CommunicationError::ActorStopped { .. }) => {
                RecoveryStrategy::StopNode
            }

            AnimaWeaveError::Configuration(_) => RecoveryStrategy::Shutdown,
            AnimaWeaveError::System(_) => RecoveryStrategy::Shutdown,
        }
    }

    /// 是否应该记录错误
    pub fn should_log(&self) -> bool {
        matches!(
            self.severity(),
            ErrorSeverity::Warning
                | ErrorSeverity::Error
                | ErrorSeverity::Critical
                | ErrorSeverity::Fatal
        )
    }

    /// 是否应该发送告警
    pub fn should_alert(&self) -> bool {
        matches!(
            self.severity(),
            ErrorSeverity::Critical | ErrorSeverity::Fatal
        )
    }
}

/// 错误上下文 - 提供错误发生时的环境信息
#[derive(Debug, Clone)]
pub struct ErrorContext {
    pub node_name: Option<NodeName>,
    pub execution_id: Option<ExecutionId>,
    pub operation: String,
    pub timestamp: std::time::SystemTime,
}

impl ErrorContext {
    pub fn new(operation: impl Into<String>) -> Self {
        Self {
            node_name: None,
            execution_id: None,
            operation: operation.into(),
            timestamp: std::time::SystemTime::now(),
        }
    }

    pub fn with_node(mut self, node_name: impl Into<NodeName>) -> Self {
        self.node_name = Some(node_name.into());
        self
    }

    pub fn with_execution(mut self, execution_id: impl Into<ExecutionId>) -> Self {
        self.execution_id = Some(execution_id.into());
        self
    }
}

/// 带上下文的错误 - 包含错误和发生环境
#[derive(Debug)]
pub struct ContextualError {
    pub error: AnimaWeaveError,
    pub context: ErrorContext,
}

impl ContextualError {
    pub fn new(error: AnimaWeaveError, context: ErrorContext) -> Self {
        Self { error, context }
    }
}

impl fmt::Display for ContextualError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.context.operation, self.error)?;
        if let Some(node) = &self.context.node_name {
            write!(f, " (节点: {})", node)?;
        }
        if let Some(exec_id) = &self.context.execution_id {
            write!(f, " (执行: {})", exec_id)?;
        }
        Ok(())
    }
}

/// 错误处理结果
pub type AnimaResult<T> = Result<T, ContextualError>;

/// 创建业务错误的便捷宏
#[macro_export]
macro_rules! business_error {
    (input_validation, $port:expr, $reason:expr) => {
        AnimaWeaveError::Business(BusinessError::InputValidation {
            port: $port.to_string(),
            reason: $reason.to_string(),
        })
    };
    (type_conversion, $from:expr, $to:expr, $reason:expr) => {
        AnimaWeaveError::Business(BusinessError::TypeConversion {
            from_type: $from.to_string(),
            to_type: $to.to_string(),
            reason: $reason.to_string(),
        })
    };
    (execution_logic, $node:expr, $reason:expr) => {
        AnimaWeaveError::Business(BusinessError::ExecutionLogic {
            node_name: $node.to_string(),
            reason: $reason.to_string(),
        })
    };
}

/// 创建通信错误的便捷宏
#[macro_export]
macro_rules! communication_error {
    (send_failure, $actor:expr, $reason:expr) => {
        AnimaWeaveError::Communication(CommunicationError::MessageSendFailure {
            target_actor: $actor.to_string(),
            reason: $reason.to_string(),
        })
    };
    (unreachable, $actor:expr) => {
        AnimaWeaveError::Communication(CommunicationError::ActorUnreachable {
            actor_name: $actor.to_string(),
        })
    };
}
