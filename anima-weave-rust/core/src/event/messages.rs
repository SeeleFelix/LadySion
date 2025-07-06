//! Event消息类型定义
//!
//! 包含AnimaWeave系统中所有Actor间传递的消息类型

use crate::label::SemanticLabel;
use crate::signal::SignalLabel;
use crate::types::{ExecutionId, NodeName, PortRef};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime};

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