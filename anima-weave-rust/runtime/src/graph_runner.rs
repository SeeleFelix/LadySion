use crate::actor::{DataInputMessage, SimpleNodeActor};
use crate::status_tracker::SimpleStatusTracker;
use anima_weave_core::graph::PortRef;
use anima_weave_core::{Graph, Node, NodeName, PortName};
use anima_weave_node::create_node_by_type;
use anyhow::{Result, anyhow};
use kameo::prelude::*;
use std::collections::HashMap;

/// 图运行器 - 根据验证通过的图创建和管理 actor
pub struct GraphRunner {
    actors: HashMap<NodeName, ActorRef<SimpleNodeActor>>,
    status_tracker: Option<ActorRef<SimpleStatusTracker>>,
}

impl GraphRunner {
    /// 根据图创建 GraphRunner
    pub async fn build_from_graph(graph: Graph) -> Result<Self> {
        // 验证图
        graph.validate()?;

        let mut runner = Self {
            actors: HashMap::new(),
            status_tracker: None,
        };

        // 创建 actor 实例
        runner.create_actors(&graph).await?;

        // 设置连接
        runner.setup_connections(&graph).await?;

        Ok(runner)
    }

    /// 启动指定的起始节点
    pub async fn launch(&self, start_node_name: &str) -> Result<()> {
        let start_actor = self
            .actors
            .get(start_node_name)
            .ok_or_else(|| anyhow!("Start node '{}' not found", start_node_name))?;

        // 发送启动消息给起始节点（空输入触发执行）
        let start_message = DataInputMessage {
            from_port: PortRef {
                node_name: "system".to_string(),
                port_name: "trigger".to_string(),
            },
            to_port: PortRef {
                node_name: start_node_name.to_string(),
                port_name: "trigger".to_string(),
            },
            data: Box::new(anima_weave_vessels::StringLabel {
                value: "start".to_string(),
            }),
            execution_id: "initial".to_string(),
        };

        start_actor
            .tell(start_message)
            .await
            .map_err(|e| anyhow!("Failed to start node: {}", e))?;

        Ok(())
    }

    /// 创建所有 actor 实例（不设置连接）
    async fn create_actors(&mut self, graph: &Graph) -> Result<()> {
        for node_ref in &graph.nodes {
            let node_impl = Self::create_node_impl(&node_ref.node_type)?;

            // 获取该节点的输入端口（从连接中推导）
            let connected_input_ports: Vec<PortRef> = graph
                .data_connections
                .iter()
                .filter(|conn| conn.to.node_name == node_ref.name)
                .map(|conn| conn.to.clone())
                .collect();

            let mut actor = SimpleNodeActor::new(
                node_ref.name.clone(),
                node_impl,
                connected_input_ports,
                HashMap::new(), // 下游连接稍后通过消息设置
            );

            // 如果有状态追踪器，设置它
            if let Some(ref tracker) = self.status_tracker {
                actor = actor.with_status_tracker(tracker.clone());
            }

            let actor_ref = Actor::spawn(actor);
            self.actors.insert(node_ref.name.clone(), actor_ref);
        }

        Ok(())
    }

    /// 设置 actor 之间的连接
    async fn setup_connections(&self, graph: &Graph) -> Result<()> {
        // 构建下游连接映射
        let mut downstream_map: HashMap<
            NodeName,
            HashMap<PortName, Vec<(ActorRef<SimpleNodeActor>, PortRef)>>,
        > = HashMap::new();

        for conn in &graph.data_connections {
            let to_actor = self
                .actors
                .get(&conn.to.node_name)
                .ok_or_else(|| anyhow!("Target node '{}' not found", conn.to.node_name))?;

            downstream_map
                .entry(conn.from.node_name.clone())
                .or_insert_with(HashMap::new)
                .entry(conn.from.port_name.clone())
                .or_insert_with(Vec::new)
                .push((to_actor.clone(), conn.to.clone()));
        }

        // 为每个 actor 发送连接设置消息
        for (node_name, connections) in downstream_map {
            if let Some(actor_ref) = self.actors.get(&node_name) {
                let message = crate::actor::SetDownstreamConnectionsMessage { connections };
                actor_ref.tell(message).await.map_err(|e| {
                    anyhow!("Failed to set connections for node {}: {}", node_name, e)
                })?;
            }
        }

        Ok(())
    }

    /// 根据节点类型创建节点实现
    fn create_node_impl(node_type: &str) -> Result<Box<dyn Node>> {
        // 使用 O(1) factory 查找
        create_node_by_type(node_type).ok_or_else(|| anyhow!("Unknown node type: {}", node_type))
    }
}
