use super::types::{EventMeta, NodeStatus};
use crate::types::{ExecutionId, NodeInputs, NodeName};

/// 节点执行事件 - 执行指令
///
/// 职责：
/// - CoordinatorActor发送给NodeActor的执行指令
/// - 包含执行上下文和所有输入数据
/// - NodeActor收到后可以直接执行，无需额外查询
#[derive(Debug)]
pub struct NodeExecuteEvent {
    /// 事件元数据
    pub meta: EventMeta,
    /// 节点名称（图中唯一标识）
    pub node_name: NodeName,
    /// 执行ID（每次执行的唯一标识）
    pub node_execute_id: ExecutionId,
    /// 输入数据集合（端口名 -> 数据）
    pub inputs: NodeInputs,
}

impl NodeExecuteEvent {
    /// 创建新的节点执行事件
    pub fn new(
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        inputs: NodeInputs,
    ) -> Self {
        Self {
            meta: EventMeta::new(),
            node_name: node_name.into(),
            node_execute_id: node_execute_id.into(),
            inputs,
        }
    }

    /// 创建带源信息的节点执行事件
    pub fn with_source(
        source: impl Into<String>,
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        inputs: NodeInputs,
    ) -> Self {
        Self {
            meta: EventMeta::with_source(source),
            node_name: node_name.into(),
            node_execute_id: node_execute_id.into(),
            inputs,
        }
    }

    /// 创建空输入的执行事件（用于测试或无输入节点）
    pub fn empty(node_name: impl Into<NodeName>, node_execute_id: impl Into<ExecutionId>) -> Self {
        Self::new(node_name, node_execute_id, NodeInputs::new())
    }

    /// 获取指定端口的输入数据
    pub fn get_input(&self, port_name: &str) -> Option<&Box<dyn crate::SemanticLabel>> {
        self.inputs.get(port_name)
    }

    /// 检查是否有指定端口的输入
    pub fn has_input(&self, port_name: &str) -> bool {
        self.inputs.contains_key(port_name)
    }

    /// 获取所有输入端口名称
    pub fn input_port_names(&self) -> Vec<&str> {
        self.inputs.keys().map(|s| s.as_str()).collect()
    }

    /// 获取事件ID
    pub fn event_id(&self) -> &str {
        &self.meta.event_id
    }
}

/// 节点执行状态事件 - 状态通知
///
/// 职责：
/// - NodeActor发送给CoordinatorActor的状态更新
/// - 用于跟踪执行进度
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
    use crate::SignalLabel;
    use std::collections::HashMap;

    #[test]
    fn test_node_execute_event_empty() {
        let event = NodeExecuteEvent::empty("test_node", "exec_123");
        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_123");
        assert!(event.inputs.is_empty());
        assert!(!event.has_input("any_port"));
        assert!(!event.event_id().is_empty());
        assert!(event.meta.source.is_none());
    }

    #[test]
    fn test_node_execute_event_with_inputs() {
        let mut inputs = HashMap::new();
        inputs.insert(
            "input1".to_string(),
            Box::new(SignalLabel::active()) as Box<dyn crate::SemanticLabel>,
        );
        inputs.insert(
            "input2".to_string(),
            Box::new(SignalLabel::inactive()) as Box<dyn crate::SemanticLabel>,
        );

        let event = NodeExecuteEvent::new("test_node", "exec_123", inputs);

        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_123");
        assert_eq!(event.inputs.len(), 2);

        assert!(event.has_input("input1"));
        assert!(event.has_input("input2"));
        assert!(!event.has_input("input3"));

        let input_ports = event.input_port_names();
        assert_eq!(input_ports.len(), 2);
        assert!(input_ports.contains(&"input1"));
        assert!(input_ports.contains(&"input2"));
        assert!(!event.event_id().is_empty());
    }

    #[test]
    fn test_node_execute_event_get_input() {
        let mut inputs = HashMap::new();
        inputs.insert(
            "signal_port".to_string(),
            Box::new(SignalLabel::active()) as Box<dyn crate::SemanticLabel>,
        );

        let event = NodeExecuteEvent::new("test_node", "exec_123", inputs);

        let input_data = event.get_input("signal_port");
        assert!(input_data.is_some());
        assert_eq!(input_data.unwrap().get_semantic_label_type(), "SignalLabel");

        let missing_input = event.get_input("missing_port");
        assert!(missing_input.is_none());
        assert!(!event.event_id().is_empty());
    }

    #[test]
    fn test_node_execute_event_with_source() {
        let event =
            NodeExecuteEvent::with_source("coordinator", "test_node", "exec_123", HashMap::new());

        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_123");
        assert!(!event.event_id().is_empty());
        assert_eq!(event.meta.source, Some("coordinator".to_string()));
    }

    #[test]
    fn test_node_execution_event_started() {
        let event = NodeExecutionEvent::started("test_node", "exec_123");
        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_123");
        assert_eq!(event.status, NodeStatus::Running);
        assert!(event.is_running());
        assert!(!event.is_completed());
        assert!(!event.is_failed());
        assert!(!event.event_id().is_empty());
        assert!(event.meta.source.is_none());
    }

    #[test]
    fn test_node_execution_event_completed() {
        let event = NodeExecutionEvent::completed("test_node", "exec_123");
        assert_eq!(event.status, NodeStatus::Completed);
        assert!(event.is_completed());
        assert!(!event.is_running());
        assert!(!event.is_failed());
        assert!(!event.event_id().is_empty());
    }

    #[test]
    fn test_node_execution_event_failed() {
        let event = NodeExecutionEvent::failed("test_node", "exec_123", "test error");

        match &event.status {
            NodeStatus::Failed(msg) => assert_eq!(msg, "test error"),
            _ => panic!("应该是Failed状态"),
        }

        assert!(!event.is_completed());
        assert!(!event.is_running());
        assert!(event.is_failed());
        assert_eq!(event.error_message(), Some("test error"));
        assert!(!event.event_id().is_empty());
    }

    #[test]
    fn test_node_execution_event_pending() {
        let event = NodeExecutionEvent::pending("test_node", "exec_123");
        assert_eq!(event.status, NodeStatus::Pending);
        assert!(!event.is_completed());
        assert!(!event.is_running());
        assert!(!event.is_failed());
        assert_eq!(event.error_message(), None);
        assert!(!event.event_id().is_empty());
    }

    #[test]
    fn test_node_execution_event_with_source() {
        let event = NodeExecutionEvent::with_source(
            "node_actor",
            "test_node",
            "exec_123",
            NodeStatus::Completed,
        );

        assert_eq!(event.status, NodeStatus::Completed);
        assert!(!event.event_id().is_empty());
        assert_eq!(event.meta.source, Some("node_actor".to_string()));
    }

    #[test]
    fn test_event_unique_ids() {
        let event1 = NodeExecuteEvent::empty("test_node", "exec_123");
        let event2 = NodeExecuteEvent::empty("test_node", "exec_456");
        let event3 = NodeExecutionEvent::started("test_node", "exec_123");

        // 所有事件都应该有不同的ID
        assert_ne!(event1.event_id(), event2.event_id());
        assert_ne!(event1.event_id(), event3.event_id());
        assert_ne!(event2.event_id(), event3.event_id());
    }
}
