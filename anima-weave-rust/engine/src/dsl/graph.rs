use serde::{Deserialize, Serialize};

pub type NodeName = String;
pub type NodeType = String;
pub type PortName = String;

/// 激活模式 - 定义控制信号如何聚合
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ActivationMode {
    AND,
    OR,
    XOR,
}

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
pub struct Node {
    pub name: NodeName,
    pub node_type: NodeType,
    pub control_port_onfigs: HashMap<PortName, ActivationMode>,
}

/// 计算图的完整定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Graph {
    pub nodes: Vec<Node>,
    pub data_connections: Vec<Connection>,
    pub control_connections: Vec<Connection>,
}
