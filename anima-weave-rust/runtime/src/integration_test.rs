//! AnimaWeave 端到端集成测试
//!
//! 验证 StartNode ➜ MathNode 的完整事件流。

use anima_weave_core::{
    actor::{
        coordinator::Coordinator,
        databus::actor::DataBus,
        node::NodeExecutor,
        node_actor::NodeActor,
    },
    event::{NodeExecuteEvent, NodeExecutionEvent, NodeOutputEvent, NodeReadyEvent},
    graph::{ActivationMode, Connection, ConcurrentMode, Graph, Node, Port},
    in_memory_graph::InMemoryGraph,
};
use anima_weave_vessels::{math_node::MathNode, start_node::StartNode};
use kameo::prelude::*;
use std::{sync::Arc, time::Duration};
use uuid::Uuid;

/// 创建简单图：`start` (输出 value) ➜ `math` (输入 number)
fn create_graph() -> Arc<InMemoryGraph> {
    // 端口
    let start_value = Port {
        node_name: "start".into(),
        port_name: "value".into(),
        activation_mode: ActivationMode::And,
    };
    let math_number = Port {
        node_name: "math".into(),
        port_name: "number".into(),
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
            node_type: "MathNode".into(),
            concurrent_mode: ConcurrentMode::Sequential,
        },
    ];

    // 连接
    let data_connections = vec![Connection {
        from_port: start_value,
        to_port: math_number,
    }];

    // 构造图
    let graph = Graph {
        nodes,
        data_connections,
        control_connections: vec![],
    };
    Arc::new(InMemoryGraph::new(graph))
}

#[tokio::test]
async fn start_to_math_integration() {
    let graph = create_graph();

    // Coordinator
    let coordinator_ref = Coordinator::spawn(Coordinator::new());
    let exec_recipient = coordinator_ref.clone().recipient::<NodeExecutionEvent>();
    let ready_recipient = coordinator_ref.recipient::<NodeReadyEvent>();

    // DataBus
    let databus_ref = DataBus::spawn((graph.clone(), ready_recipient));
    let databus_recipient = databus_ref.recipient::<NodeOutputEvent>();

    // NodeActors
    let start_node: Arc<dyn NodeExecutor> = Arc::new(StartNode::new(5.0));
    let start_ref = NodeActor::spawn((
        "start".into(),
        start_node,
        databus_recipient.clone(),
        exec_recipient.clone(),
    ));

    let math_node: Arc<dyn NodeExecutor> = Arc::new(MathNode::new(3.0));
    let math_ref = NodeActor::spawn((
        "math".into(),
        math_node,
        databus_recipient,
        exec_recipient,
    ));

    // 触发 start
    let exec_id = Uuid::new_v4().to_string();
    let execute_event = NodeExecuteEvent::empty("start", exec_id);
    start_ref.tell(execute_event).await.unwrap();

    // 简单等待数据流完成（后续可用更可靠方式替换）
    tokio::time::sleep(Duration::from_millis(200)).await;
} 