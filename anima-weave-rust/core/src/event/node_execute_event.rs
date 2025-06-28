use super::types::{EventMeta, PortRef};
use crate::types::{ExecutionId, NodeInputs, NodeName};

/// 节点执行事件 - 执行指令
///
/// 职责：
/// - Coordinator发送给NodeActor的执行指令
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
        // 创建PortRef来查找数据
        let port_ref = PortRef::new(&self.node_name, port_name);
        self.inputs.get(&port_ref)
    }

    /// 检查是否有指定端口的输入
    pub fn has_input(&self, port_name: &str) -> bool {
        let port_ref = PortRef::new(&self.node_name, port_name);
        self.inputs.contains_key(&port_ref)
    }

    /// 获取所有输入端口名称
    pub fn input_port_names(&self) -> Vec<&str> {
        self.inputs
            .keys()
            .map(|port_ref| port_ref.port_name.as_str())
            .collect()
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
    fn test_create_event() {
        let event = NodeExecuteEvent::new("test_node", "exec_1", NodeInputs::new());
        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_1");
        assert!(event.inputs.is_empty());
        assert!(!event.meta.event_id.is_empty());
    }

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
            PortRef::new("test_node", "input1"),
            Box::new(SignalLabel::active()) as Box<dyn crate::SemanticLabel>,
        );
        inputs.insert(
            PortRef::new("test_node", "input2"),
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
            PortRef::new("test_node", "signal_port"),
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
}
