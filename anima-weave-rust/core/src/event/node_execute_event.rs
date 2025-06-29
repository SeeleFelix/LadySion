use super::types::{EventMeta, PortRef};
use crate::types::{ExecutionId, NodeControlInputs, NodeDataInputs, NodeName};

/// 节点执行事件 - 执行指令
///
/// 职责：
/// - Coordinator发送给NodeActor的执行指令
/// - 包含执行上下文和所有输入数据（数据输入和控制输入）
/// - NodeActor收到后可以直接执行，无需额外查询
#[derive(Debug)]
pub struct NodeExecuteEvent {
    /// 事件元数据
    pub meta: EventMeta,
    /// 节点名称（图中唯一标识）
    pub node_name: NodeName,
    /// 执行ID（每次执行的唯一标识）
    pub node_execute_id: ExecutionId,
    /// 数据输入集合（端口名 -> 数据）
    pub data_inputs: NodeDataInputs,
    /// 控制输入集合（端口名 -> 信号）
    pub control_inputs: NodeControlInputs,
}

impl NodeExecuteEvent {
    /// 创建新的节点执行事件
    pub fn new(
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        data_inputs: NodeDataInputs,
        control_inputs: NodeControlInputs,
    ) -> Self {
        Self {
            meta: EventMeta::new(),
            node_name: node_name.into(),
            node_execute_id: node_execute_id.into(),
            data_inputs,
            control_inputs,
        }
    }

    /// 创建带源信息的节点执行事件
    pub fn with_source(
        source: impl Into<String>,
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        data_inputs: NodeDataInputs,
        control_inputs: NodeControlInputs,
    ) -> Self {
        Self {
            meta: EventMeta::with_source(source),
            node_name: node_name.into(),
            node_execute_id: node_execute_id.into(),
            data_inputs,
            control_inputs,
        }
    }

    /// 创建空输入的执行事件（用于测试或无输入节点）
    pub fn empty(node_name: impl Into<NodeName>, node_execute_id: impl Into<ExecutionId>) -> Self {
        Self::new(
            node_name,
            node_execute_id,
            NodeDataInputs::new(),
            NodeControlInputs::new(),
        )
    }

    /// 获取指定端口的数据输入
    pub fn get_data_input(&self, port_name: &str) -> Option<&Box<dyn crate::SemanticLabel>> {
        let port_ref = PortRef::new(&self.node_name, port_name);
        self.data_inputs.get(&port_ref)
    }

    /// 获取指定端口的控制输入
    pub fn get_control_input(&self, port_name: &str) -> Option<&crate::SignalLabel> {
        let port_ref = PortRef::new(&self.node_name, port_name);
        self.control_inputs.get(&port_ref)
    }

    /// 检查是否有指定端口的数据输入
    pub fn has_data_input(&self, port_name: &str) -> bool {
        let port_ref = PortRef::new(&self.node_name, port_name);
        self.data_inputs.contains_key(&port_ref)
    }

    /// 检查是否有指定端口的控制输入
    pub fn has_control_input(&self, port_name: &str) -> bool {
        let port_ref = PortRef::new(&self.node_name, port_name);
        self.control_inputs.contains_key(&port_ref)
    }

    /// 获取所有数据输入端口名称
    pub fn data_input_port_names(&self) -> Vec<&str> {
        self.data_inputs
            .keys()
            .map(|port_ref| port_ref.port_name.as_str())
            .collect()
    }

    /// 获取所有控制输入端口名称
    pub fn control_input_port_names(&self) -> Vec<&str> {
        self.control_inputs
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
        let event = NodeExecuteEvent::new(
            "test_node",
            "exec_1",
            NodeDataInputs::new(),
            NodeControlInputs::new(),
        );
        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_1");
        assert!(event.data_inputs.is_empty());
        assert!(event.control_inputs.is_empty());
        assert!(!event.meta.event_id.is_empty());
    }

    #[test]
    fn test_node_execute_event_empty() {
        let event = NodeExecuteEvent::empty("test_node", "exec_123");
        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_123");
        assert!(event.data_inputs.is_empty());
        assert!(event.control_inputs.is_empty());
        assert!(!event.has_data_input("any_port"));
        assert!(!event.has_control_input("any_port"));
        assert!(!event.event_id().is_empty());
        assert!(event.meta.source.is_none());
    }

    #[test]
    fn test_node_execute_event_with_inputs() {
        let mut data_inputs = HashMap::new();
        data_inputs.insert(
            PortRef::new("test_node", "data_input1"),
            Box::new(SignalLabel::active()) as Box<dyn crate::SemanticLabel>,
        );

        let mut control_inputs = HashMap::new();
        control_inputs.insert(
            PortRef::new("test_node", "control_input1"),
            crate::SignalLabel::inactive(),
        );

        let event = NodeExecuteEvent::new("test_node", "exec_123", data_inputs, control_inputs);

        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_123");
        assert_eq!(event.data_inputs.len(), 1);
        assert_eq!(event.control_inputs.len(), 1);

        assert!(event.has_data_input("data_input1"));
        assert!(event.has_control_input("control_input1"));
        assert!(!event.has_data_input("missing"));
        assert!(!event.has_control_input("missing"));

        let data_ports = event.data_input_port_names();
        assert_eq!(data_ports.len(), 1);
        assert!(data_ports.contains(&"data_input1"));

        let control_ports = event.control_input_port_names();
        assert_eq!(control_ports.len(), 1);
        assert!(control_ports.contains(&"control_input1"));

        assert!(!event.event_id().is_empty());
    }

    #[test]
    fn test_node_execute_event_get_inputs() {
        let mut data_inputs = HashMap::new();
        data_inputs.insert(
            PortRef::new("test_node", "data_port"),
            Box::new(SignalLabel::active()) as Box<dyn crate::SemanticLabel>,
        );

        let mut control_inputs = HashMap::new();
        control_inputs.insert(
            PortRef::new("test_node", "control_port"),
            crate::SignalLabel::inactive(),
        );

        let event = NodeExecuteEvent::new("test_node", "exec_123", data_inputs, control_inputs);

        let data_input = event.get_data_input("data_port");
        assert!(data_input.is_some());
        assert_eq!(data_input.unwrap().get_semantic_label_type(), "SignalLabel");

        let control_input = event.get_control_input("control_port");
        assert!(control_input.is_some());
        assert!(!control_input.unwrap().is_active());

        let missing_data = event.get_data_input("missing_port");
        assert!(missing_data.is_none());

        let missing_control = event.get_control_input("missing_port");
        assert!(missing_control.is_none());

        assert!(!event.event_id().is_empty());
    }

    #[test]
    fn test_node_execute_event_with_source() {
        let event = NodeExecuteEvent::with_source(
            "coordinator",
            "test_node",
            "exec_123",
            HashMap::new(),
            HashMap::new(),
        );

        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_123");
        assert!(!event.event_id().is_empty());
        assert_eq!(event.meta.source, Some("coordinator".to_string()));
    }
}
