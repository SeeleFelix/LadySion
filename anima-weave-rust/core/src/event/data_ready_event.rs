use super::types::{EventMeta, PortRef};
use crate::types::{NodeInputs, NodeName};

/// 数据就绪事件 - 依赖满足通知
///
/// 职责：
/// - DataBus发送给Coordinator的就绪通知
/// - 表示某个节点的所有依赖已满足，可以执行
/// - 包含准备好的输入数据，供Coordinator验证和调度
#[derive(Debug)]
pub struct DataReadyEvent {
    /// 事件元数据
    pub meta: EventMeta,
    /// 准备好执行的节点名称
    pub target_node_name: NodeName,
    /// 准备好的输入数据
    pub prepared_inputs: NodeInputs,
}

impl DataReadyEvent {
    /// 创建新的数据就绪事件
    pub fn new(target_node_name: impl Into<NodeName>, prepared_inputs: NodeInputs) -> Self {
        Self {
            meta: EventMeta::new(),
            target_node_name: target_node_name.into(),
            prepared_inputs,
        }
    }

    /// 获取指定端口的输入数据
    pub fn get_input(&self, port_name: &str) -> Option<&Box<dyn crate::SemanticLabel>> {
        let port_ref = PortRef::new(&self.target_node_name, port_name);
        self.prepared_inputs.get(&port_ref)
    }

    /// 检查是否有指定端口的输入
    pub fn has_input(&self, port_name: &str) -> bool {
        let port_ref = PortRef::new(&self.target_node_name, port_name);
        self.prepared_inputs.contains_key(&port_ref)
    }

    /// 获取所有输入端口名称
    pub fn input_port_names(&self) -> Vec<&str> {
        self.prepared_inputs
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
        let inputs = NodeInputs::new();
        let event = DataReadyEvent::new("test_node", inputs);
        assert_eq!(event.target_node_name, "test_node");
        assert!(event.prepared_inputs.is_empty());
        assert!(!event.meta.event_id.is_empty());
    }
}
