use crate::types::{NodeName, NodeType, PortName};
use serde::{Deserialize, Serialize};

/// 端口引用，用于表示图中的一个唯一端口
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct PortRef {
    pub node_name: NodeName,
    pub port_name: PortName,
}

/// 连接关系
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    pub from: PortRef,
    pub to: PortRef,
}

/// 节点定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeRef {
    pub name: NodeName,
    pub node_type: NodeType,
}

/// 计算图完整定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Graph {
    pub nodes: Vec<NodeRef>,
    pub data_connections: Vec<Connection>,
}
