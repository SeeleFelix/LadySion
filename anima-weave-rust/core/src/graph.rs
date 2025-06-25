/// 激活模式
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ActivationMode {
    And,        
    Or,
    Xor,
}

/// 并发模式
#[derive(Debug, Clone, PartialEq)]
pub enum ConcurrentMode {
    Concurrent,
    Sequential,
}

/// 端口标识符
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Port {
    pub node_id: String,
    pub port_name: String,
    pub activation_mode: Option<ActivationMode>,
}

/// 连接关系
#[derive(Debug, Clone)] 
pub struct Connection {
    pub from_port: Port,
    pub to_port: Port,
}

/// 节点定义
#[derive(Debug, Clone)]
pub struct Node {
    pub node_id: String,
    pub node_type: String,
    pub concurrent_mode: Option<ConcurrentMode>,
}

/// 图定义
#[derive(Debug, Clone)]
pub struct Graph {
    pub nodes: Vec<Node>,
    pub data_connections: Vec<Connection>,
    pub control_connections: Vec<Connection>,
}