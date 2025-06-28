use super::types::{EventMeta, NodeStatus};
use crate::types::{ExecutionId, NodeName};

/// 节点执行状态事件 - 状态通知  
///
/// 职责：
/// - NodeActor发送给Coordinator的状态更新
/// - 纯状态通知，不携带数据
/// - 用于全局状态管理、并发控制、调试统计
#[derive(Debug, Clone)]
pub struct NodeExecutionEvent {
    /// 事件元数据
    pub meta: EventMeta,
    /// 节点名称
    pub node_name: NodeName,
    /// 执行ID
    pub node_execute_id: ExecutionId,
    /// 执行状态
    pub status: NodeStatus,
}

impl NodeExecutionEvent {
    /// 创建新的节点执行状态事件
    pub fn new(
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        status: NodeStatus,
    ) -> Self {
        Self {
            meta: EventMeta::new(),
            node_name: node_name.into(),
            node_execute_id: node_execute_id.into(),
            status,
        }
    }

    /// 创建带源信息的节点执行状态事件
    pub fn with_source(
        source: impl Into<String>,
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        status: NodeStatus,
    ) -> Self {
        Self {
            meta: EventMeta::with_source(source),
            node_name: node_name.into(),
            node_execute_id: node_execute_id.into(),
            status,
        }
    }

    /// 创建开始执行事件
    pub fn started(
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
    ) -> Self {
        Self::new(node_name, node_execute_id, NodeStatus::Running)
    }

    /// 创建完成事件
    pub fn completed(
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
    ) -> Self {
        Self::new(node_name, node_execute_id, NodeStatus::Completed)
    }

    /// 创建失败事件
    pub fn failed(
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        error: impl Into<String>,
    ) -> Self {
        Self::new(node_name, node_execute_id, NodeStatus::Failed(error.into()))
    }

    /// 创建等待事件
    pub fn pending(
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
    ) -> Self {
        Self::new(node_name, node_execute_id, NodeStatus::Pending)
    }

    /// 检查是否为成功完成状态
    pub fn is_completed(&self) -> bool {
        matches!(self.status, NodeStatus::Completed)
    }

    /// 检查是否为失败状态
    pub fn is_failed(&self) -> bool {
        matches!(self.status, NodeStatus::Failed(_))
    }

    /// 检查是否为运行状态
    pub fn is_running(&self) -> bool {
        matches!(self.status, NodeStatus::Running)
    }

    /// 获取错误信息（如果是失败状态）
    pub fn error_message(&self) -> Option<&str> {
        match &self.status {
            NodeStatus::Failed(msg) => Some(msg),
            _ => None,
        }
    }

    /// 获取事件ID
    pub fn event_id(&self) -> &str {
        &self.meta.event_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_event() {
        let event = NodeExecutionEvent::new("test_node", "exec_1", NodeStatus::Completed);
        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_1");
        assert!(matches!(event.status, NodeStatus::Completed));
        assert!(!event.meta.event_id.is_empty());
    }
}
