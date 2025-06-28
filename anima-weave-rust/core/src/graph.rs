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

/// 端口定义
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Port {
    pub node_id: String,
    pub port_name: String,
    pub activation_mode: ActivationMode,
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
    pub concurrent_mode: ConcurrentMode,
}

/// 图定义
#[derive(Debug, Clone)]
pub struct Graph {
    pub nodes: Vec<Node>,
    pub data_connections: Vec<Connection>,
    pub control_connections: Vec<Connection>,
}

/// =========================
/// Graph查询接口
/// =========================
use crate::{NodeName, PortName, PortRef};

/// Graph查询接口
///
/// 提供图结构的查询能力，让Coordinator等组件可以获取图信息
/// 而不需要直接访问Graph的内部数据结构
pub trait GraphQuery: Send + Sync {
    /// =========================
    /// 节点查询
    /// =========================

    /// 获取节点的所有输入端口
    ///
    /// 用于Coordinator的DataReady检查
    fn get_node_input_ports(&self, node_name: &NodeName) -> Vec<PortName>;

    /// 获取节点的所有输出端口
    fn get_node_output_ports(&self, node_name: &NodeName) -> Vec<PortName>;

    /// 检查节点是否存在
    fn node_exists(&self, node_name: &NodeName) -> bool;

    /// 获取节点类型
    fn get_node_type(&self, node_name: &NodeName) -> Option<String>;

    /// =========================
    /// 连接查询
    /// =========================

    /// 获取数据连接的目标端口列表
    ///
    /// 用于确定DataEvent应该发送到哪些目标
    fn get_data_connection_targets(&self, source_port: &PortRef) -> Vec<PortRef>;

    /// 获取控制连接的目标端口列表
    ///
    /// 用于确定ControlEvent应该发送到哪些目标
    fn get_control_connection_targets(&self, source_port: &PortRef) -> Vec<PortRef>;

    /// 检查两个端口是否有数据连接
    fn has_data_connection(&self, from_port: &PortRef, to_port: &PortRef) -> bool;

    /// 检查两个端口是否有控制连接
    fn has_control_connection(&self, from_port: &PortRef, to_port: &PortRef) -> bool;

    /// =========================
    /// 拓扑分析
    /// =========================

    /// 获取节点的直接数据依赖
    ///
    /// 返回当前节点依赖的上游节点列表
    fn get_node_dependencies(&self, node_name: &NodeName) -> Vec<NodeName>;

    /// 获取节点的下游节点
    ///
    /// 返回依赖当前节点的下游节点列表
    fn get_node_dependents(&self, node_name: &NodeName) -> Vec<NodeName>;

    /// 检查是否存在循环依赖
    ///
    /// 返回循环依赖的节点路径，如果没有循环依赖则返回None
    fn detect_circular_dependency(&self) -> Option<Vec<NodeName>>;

    /// 获取拓扑排序的节点顺序
    ///
    /// 返回可以安全执行的节点顺序
    fn topological_sort(&self) -> Result<Vec<NodeName>, String>;

    /// =========================
    /// 端口查询
    /// =========================

    /// 获取端口的激活模式
    fn get_port_activation_mode(&self, port: &PortRef) -> Option<ActivationMode>;

    /// 获取节点的并发模式
    fn get_node_concurrent_mode(&self, node_name: &NodeName) -> Option<ConcurrentMode>;
}

// GraphQuery的具体实现应该在具体的Graph实现中提供
// 这里只定义抽象接口，保持graph.rs的职责清晰
