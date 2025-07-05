//! InMemoryGraph - 图结构的内存实现
//!
//! 提供GraphQuery trait的具体实现，用于测试和简单场景

use crate::graph::{ActivationMode, Connection, Graph, GraphQuery, Node, Port};
use crate::types::{NodeName, PortName, PortRef};
use std::collections::HashMap;

#[derive(Debug, Default)]
pub struct InMemoryGraph {
    nodes: HashMap<NodeName, Node>,
    ports: HashMap<PortRef, Port>,

    // 正向连接：输出端口 -> Vec<输入端口>
    data_forward_edges: HashMap<PortRef, Vec<PortRef>>,
    control_forward_edges: HashMap<PortRef, Vec<PortRef>>,

    // 反向连接：输入端口 -> Vec<输出端口>
    data_backward_edges: HashMap<PortRef, Vec<PortRef>>,
    control_backward_edges: HashMap<PortRef, Vec<PortRef>>,
}

impl InMemoryGraph {
    pub fn new(graph_def: Graph) -> Self {
        let mut graph = Self::default();

        for node in graph_def.nodes {
            graph.nodes.insert(node.node_name.clone(), node);
        }

        for conn in graph_def.data_connections {
            let from_ref = conn.from_port.to_port_ref();
            let to_ref = conn.to_port.to_port_ref();
            graph.ports.insert(from_ref.clone(), conn.from_port);
            graph.ports.insert(to_ref.clone(), conn.to_port);
            graph
                .data_forward_edges
                .entry(from_ref.clone())
                .or_default()
                .push(to_ref.clone());
            graph
                .data_backward_edges
                .entry(to_ref)
                .or_default()
                .push(from_ref);
        }

        for conn in graph_def.control_connections {
            let from_ref = conn.from_port.to_port_ref();
            let to_ref = conn.to_port.to_port_ref();
            graph.ports.insert(from_ref.clone(), conn.from_port);
            graph.ports.insert(to_ref.clone(), conn.to_port);
            graph
                .control_forward_edges
                .entry(from_ref.clone())
                .or_default()
                .push(to_ref.clone());
            graph
                .control_backward_edges
                .entry(to_ref)
                .or_default()
                .push(from_ref);
        }

        graph
    }
}

impl GraphQuery for InMemoryGraph {
    fn get_node(&self, node_name: &NodeName) -> Option<Node> {
        self.nodes.get(node_name).cloned()
    }

    fn get_nodes(&self) -> Vec<Node> {
        self.nodes.values().cloned().collect()
    }

    fn get_data_input_connections(&self, node_name: &NodeName) -> Vec<Connection> {
        self.data_backward_edges
            .iter()
            .filter(|(to_port, _)| to_port.node_name == *node_name)
            .flat_map(|(to_port, from_ports)| {
                from_ports.iter().map(move |from_port| Connection {
                    from_port: self.ports.get(from_port).unwrap().clone(),
                    to_port: self.ports.get(to_port).unwrap().clone(),
                })
            })
            .collect()
    }

    fn get_control_input_connections(&self, node_name: &NodeName) -> Vec<Connection> {
        self.control_backward_edges
            .iter()
            .filter(|(to_port, _)| to_port.node_name == *node_name)
            .flat_map(|(to_port, from_ports)| {
                from_ports.iter().map(move |from_port| Connection {
                    from_port: self.ports.get(from_port).unwrap().clone(),
                    to_port: self.ports.get(to_port).unwrap().clone(),
                })
            })
            .collect()
    }

    fn get_node_dependents(&self, node_name: &NodeName) -> Vec<NodeName> {
        let mut dependents = Vec::new();
        for (from_port, to_ports) in self.data_forward_edges.iter() {
            if from_port.node_name == *node_name {
                for to_port in to_ports {
                    dependents.push(to_port.node_name.clone());
                }
            }
        }
        for (from_port, to_ports) in self.control_forward_edges.iter() {
            if from_port.node_name == *node_name {
                for to_port in to_ports {
                    dependents.push(to_port.node_name.clone());
                }
            }
        }
        dependents.sort();
        dependents.dedup();
        dependents
    }

    fn get_port_activation_mode(&self, port: &PortRef) -> Option<ActivationMode> {
        self.ports.get(port).map(|p| p.activation_mode.clone())
    }

    // NOTE: other GraphQuery methods are not implemented yet for brevity
    // and because they are not immediately needed for the current event flow.
    // They should be implemented for a complete GraphQuery implementation.

    fn get_node_output_ports(&self, _node_name: &NodeName) -> Vec<PortName> {
        unimplemented!()
    }
    fn node_exists(&self, _node_name: &NodeName) -> bool {
        unimplemented!()
    }
    fn get_node_type(&self, _node_name: &NodeName) -> Option<String> {
        unimplemented!()
    }
    fn get_data_connection_targets(&self, _source_port: &PortRef) -> Vec<PortRef> {
        unimplemented!()
    }
    fn get_control_connection_targets(&self, _source_port: &PortRef) -> Vec<PortRef> {
        unimplemented!()
    }
    fn has_data_connection(&self, _from_port: &PortRef, _to_port: &PortRef) -> bool {
        unimplemented!()
    }
    fn has_control_connection(&self, _from_port: &PortRef, _to_port: &PortRef) -> bool {
        unimplemented!()
    }
    fn get_node_dependencies(&self, _node_name: &NodeName) -> Vec<NodeName> {
        unimplemented!()
    }
    fn detect_circular_dependency(&self) -> Option<Vec<NodeName>> {
        unimplemented!()
    }
    fn topological_sort(&self) -> Result<Vec<NodeName>, String> {
        unimplemented!()
    }
    fn get_node_concurrent_mode(
        &self,
        _node_name: &NodeName,
    ) -> Option<crate::graph::ConcurrentMode> {
        unimplemented!()
    }
}
