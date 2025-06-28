//! Actor抽象层类型定义
//!
//! 定义了AnimaWeave Actor系统中外部需要的核心类型。
//! 所有内部实现细节都被封装，不暴露给外部使用者。

use crate::{ExecutionId, NodeName};
use std::collections::HashMap;
use std::time::SystemTime;

/// 全局状态
///
/// 这是一个占位符类型，实际的全局状态管理由具体实现决定。
/// 外部代码不需要直接操作全局状态，而是通过Coordinator接口进行交互。
///
/// # 设计原则
///
/// 全局状态的具体结构是实现细节，不应该暴露给外部：
/// - 节点状态管理 → Coordinator内部处理
/// - 端口数据缓存 → DataStore内部处理  
/// - 执行统计收集 → 监控系统处理
///
/// 外部只需要通过`ExecutionStatus`获取必要的状态信息。
#[derive(Debug)]
pub struct GlobalState {
    // 这是一个内部类型，具体字段由实现决定
    // 外部代码不应该直接访问这些字段
    _internal: (),
}

impl GlobalState {
    /// 创建新的全局状态
    ///
    /// 这个方法主要供内部实现使用，外部代码一般不需要直接创建GlobalState
    pub fn new() -> Self {
        Self { _internal: () }
    }
}

impl Default for GlobalState {
    fn default() -> Self {
        Self::new()
    }
}

/// 执行计划
///
/// 这是Coordinator内部使用的调度数据结构。
/// 外部代码不需要知道调度的具体实现细节。
///
/// # 为什么不暴露具体字段？
///
/// 调度算法是实现细节，可能包括：
/// - 优先级队列
/// - 依赖关系图
/// - 资源分配策略
/// - 负载均衡算法
///
/// 这些都应该封装在Coordinator实现中，外部只需要调用
/// `handle_event()` 方法触发调度即可。
#[derive(Debug)]
pub struct ExecutionPlan {
    // 具体字段由实现决定
    // 可能包含节点名称、执行ID、输入数据、调度策略等
    _internal: (),
}

impl ExecutionPlan {
    /// 创建执行计划
    ///
    /// 这个方法供Coordinator实现使用
    pub fn new() -> Self {
        Self { _internal: () }
    }
}

/// 节点状态
///
/// 简化的节点状态枚举，只包含外部关心的基本状态
#[derive(Debug, Clone, PartialEq)]
pub enum NodeState {
    /// 空闲状态：节点等待输入或控制信号
    Idle,
    /// 运行状态：节点正在执行
    Running { execution_id: ExecutionId },
    /// 完成状态：节点执行完成
    Completed,
    /// 错误状态：节点执行失败
    Error { message: String },
}

impl NodeState {
    /// 是否正在运行
    pub fn is_running(&self) -> bool {
        matches!(self, NodeState::Running { .. })
    }

    /// 是否已完成
    pub fn is_completed(&self) -> bool {
        matches!(self, NodeState::Completed)
    }

    /// 是否出错
    pub fn is_error(&self) -> bool {
        matches!(self, NodeState::Error { .. })
    }

    /// 获取执行ID（如果正在运行）
    pub fn execution_id(&self) -> Option<&ExecutionId> {
        match self {
            NodeState::Running { execution_id } => Some(execution_id),
            _ => None,
        }
    }

    /// 获取错误信息（如果出错）
    pub fn error_message(&self) -> Option<&str> {
        match self {
            NodeState::Error { message } => Some(message),
            _ => None,
        }
    }
}

/// 执行统计信息
///
/// 提供基本的统计数据，用于监控和调试
#[derive(Debug, Clone, Default, PartialEq)]
pub struct ExecutionStats {
    /// 总执行次数
    pub total_executions: u64,
    /// 成功执行次数  
    pub successful_executions: u64,
    /// 失败执行次数
    pub failed_executions: u64,
    /// 最后活动时间
    pub last_activity: Option<SystemTime>,
}

impl ExecutionStats {
    /// 创建空的统计信息
    pub fn new() -> Self {
        Self::default()
    }

    /// 计算成功率
    pub fn success_rate(&self) -> f64 {
        if self.total_executions == 0 {
            0.0
        } else {
            self.successful_executions as f64 / self.total_executions as f64
        }
    }

    /// 计算失败率
    pub fn failure_rate(&self) -> f64 {
        1.0 - self.success_rate()
    }

    /// 是否有执行记录
    pub fn has_executions(&self) -> bool {
        self.total_executions > 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_state() {
        let idle = NodeState::Idle;
        assert!(!idle.is_running());
        assert!(!idle.is_completed());
        assert!(!idle.is_error());

        let running = NodeState::Running {
            execution_id: "exec_123".to_string(),
        };
        assert!(running.is_running());
        assert_eq!(running.execution_id(), Some(&"exec_123".to_string()));

        let completed = NodeState::Completed;
        assert!(completed.is_completed());

        let error = NodeState::Error {
            message: "test error".to_string(),
        };
        assert!(error.is_error());
        assert_eq!(error.error_message(), Some("test error"));
    }

    #[test]
    fn test_execution_stats() {
        let mut stats = ExecutionStats::new();
        assert_eq!(stats.success_rate(), 0.0);
        assert!(!stats.has_executions());

        stats.total_executions = 10;
        stats.successful_executions = 8;
        stats.failed_executions = 2;

        assert_eq!(stats.success_rate(), 0.8);
        assert_eq!(stats.failure_rate(), 0.2);
        assert!(stats.has_executions());
    }
}
