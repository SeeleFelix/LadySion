use super::types::{EventMeta, PortRef};
use crate::types::{ExecutionId, NodeName};
use crate::{NodeDataOutputs, NodeControlOutputs};
use crate::SemanticLabel;

/// 节点输出事件 - 数据传递
///
/// 职责：
/// - NodeActor发送给DataBus的数据输出
/// - 包含节点执行后的所有端口输出
/// - DataBus根据此事件更新数据存储并检查依赖
#[derive(Debug)]
pub struct NodeOutputEvent {
    /// 事件元数据
    pub meta: EventMeta,
    /// 节点名称
    pub node_name: NodeName,
    /// 执行ID
    pub node_execute_id: ExecutionId,
    /// 数据端口的输出 (端口 -> 输出值)
    pub data_outputs: NodeDataOutputs,
    /// 控制端口的输出 (端口 -> 信号值)
    pub control_outputs: NodeControlOutputs,
}

impl NodeOutputEvent {
    /// 创建新的节点输出事件
    pub fn new(
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        data_outputs: NodeDataOutputs,
        control_outputs: NodeControlOutputs,
    ) -> Self {
        Self {
            meta: EventMeta::new(),
            node_name: node_name.into(),
            node_execute_id: node_execute_id.into(),
            data_outputs,
            control_outputs,
        }
    }

    /// 创建带源信息的节点输出事件
    pub fn with_source(
        source: impl Into<String>,
        node_name: impl Into<NodeName>,
        node_execute_id: impl Into<ExecutionId>,
        data_outputs: NodeDataOutputs,
        control_outputs: NodeControlOutputs,
    ) -> Self {
        Self {
            meta: EventMeta::with_source(source),
            node_name: node_name.into(),
            node_execute_id: node_execute_id.into(),
            data_outputs,
            control_outputs,
        }
    }

    /// 创建空输出事件（用于测试或无输出节点）
    pub fn empty(node_name: impl Into<NodeName>, node_execute_id: impl Into<ExecutionId>) -> Self {
        Self::new(node_name, node_execute_id, NodeDataOutputs::new(), NodeControlOutputs::new())
    }

    /// 获取指定端口的输出数据
    pub fn get_output(&self, port_name: &str) -> Option<&Box<dyn SemanticLabel>> {
        let port_ref = PortRef::new(&self.node_name, port_name);
        self.data_outputs.get(&port_ref)
    }

    /// 检查是否有指定端口的输出
    pub fn has_output(&self, port_name: &str) -> bool {
        let port_ref = PortRef::new(&self.node_name, port_name);
        self.data_outputs.contains_key(&port_ref)
    }

    /// 获取所有输出端口名称
    pub fn output_port_names(&self) -> Vec<&str> {
        self.data_outputs
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

    #[test]
    fn test_create_event() {
        let data_outputs = NodeDataOutputs::new();
        let control_outputs = NodeControlOutputs::new();
        let event = NodeOutputEvent::new("test_node", "exec_1", data_outputs, control_outputs);
        assert_eq!(event.node_name, "test_node");
        assert_eq!(event.node_execute_id, "exec_1");
        assert!(event.data_outputs.is_empty());
        assert!(event.control_outputs.is_empty());
        assert!(!event.meta.event_id.is_empty());
    }
}
