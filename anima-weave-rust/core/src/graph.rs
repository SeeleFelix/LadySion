use crate::types::{NodeName, NodeType, PortName};
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

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

impl Graph {
    /// 验证图的完整性
    pub fn validate(&self) -> Result<()> {
        self.validate_no_cycles()?;
        self.validate_connections()?;
        self.validate_required_ports()?;
        self.validate_single_connections()?;
        Ok(())
    }

    /// 检测图中是否有环
    fn validate_no_cycles(&self) -> Result<()> {
        let mut visited = HashSet::new();
        let mut rec_stack = HashSet::new();

        // 构建邻接表
        let mut adj_list: HashMap<NodeName, Vec<NodeName>> = HashMap::new();
        for node in &self.nodes {
            adj_list.insert(node.name.clone(), Vec::new());
        }

        for conn in &self.data_connections {
            if let Some(neighbors) = adj_list.get_mut(&conn.from.node_name) {
                neighbors.push(conn.to.node_name.clone());
            }
        }

        // DFS 检测环
        for node in &self.nodes {
            if !visited.contains(&node.name) {
                if self.has_cycle_dfs(&node.name, &adj_list, &mut visited, &mut rec_stack) {
                    return Err(anyhow!(
                        "Graph contains cycle involving node: {}",
                        node.name
                    ));
                }
            }
        }

        Ok(())
    }

    fn has_cycle_dfs(
        &self,
        node: &NodeName,
        adj_list: &HashMap<NodeName, Vec<NodeName>>,
        visited: &mut HashSet<NodeName>,
        rec_stack: &mut HashSet<NodeName>,
    ) -> bool {
        visited.insert(node.clone());
        rec_stack.insert(node.clone());

        if let Some(neighbors) = adj_list.get(node) {
            for neighbor in neighbors {
                if !visited.contains(neighbor) {
                    if self.has_cycle_dfs(neighbor, adj_list, visited, rec_stack) {
                        return true;
                    }
                } else if rec_stack.contains(neighbor) {
                    return true;
                }
            }
        }

        rec_stack.remove(node);
        false
    }

    /// 验证连接的类型兼容性
    fn validate_connections(&self) -> Result<()> {
        // TODO: 实现 label 转换检测
        // 需要查询输出端口的 label 类型，检查是否能转换为输入端口类型
        Ok(())
    }

    /// 验证必填端口都有连接
    fn validate_required_ports(&self) -> Result<()> {
        // TODO: 实现必填端口检查
        // 需要查询节点的 required_ports，确保每个都有连接
        Ok(())
    }

    /// 验证每个端口至多一个连接
    fn validate_single_connections(&self) -> Result<()> {
        let mut input_ports = HashSet::new();

        for conn in &self.data_connections {
            let input_port = (&conn.to.node_name, &conn.to.port_name);
            if input_ports.contains(&input_port) {
                return Err(anyhow!(
                    "Input port {}:{} has multiple connections",
                    conn.to.node_name,
                    conn.to.port_name
                ));
            }
            input_ports.insert(input_port);
        }

        Ok(())
    }
}
