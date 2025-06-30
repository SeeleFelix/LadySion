//! InMemoryGraph - 图结构的内存实现
//!
//! 提供GraphQuery trait的具体实现，用于测试和简单场景

use crate::graph::{ActivationMode, ConcurrentMode, Connection, Graph, GraphQuery, Node, Port};
use crate::{NodeName, PortName, PortRef};
use std::collections::HashMap;

/// 内存中的图实现
pub struct InMemoryGraph {
    graph: Graph,
    /// 缓存：节点名称到节点的映射
    node_map: HashMap<NodeName, Node>,
    /// 缓存：节点名称到其数据输入连接的映射
    data_input_cache: HashMap<NodeName, Vec<Connection>>,
    /// 缓存：节点名称到其控制输入连接的映射
    control_input_cache: HashMap<NodeName, Vec<Connection>>,
    /// 缓存：节点名称到其依赖节点列表的映射
    dependents_cache: HashMap<NodeName, Vec<NodeName>>,
}

impl InMemoryGraph {
    /// 从Graph创建InMemoryGraph
    pub fn new(graph: Graph) -> Self {
        let mut instance = Self {
            graph,
            node_map: HashMap::new(),
            data_input_cache: HashMap::new(),
            control_input_cache: HashMap::new(),
            dependents_cache: HashMap::new(),
        };
        instance.build_caches();
        instance
    }

    /// 构建内部缓存以提高查询性能
    fn build_caches(&mut self) {
        // 构建节点映射
        for node in &self.graph.nodes {
            self.node_map.insert(node.node_name.clone(), node.clone());
        }

        // 构建数据输入连接缓存
        for conn in &self.graph.data_connections {
            self.data_input_cache
                .entry(conn.to_port.node_name.clone())
                .or_default()
                .push(conn.clone());
        }

        // 构建控制输入连接缓存
        for conn in &self.graph.control_connections {
            self.control_input_cache
                .entry(conn.to_port.node_name.clone())
                .or_default()
                .push(conn.clone());
        }

        // 构建依赖关系缓存
        for conn in &self.graph.data_connections {
            self.dependents_cache
                .entry(conn.from_port.node_name.clone())
                .or_default()
                .push(conn.to_port.node_name.clone());
        }
        for conn in &self.graph.control_connections {
            self.dependents_cache
                .entry(conn.from_port.node_name.clone())
                .or_default()
                .push(conn.to_port.node_name.clone());
        }

        // 去重依赖列表
        for dependents in self.dependents_cache.values_mut() {
            dependents.sort();
            dependents.dedup();
        }
    }
}

impl GraphQuery for InMemoryGraph {
    fn get_data_input_connections(&self, node_name: &NodeName) -> Vec<Connection> {
        self.data_input_cache
            .get(node_name)
            .cloned()
            .unwrap_or_default()
    }

    fn get_control_input_connections(&self, node_name: &NodeName) -> Vec<Connection> {
        self.control_input_cache
            .get(node_name)
            .cloned()
            .unwrap_or_default()
    }

    fn get_node_output_ports(&self, node_name: &NodeName) -> Vec<PortName> {
        // 这里我们简化处理，返回从连接中推断的输出端口
        let mut ports = Vec::new();
        
        for conn in &self.graph.data_connections {
            if conn.from_port.node_name == *node_name {
                ports.push(conn.from_port.port_name.clone());
            }
        }
        for conn in &self.graph.control_connections {
            if conn.from_port.node_name == *node_name {
                ports.push(conn.from_port.port_name.clone());
            }
        }
        
        ports.sort();
        ports.dedup();
        ports
    }

    fn node_exists(&self, node_name: &NodeName) -> bool {
        self.node_map.contains_key(node_name)
    }

    fn get_node_type(&self, node_name: &NodeName) -> Option<String> {
        self.node_map.get(node_name).map(|node| node.node_type.clone())
    }

    fn get_data_connection_targets(&self, source_port: &PortRef) -> Vec<PortRef> {
        self.graph
            .data_connections
            .iter()
            .filter(|conn| {
                conn.from_port.node_name == source_port.node_name
                    && conn.from_port.port_name == source_port.port_name
            })
            .map(|conn| PortRef::new(&conn.to_port.node_name, &conn.to_port.port_name))
            .collect()
    }

    fn get_control_connection_targets(&self, source_port: &PortRef) -> Vec<PortRef> {
        self.graph
            .control_connections
            .iter()
            .filter(|conn| {
                conn.from_port.node_name == source_port.node_name
                    && conn.from_port.port_name == source_port.port_name
            })
            .map(|conn| PortRef::new(&conn.to_port.node_name, &conn.to_port.port_name))
            .collect()
    }

    fn has_data_connection(&self, from_port: &PortRef, to_port: &PortRef) -> bool {
        self.graph.data_connections.iter().any(|conn| {
            conn.from_port.node_name == from_port.node_name
                && conn.from_port.port_name == from_port.port_name
                && conn.to_port.node_name == to_port.node_name
                && conn.to_port.port_name == to_port.port_name
        })
    }

    fn has_control_connection(&self, from_port: &PortRef, to_port: &PortRef) -> bool {
        self.graph.control_connections.iter().any(|conn| {
            conn.from_port.node_name == from_port.node_name
                && conn.from_port.port_name == from_port.port_name
                && conn.to_port.node_name == to_port.node_name
                && conn.to_port.port_name == to_port.port_name
        })
    }

    fn get_node_dependencies(&self, node_name: &NodeName) -> Vec<NodeName> {
        let mut dependencies = Vec::new();
        
        // 从数据连接获取依赖
        if let Some(data_conns) = self.data_input_cache.get(node_name) {
            for conn in data_conns {
                dependencies.push(conn.from_port.node_name.clone());
            }
        }
        
        // 从控制连接获取依赖
        if let Some(control_conns) = self.control_input_cache.get(node_name) {
            for conn in control_conns {
                dependencies.push(conn.from_port.node_name.clone());
            }
        }
        
        dependencies.sort();
        dependencies.dedup();
        dependencies
    }

    fn get_node_dependents(&self, node_name: &NodeName) -> Vec<NodeName> {
        self.dependents_cache
            .get(node_name)
            .cloned()
            .unwrap_or_default()
    }

    fn detect_circular_dependency(&self) -> Option<Vec<NodeName>> {
        // 简化实现：使用深度优先搜索检测环
        let mut visited = HashMap::new();
        let mut rec_stack = HashMap::new();
        
        for node in &self.graph.nodes {
            if !visited.get(&node.node_name).unwrap_or(&false) {
                if let Some(cycle) = self.dfs_cycle_detect(&node.node_name, &mut visited, &mut rec_stack) {
                    return Some(cycle);
                }
            }
        }
        None
    }

    fn topological_sort(&self) -> Result<Vec<NodeName>, String> {
        if let Some(cycle) = self.detect_circular_dependency() {
            return Err(format!("Circular dependency detected: {:?}", cycle));
        }
        
        // Kahn算法
        let mut in_degree = HashMap::new();
        let mut queue = Vec::new();
        let mut result = Vec::new();
        
        // 计算入度
        for node in &self.graph.nodes {
            in_degree.insert(node.node_name.clone(), 0);
        }
        
        for conn in &self.graph.data_connections {
            *in_degree.entry(conn.to_port.node_name.clone()).or_insert(0) += 1;
        }
        for conn in &self.graph.control_connections {
            *in_degree.entry(conn.to_port.node_name.clone()).or_insert(0) += 1;
        }
        
        // 找到入度为0的节点
        for (node_name, degree) in &in_degree {
            if *degree == 0 {
                queue.push(node_name.clone());
            }
        }
        
        while let Some(node_name) = queue.pop() {
            result.push(node_name.clone());
            
            // 减少依赖节点的入度
            for dependent in self.get_node_dependents(&node_name) {
                let degree = in_degree.get_mut(&dependent).unwrap();
                *degree -= 1;
                if *degree == 0 {
                    queue.push(dependent);
                }
            }
        }
        
        Ok(result)
    }

    fn get_port_activation_mode(&self, port: &PortRef) -> Option<ActivationMode> {
        // 从控制连接中查找端口的激活模式
        for conn in &self.graph.control_connections {
            if conn.to_port.node_name == port.node_name && conn.to_port.port_name == port.port_name {
                return Some(conn.to_port.activation_mode.clone());
            }
        }
        None
    }

    fn get_node_concurrent_mode(&self, node_name: &NodeName) -> Option<ConcurrentMode> {
        self.node_map
            .get(node_name)
            .map(|node| node.concurrent_mode.clone())
    }
}

impl InMemoryGraph {
    /// DFS循环检测的辅助方法
    fn dfs_cycle_detect(
        &self,
        node: &NodeName,
        visited: &mut HashMap<NodeName, bool>,
        rec_stack: &mut HashMap<NodeName, bool>,
    ) -> Option<Vec<NodeName>> {
        visited.insert(node.clone(), true);
        rec_stack.insert(node.clone(), true);
        
        for dependent in self.get_node_dependents(node) {
            if !visited.get(&dependent).unwrap_or(&false) {
                if let Some(cycle) = self.dfs_cycle_detect(&dependent, visited, rec_stack) {
                    return Some(cycle);
                }
            } else if *rec_stack.get(&dependent).unwrap_or(&false) {
                return Some(vec![node.clone(), dependent]);
            }
        }
        
        rec_stack.insert(node.clone(), false);
        None
    }
} 