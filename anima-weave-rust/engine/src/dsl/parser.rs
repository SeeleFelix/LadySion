use crate::core::graph::{Connection, Graph, NodeRef, PortRef};
use std::collections::HashMap;

/// A mock parser that returns a predefined graph structure.
/// This allows us to work on the runtime without a real parser.
// TODO: Implement a real parser.
pub fn parse() -> Graph {
    Graph {
        nodes: vec![
            NodeRef {
                name: "input1".to_string(),
                node_type: "StringInput".to_string(),
                control_port_configs: HashMap::new(),
            },
            NodeRef {
                name: "transformer".to_string(),
                node_type: "Transformer".to_string(),
                control_port_configs: HashMap::new(),
            },
            NodeRef {
                name: "output1".to_string(),
                node_type: "LogOutput".to_string(),
                control_port_configs: HashMap::new(),
            },
        ],
        data_connections: vec![
            Connection {
                from: PortRef {
                    node_name: "input1".to_string(),
                    port_name: "output".to_string(),
                },
                to: PortRef {
                    node_name: "transformer".to_string(),
                    port_name: "input".to_string(),
                },
            },
            Connection {
                from: PortRef {
                    node_name: "transformer".to_string(),
                    port_name: "output".to_string(),
                },
                to: PortRef {
                    node_name: "output1".to_string(),
                    port_name: "input".to_string(),
                },
            },
        ],
        control_connections: vec![],
    }
}
