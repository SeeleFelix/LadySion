//! AnimaWeave 端到端集成测试
//!
//! 验证 StartNode ➜ AddNode 的完整事件流。

use crate::launcher::DistributedGraphLauncher;
use anima_weave_core::{
    graph::{ActivationMode, ConcurrentMode, Connection, Graph, Node, Port},
    in_memory_graph::InMemoryGraph,
};
use anima_weave_vessels::create_node_factory;
use std::sync::Arc;

/// 创建简单图：`start` (输出 value) ➜ `math` (输入 a, b)
fn create_graph() -> Arc<InMemoryGraph> {
    // 端口
    let start_value = Port {
        node_name: "start".into(),
        port_name: "value".into(),
        activation_mode: ActivationMode::And,
    };
    let math_a = Port {
        node_name: "math".into(),
        port_name: "a".into(),
        activation_mode: ActivationMode::And,
    };
    let math_b = Port {
        node_name: "math".into(),
        port_name: "b".into(),
        activation_mode: ActivationMode::And,
    };

    // 节点
    let nodes = vec![
        Node {
            node_name: "start".into(),
            node_type: "StartNode".into(),
            concurrent_mode: ConcurrentMode::Sequential,
        },
        Node {
            node_name: "math".into(),
            node_type: "AddNode".into(),
            concurrent_mode: ConcurrentMode::Sequential,
        },
    ];

    // 连接
    let data_connections = vec![
        Connection {
            from_port: start_value.clone(),
            to_port: math_a,
        },
        Connection {
            from_port: start_value,
            to_port: math_b,
        },
    ];

    // 构造图
    let graph_def = Graph {
        nodes,
        data_connections,
        control_connections: vec![],
    };
    Arc::new(InMemoryGraph::new(graph_def))
}

/// Test the full flow from a start node to an add node.
/// The graph is defined as:
///
/// [StartNode] --data--> [AddNode]
///
#[tokio::test]
async fn test_start_to_math_flow() {
    // Setup logging
    let _ = env_logger::try_init();

    // 1. Define the graph
    let graph_def = Graph {
        nodes: vec![
            Node {
                node_name: "start".to_string(),
                node_type: "StartNode".to_string(),
                concurrent_mode: ConcurrentMode::Sequential,
            },
                    Node {
            node_name: "math".to_string(),
            node_type: "AddNode".to_string(),
            concurrent_mode: ConcurrentMode::Sequential,
        },
        ],
        data_connections: vec![
            Connection {
                from_port: Port {
                    node_name: "start".to_string(),
                    port_name: "output".to_string(),
                    activation_mode: ActivationMode::And,
                },
                to_port: Port {
                    node_name: "math".to_string(),
                    port_name: "a".to_string(),
                    activation_mode: ActivationMode::And,
                },
            },
            Connection {
                from_port: Port {
                    node_name: "start".to_string(),
                    port_name: "output".to_string(),
                    activation_mode: ActivationMode::And,
                },
                to_port: Port {
                    node_name: "math".to_string(),
                    port_name: "b".to_string(),
                    activation_mode: ActivationMode::And,
                },
            },
        ],
        control_connections: vec![],
    };

    let graph = Arc::new(InMemoryGraph::new(graph_def));

    // 2. Create the launcher
    let mut launcher = DistributedGraphLauncher::new(graph, create_node_factory());

    // 3. Setup the actor system
    if let Err(e) = launcher.setup().await {
        panic!("Failed to setup launcher: {}", e);
    }

    // 4. Start the graph execution
    launcher.launch_and_wait("start").await;

    // 5. Wait for events to propagate
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    // Manually check the logs for now.
    // We expect to see the StartNode outputting, and the AddNode executing and outputting.
}
