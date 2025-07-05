//! Actor抽象层类型定义
//!
//! 定义了AnimaWeave Actor系统中外部需要的核心类型。
//! 所有内部实现细节都被封装，不暴露给外部使用者。

use crate::types::{ExecutionId, NodeName, PortRef};
use crate::label::SemanticLabel;
use crate::signal::SignalLabel;

use kameo::Reply;
use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use std::sync::Arc;

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

/// 节点Actor间的数据消息
#[derive(Debug)]
pub struct DataMessage {
    pub from_node: NodeName,
    pub from_port: PortRef,
    pub to_node: NodeName,
    pub to_port: PortRef,
    pub data: Arc<dyn SemanticLabel>,
    pub execution_id: ExecutionId,
}

/// 节点Actor间的控制消息
#[derive(Debug)]
pub struct ControlMessage {
    pub from_node: NodeName,
    pub from_port: PortRef,
    pub to_node: NodeName,
    pub to_port: PortRef,
    pub signal: SignalLabel,
    pub execution_id: ExecutionId,
}

/// 节点状态事件 (发送给StatusCollector)
#[derive(Debug, Clone)]
pub enum NodeStatusEvent {
    /// 节点执行排队
    ExecutionQueued {
        node_name: NodeName,
        execution_id: ExecutionId,
        is_sequential: bool,
    },
    /// 节点开始执行
    ExecutionStarted {
        node_name: NodeName,
        execution_id: ExecutionId,
        input_count: usize,
    },
    /// 节点执行完成
    ExecutionCompleted {
        node_name: NodeName,
        execution_id: ExecutionId,
        output_count: usize,
        duration: Duration,
    },
    /// 节点执行失败
    ExecutionFailed {
        node_name: NodeName,
        execution_id: ExecutionId,
        error: String,
        duration: Duration,
    },
    /// 节点健康状态更新
    HealthUpdate {
        node_name: NodeName,
        status: ActorHealthStatus,
    },
    /// 消息处理统计
    MessageProcessed {
        node_name: NodeName,
        message_type: MessageType,
        processing_time: Duration,
    },
}

/// 消息类型枚举
#[derive(Debug, Clone, PartialEq)]
pub enum MessageType {
    Data,
    Control,
    Status,
}

/// Actor健康状态
#[derive(Debug, Clone, PartialEq)]
pub enum ActorHealthStatus {
    Healthy,
    Slow { average_response_time: Duration },
    Unresponsive { last_seen: SystemTime },
    Failed { error: String },
}

/// 节点激活模式
#[derive(Debug, Clone, PartialEq)]
pub enum ActivationMode {
    XOR,  // 任意一个输入激活
    OR,   // 至少一个输入激活
    AND,  // 所有输入都激活
}

/// 详细执行状态
#[derive(Debug, Clone, PartialEq)]
pub enum DetailedExecutionStatus {
    Queued,
    Dispatched,
    Running,
    Completed { success: bool },
    Failed { error: String },
}

/// 详细执行记录
#[derive(Debug, Clone)]
pub struct DetailedExecutionRecord {
    pub execution_id: ExecutionId,
    pub node_name: NodeName,
    pub status: DetailedExecutionStatus,
    pub is_sequential: bool,
    
    // 完整时间线
    pub ready_at: SystemTime,
    pub dispatched_at: Option<SystemTime>,
    pub started_at: Option<SystemTime>,
    pub completed_at: Option<SystemTime>,
    
    // 执行详情
    pub input_data_count: usize,
    pub output_data_count: usize,
    pub error_message: Option<String>,
    
    // 性能信息
    pub queue_wait_duration: Option<Duration>,
    pub execution_duration: Option<Duration>,
}

/// 节点统计信息
#[derive(Debug, Clone)]
pub struct NodeStats {
    pub total_executions: u64,
    pub successful_executions: u64,
    pub failed_executions: u64,
    pub average_execution_time: Duration,
    pub min_execution_time: Duration,
    pub max_execution_time: Duration,
    pub last_execution_time: Option<SystemTime>,
    pub total_processing_time: Duration,
}

impl Default for NodeStats {
    fn default() -> Self {
        Self {
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            average_execution_time: Duration::from_secs(0),
            min_execution_time: Duration::from_secs(u64::MAX),
            max_execution_time: Duration::from_secs(0),
            last_execution_time: None,
            total_processing_time: Duration::from_secs(0),
        }
    }
}

/// 系统性能指标
#[derive(Debug, Clone)]
pub struct SystemMetrics {
    pub peak_concurrent_executions: usize,
    pub current_concurrent_executions: usize,
    pub total_message_count: u64,
    pub average_message_latency: Duration,
    pub system_throughput: f64,
    pub uptime: Duration,
    pub start_time: SystemTime,
}

impl Default for SystemMetrics {
    fn default() -> Self {
        Self {
            peak_concurrent_executions: 0,
            current_concurrent_executions: 0,
            total_message_count: 0,
            average_message_latency: Duration::from_secs(0),
            system_throughput: 0.0,
            uptime: Duration::from_secs(0),
            start_time: SystemTime::now(),
        }
    }
}

/// 消息传递统计
#[derive(Debug, Clone, Default)]
pub struct MessageStats {
    pub total_data_messages: u64,
    pub total_control_messages: u64,
    pub total_status_messages: u64,
    pub message_queue_sizes: HashMap<NodeName, usize>,
    pub average_message_processing_time: Duration,
}

/// 性能报告
#[derive(Debug, Clone, Reply)]
pub struct PerformanceReport {
    pub overall_stats: ExecutionStatus,
    pub node_performance: HashMap<NodeName, NodeStats>,
    pub system_metrics: SystemMetrics,
    pub top_performers: Vec<(NodeName, NodeStats)>,
    pub bottlenecks: Vec<(NodeName, String)>,
}

/// 执行状态 (兼容现有API)
#[derive(Debug, Clone, Reply)]
pub struct ExecutionStatus {
    pub is_running: bool,
    pub active_nodes_count: usize,
    pub total_executions: u64,
    pub successful_executions: u64,
    pub failed_executions: u64,
    pub last_activity: Option<SystemTime>,
    pub current_error: Option<String>,
}

impl ExecutionStatus {
    pub fn empty() -> Self {
        Self {
            is_running: false,
            active_nodes_count: 0,
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            last_activity: None,
            current_error: None,
        }
    }

    pub fn success_rate(&self) -> f64 {
        if self.total_executions == 0 {
            0.0
        } else {
            self.successful_executions as f64 / self.total_executions as f64
        }
    }

    pub fn is_healthy(&self) -> bool {
        self.current_error.is_none() && (self.total_executions == 0 || self.success_rate() >= 0.8)
    }
}

/// 节点信息 (用于查询)
#[derive(Debug, Clone, Reply)]
pub struct NodeInfo {
    pub name: NodeName,
    pub state: NodeState,
    pub stats: NodeStats,
    pub last_activity: Option<SystemTime>,
}

// Message trait implementations will be added when the corresponding actors are created

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_state_transitions() {
        assert_eq!(NodeState::default(), NodeState::Idle);
        
        let state = NodeState::Ready;
        assert_eq!(state, NodeState::Ready);
    }

    #[test]
    fn test_execution_status_empty() {
        let status = ExecutionStatus::empty();
        assert!(!status.is_running);
        assert_eq!(status.active_nodes_count, 0);
        assert_eq!(status.total_executions, 0);
    }

    #[test]
    fn test_execution_status_success_rate() {
        let status = ExecutionStatus {
            is_running: false,
            active_nodes_count: 0,
            total_executions: 10,
            successful_executions: 8,
            failed_executions: 2,
            last_activity: None,
            current_error: None,
        };
        
        assert_eq!(status.success_rate(), 0.8);
        assert!(status.is_healthy());
    }

    #[test]
    fn test_node_stats_default() {
        let stats = NodeStats::default();
        assert_eq!(stats.total_executions, 0);
        assert_eq!(stats.successful_executions, 0);
        assert_eq!(stats.failed_executions, 0);
    }
}
