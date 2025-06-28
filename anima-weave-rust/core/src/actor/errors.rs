//! Actor抽象层错误定义
//!
//! 定义了AnimaWeave Actor系统中外部需要处理的错误类型。
//! 遵循"少即是多"的原则，只暴露用户真正需要处理的错误。

use crate::{ExecutionId, NodeName, PortName};
use std::fmt;

/// Coordinator执行错误
///
/// 这些是用户在使用Coordinator时可能遇到的错误。
/// 所有内部实现细节的错误（如调度算法、并发控制等）都被封装，
/// 外部只需要处理这几种基本错误情况。
#[derive(Debug, Clone)]
pub enum CoordinatorError {
    /// 启动失败
    ///
    /// Coordinator启动时出现问题，通常是配置或依赖服务的问题
    StartupFailed(String),

    /// 已经启动
    ///
    /// Coordinator已经在运行状态，无法重复启动
    AlreadyStarted,

    /// 未运行
    ///
    /// Coordinator尚未启动或已停止，无法处理请求
    NotRunning,

    /// 事件处理失败
    ///
    /// 处理DataEvent、ControlEvent或NodeExecutionEvent时出现错误
    EventProcessingFailed { event_type: String, reason: String },

    /// 调度失败
    ///
    /// 无法调度节点执行，可能是节点不存在或状态异常
    SchedulingFailed { node_name: NodeName, reason: String },

    /// 停止失败
    ///
    /// Coordinator停止时出现问题，可能是资源清理失败
    ShutdownFailed(String),
}

/// 数据存储错误
///
/// 这些是DataStore操作时可能出现的错误。
/// 封装了所有数据存储相关的复杂性，外部只需要处理这几种情况。
#[derive(Debug, Clone)]
pub enum DataStoreError {
    /// 存储操作失败
    ///
    /// 数据存储到DataStore时出现问题
    StorageFailed(String),

    /// 数据未找到
    ///
    /// 查询的端口数据不存在
    DataNotFound { port: String },

    /// 类型转换失败
    ///
    /// SemanticLabel类型转换失败
    ConversionFailed {
        from_type: String,
        to_type: String,
        reason: String,
    },

    /// DataStore服务异常
    ///
    /// DataStore内部服务出现问题
    ServiceError(String),
}

/// 节点执行错误
///
/// 这些是NodeExecutor执行时可能出现的错误。
/// 专注于业务逻辑相关的错误，不包含系统级错误。
#[derive(Debug, Clone)]
pub enum NodeExecutionError {
    /// 输入数据问题
    ///
    /// 输入数据缺失、类型不匹配或内容无效
    InputError { port_name: PortName, reason: String },

    /// 业务逻辑执行失败
    ///
    /// 节点的核心业务逻辑执行出现问题
    ExecutionFailed(String),

    /// 输出生成失败
    ///
    /// 无法生成预期的输出数据
    OutputError { port_name: PortName, reason: String },

    /// 节点配置错误
    ///
    /// 节点配置不正确或不完整
    ConfigurationError(String),
}

// =========================
// Display trait 实现
// =========================

impl fmt::Display for CoordinatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CoordinatorError::StartupFailed(reason) => {
                write!(f, "Coordinator startup failed: {}", reason)
            }
            CoordinatorError::AlreadyStarted => {
                write!(f, "Coordinator is already started")
            }
            CoordinatorError::NotRunning => {
                write!(f, "Coordinator is not running")
            }
            CoordinatorError::EventProcessingFailed { event_type, reason } => {
                write!(f, "Failed to process {} event: {}", event_type, reason)
            }
            CoordinatorError::SchedulingFailed { node_name, reason } => {
                write!(f, "Failed to schedule node '{}': {}", node_name, reason)
            }
            CoordinatorError::ShutdownFailed(reason) => {
                write!(f, "Coordinator shutdown failed: {}", reason)
            }
        }
    }
}

impl fmt::Display for DataStoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DataStoreError::StorageFailed(reason) => {
                write!(f, "Data storage failed: {}", reason)
            }
            DataStoreError::DataNotFound { port } => {
                write!(f, "Data not found for port: {}", port)
            }
            DataStoreError::ConversionFailed {
                from_type,
                to_type,
                reason,
            } => {
                write!(
                    f,
                    "Type conversion failed from '{}' to '{}': {}",
                    from_type, to_type, reason
                )
            }
            DataStoreError::ServiceError(reason) => {
                write!(f, "DataStore service error: {}", reason)
            }
        }
    }
}

impl fmt::Display for NodeExecutionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NodeExecutionError::InputError { port_name, reason } => {
                write!(f, "Input error for port '{}': {}", port_name, reason)
            }
            NodeExecutionError::ExecutionFailed(reason) => {
                write!(f, "Node execution failed: {}", reason)
            }
            NodeExecutionError::OutputError { port_name, reason } => {
                write!(f, "Output error for port '{}': {}", port_name, reason)
            }
            NodeExecutionError::ConfigurationError(reason) => {
                write!(f, "Node configuration error: {}", reason)
            }
        }
    }
}

// =========================
// Error trait 实现
// =========================

impl std::error::Error for CoordinatorError {}
impl std::error::Error for DataStoreError {}
impl std::error::Error for NodeExecutionError {}

// =========================
// 便利构造函数
// =========================

impl CoordinatorError {
    /// 创建启动失败错误
    pub fn startup_failed(reason: impl Into<String>) -> Self {
        Self::StartupFailed(reason.into())
    }

    /// 创建已启动错误
    pub fn already_started() -> Self {
        Self::AlreadyStarted
    }

    /// 创建未运行错误
    pub fn not_running() -> Self {
        Self::NotRunning
    }

    /// 创建事件处理失败错误
    pub fn event_processing_failed(
        event_type: impl Into<String>,
        reason: impl Into<String>,
    ) -> Self {
        Self::EventProcessingFailed {
            event_type: event_type.into(),
            reason: reason.into(),
        }
    }

    /// 创建调度失败错误
    pub fn scheduling_failed(node_name: impl Into<NodeName>, reason: impl Into<String>) -> Self {
        Self::SchedulingFailed {
            node_name: node_name.into(),
            reason: reason.into(),
        }
    }

    /// 创建停止失败错误
    pub fn shutdown_failed(reason: impl Into<String>) -> Self {
        Self::ShutdownFailed(reason.into())
    }
}

impl DataStoreError {
    /// 创建存储失败错误
    pub fn storage_failed(reason: impl Into<String>) -> Self {
        Self::StorageFailed(reason.into())
    }

    /// 创建数据未找到错误
    pub fn data_not_found(port: impl Into<String>) -> Self {
        Self::DataNotFound { port: port.into() }
    }

    /// 创建类型转换失败错误
    pub fn conversion_failed(
        from_type: impl Into<String>,
        to_type: impl Into<String>,
        reason: impl Into<String>,
    ) -> Self {
        Self::ConversionFailed {
            from_type: from_type.into(),
            to_type: to_type.into(),
            reason: reason.into(),
        }
    }

    /// 创建服务错误
    pub fn service_error(reason: impl Into<String>) -> Self {
        Self::ServiceError(reason.into())
    }
}

impl NodeExecutionError {
    /// 创建输入错误
    pub fn input_error(port_name: impl Into<PortName>, reason: impl Into<String>) -> Self {
        Self::InputError {
            port_name: port_name.into(),
            reason: reason.into(),
        }
    }

    /// 创建执行失败错误
    pub fn execution_failed(reason: impl Into<String>) -> Self {
        Self::ExecutionFailed(reason.into())
    }

    /// 创建输出错误
    pub fn output_error(port_name: impl Into<PortName>, reason: impl Into<String>) -> Self {
        Self::OutputError {
            port_name: port_name.into(),
            reason: reason.into(),
        }
    }

    /// 创建配置错误
    pub fn configuration_error(reason: impl Into<String>) -> Self {
        Self::ConfigurationError(reason.into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coordinator_error_creation() {
        let error = CoordinatorError::startup_failed("dependency missing");
        assert!(matches!(error, CoordinatorError::StartupFailed(_)));
        assert_eq!(
            error.to_string(),
            "Coordinator startup failed: dependency missing"
        );

        let error = CoordinatorError::scheduling_failed("test_node", "input missing");
        assert!(matches!(error, CoordinatorError::SchedulingFailed { .. }));
    }

    #[test]
    fn test_datastore_error_creation() {
        let error = DataStoreError::data_not_found("test_port");
        assert!(matches!(error, DataStoreError::DataNotFound { .. }));
        assert_eq!(error.to_string(), "Data not found for port: test_port");

        let error =
            DataStoreError::conversion_failed("StringLabel", "NumberLabel", "invalid format");
        assert!(matches!(error, DataStoreError::ConversionFailed { .. }));
    }

    #[test]
    fn test_node_execution_error_creation() {
        let error = NodeExecutionError::input_error("input_port", "missing data");
        assert!(matches!(error, NodeExecutionError::InputError { .. }));
        assert_eq!(
            error.to_string(),
            "Input error for port 'input_port': missing data"
        );

        let error = NodeExecutionError::execution_failed("division by zero");
        assert!(matches!(error, NodeExecutionError::ExecutionFailed(_)));
    }
}
