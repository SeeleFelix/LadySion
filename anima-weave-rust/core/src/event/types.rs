use crate::types::{NodeName, PortName};
use serde::{Deserialize, Serialize};
use std::sync::atomic::AtomicU64;




/// 端口引用 - 标识图中的特定端口
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PortRef {
    /// 节点名称（图中唯一标识）
    pub node_name: NodeName,
    /// 端口名称
    pub port_name: PortName,
}

impl PortRef {
    pub fn new(node_name: impl Into<NodeName>, port_name: impl Into<PortName>) -> Self {
        Self {
            node_name: node_name.into(),
            port_name: port_name.into(),
        }
    }
}

/// 节点执行状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NodeStatus {
    /// 等待执行
    Pending,
    /// 正在执行
    Running,
    /// 执行完成
    Completed,
    /// 执行失败
    Failed(String),
}

impl NodeStatus {
    pub fn is_success(&self) -> bool {
        matches!(self, NodeStatus::Completed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;


    #[test]
    fn test_port_ref() {
        let port_ref = PortRef::new("node1", "output");
        assert_eq!(port_ref.node_name, "node1");
        assert_eq!(port_ref.port_name, "output");
    }

    #[test]
    fn test_port_ref_equality() {
        let port1 = PortRef::new("node1", "output");
        let port2 = PortRef::new("node1", "output");
        let port3 = PortRef::new("node2", "output");

        assert_eq!(port1, port2);
        assert_ne!(port1, port3);
    }

    #[test]
    fn test_node_status() {
        let pending = NodeStatus::Pending;
        let running = NodeStatus::Running;
        let completed = NodeStatus::Completed;
        let failed = NodeStatus::Failed("error".to_string());

        assert_eq!(pending, NodeStatus::Pending);
        assert_eq!(running, NodeStatus::Running);
        assert_eq!(completed, NodeStatus::Completed);

        match failed {
            NodeStatus::Failed(msg) => assert_eq!(msg, "error"),
            _ => panic!("应该是Failed状态"),
        }
    }
}
