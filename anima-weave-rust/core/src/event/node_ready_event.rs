use super::types::{EventMeta, PortRef};
use crate::types::{NodeControlInputs, NodeDataInputs, NodeName};

/// 节点就绪事件 - 依赖满足通知
///
/// 职责：
/// - DataBus发送给Coordinator的就绪通知
/// - 表示某个节点的所有依赖已满足，可以执行
/// - 包含准备好的数据输入和控制输入，供Coordinator验证和调度
#[derive(Debug)]
pub struct NodeReadyEvent {
    /// 事件元数据
    pub meta: EventMeta,
    /// 准备好执行的节点名称
    pub target_node_name: NodeName,
    /// 准备好的数据输入
    pub data_inputs: NodeDataInputs,
    /// 准备好的控制输入
    pub control_inputs: NodeControlInputs,
}

impl NodeReadyEvent {
    /// 创建新的节点就绪事件
    pub fn new(
        target_node_name: impl Into<NodeName>,
        data_inputs: NodeDataInputs,
        control_inputs: NodeControlInputs,
    ) -> Self {
        Self {
            meta: EventMeta::new(),
            target_node_name: target_node_name.into(),
            data_inputs,
            control_inputs,
        }
    }

    /// 获取指定端口的数据输入
    pub fn get_data_input(&self, port_name: &str) -> Option<&Box<dyn crate::SemanticLabel>> {
        let port_ref = PortRef::new(&self.target_node_name, port_name);
        self.data_inputs.get(&port_ref)
    }

    /// 获取指定端口的控制输入
    pub fn get_control_input(&self, port_name: &str) -> Option<&crate::SignalLabel> {
        let port_ref = PortRef::new(&self.target_node_name, port_name);
        self.control_inputs.get(&port_ref)
    }

    /// 检查是否有指定端口的数据输入
    pub fn has_data_input(&self, port_name: &str) -> bool {
        let port_ref = PortRef::new(&self.target_node_name, port_name);
        self.data_inputs.contains_key(&port_ref)
    }

    /// 检查是否有指定端口的控制输入
    pub fn has_control_input(&self, port_name: &str) -> bool {
        let port_ref = PortRef::new(&self.target_node_name, port_name);
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

impl Clone for NodeReadyEvent {
    fn clone(&self) -> Self {
        let mut new_data_inputs = NodeDataInputs::new();
        for (key, val) in &self.data_inputs {
            new_data_inputs.insert(key.clone(), val.clone_box());
        }

        Self {
            meta: self.meta.clone(),
            target_node_name: self.target_node_name.clone(),
            data_inputs: new_data_inputs,
            control_inputs: self.control_inputs.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_event() {
        let data_inputs = NodeDataInputs::new();
        let control_inputs = NodeControlInputs::new();
        let event = NodeReadyEvent::new("test_node", data_inputs, control_inputs);
        assert_eq!(event.target_node_name, "test_node");
        assert!(event.data_inputs.is_empty());
        assert!(event.control_inputs.is_empty());
        assert!(!event.meta.event_id.is_empty());
    }
}
