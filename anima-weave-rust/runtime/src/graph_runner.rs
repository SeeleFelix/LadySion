use crate::actor::{SimpleNodeActor, TriggerExecutionMessage};
use crate::status_tracker::{SetExpectedNodesCommand, SetShutdownHookCommand, SimpleStatusTracker};
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
    source_nodes: Vec<NodeName>, // 没有输入连接的节点
}

impl GraphRunner {
    /// 根据图创建 GraphRunner
    pub async fn build_from_graph(
        graph: Graph,
        shutdown_hook: Option<Box<dyn Fn() + Send + Sync + 'static>>,
    ) -> Result<Self> {
        // 验证图
        graph.validate()?;

        // 1. 启动状态追踪器
        let tracker_ref = Actor::spawn(SimpleStatusTracker::new());

        // 如果提供了关机钩子，设置它
        if let Some(hook) = shutdown_hook {
            tracker_ref
                .tell(SetShutdownHookCommand { hook })
                .await
                .map_err(|e| anyhow!("Failed to set shutdown hook: {}", e))?;
        }

        let mut runner = Self {
            actors: HashMap::new(),
            status_tracker: Some(tracker_ref.clone()),
            source_nodes: Vec::new(),
        };

        // 2. 创建 actor 实例
        runner.create_actors(&graph).await?;

        // 3. 设置连接
        runner.setup_connections(&graph).await?;

        // 4. 将期望节点列表发送给状态追踪器
        let expected_nodes: Vec<NodeName> = graph.nodes.iter().map(|n| n.name.clone()).collect();
        tracker_ref
            .tell(SetExpectedNodesCommand {
                nodes: expected_nodes,
            })
            .await
            .map_err(|e| anyhow!("Failed to set expected nodes: {}", e))?;

        Ok(runner)
    }

    /// 启动所有没有输入端口的节点
    pub async fn launch(&self) -> Result<()> {
        log::info!(
            "Launching {} source nodes: {:?}",
            self.source_nodes.len(),
            self.source_nodes
        );

        // 启动所有源节点
        for node_name in &self.source_nodes {
            let actor_ref = self
                .actors
                .get(node_name)
                .ok_or_else(|| anyhow!("Source node '{}' not found", node_name))?;

            let trigger_message = TriggerExecutionMessage {
                execution_id: "initial".to_string(),
            };

            actor_ref
                .tell(trigger_message)
                .await
                .map_err(|e| anyhow!("Failed to start node {}: {}", node_name, e))?;
        }

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

            // 如果节点没有输入连接，它就是源节点
            if connected_input_ports.is_empty() {
                self.source_nodes.push(node_ref.name.clone());
                log::info!("Found source node: {}", node_ref.name);
            }

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
