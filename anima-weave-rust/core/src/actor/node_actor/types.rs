use crate::types::{ExecutionId, NodeName};
use kameo::Reply;
use std::time::SystemTime;

/// 节点状态
///
/// 简化的节点状态枚举，只包含外部关心的基本状态
#[derive(Debug, Clone, PartialEq, Reply)]
pub enum NodeState {
    /// 尚未启动
    Idle,
    /// 正在初始化
    Initializing,
    /// 已启动，等待输入
    Ready,
    /// 正在执行
    Running,
    /// 已完成
    Completed,
    /// 已停止
    Stopped,
}

impl Default for NodeState {
    fn default() -> Self {
        NodeState::Idle
    }
}

/// 节点执行事件
#[derive(Debug, Clone)]
pub struct NodeExecutionEvent {
    pub node_name: NodeName,
    pub execution_id: ExecutionId,
    pub status: NodeState,
    pub timestamp: SystemTime,
    pub error: Option<String>,
}

impl NodeExecutionEvent {
    pub fn new(node_name: NodeName, execution_id: ExecutionId, status: NodeState) -> Self {
        Self {
            node_name,
            execution_id,
            status,
            timestamp: SystemTime::now(),
            error: None,
        }
    }

    pub fn with_error(mut self, error: String) -> Self {
        self.error = Some(error);
        self
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