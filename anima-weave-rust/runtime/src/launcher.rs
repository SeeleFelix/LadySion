use std::collections::HashMap;
use std::sync::Arc;

use anima_weave_core::actor::node_actor::NodeActor;
use anima_weave_core::actor::{coordinator::Coordinator, status_collector::StatusCollector};
use anima_weave_core::event::DataMessage;
use anima_weave_core::graph::{ActivationMode, GraphQuery};
use anima_weave_core::in_memory_graph::InMemoryGraph;
use anima_weave_core::types::{NodeName, PortRef};
use anima_weave_node::node::Node;
use kameo::prelude::{Actor, ActorRef};
use log;
use uuid::Uuid;

pub type NodeFactory = &'static HashMap<&'static str, fn() -> Box<dyn Node>>;

/// 分布式图启动器
///
/// 负责启动和管理分布式 AnimaWeave 图的执行：
/// 1. 创建 StatusCollector 和 Coordinator 用于监控
/// 2. 为每个节点创建 DistributedNodeActor
/// 3. 配置节点间的直接连接
/// 4. 通过 DataMessage 启动图执行
pub struct DistributedGraphLauncher {
    graph: Arc<InMemoryGraph>,
    node_factory: NodeFactory,

    // 系统组件
    status_collector: Option<ActorRef<StatusCollector>>,
    coordinator: Option<ActorRef<Coordinator>>,

    // 节点Actor映射
    node_actors: HashMap<NodeName, ActorRef<NodeActor>>,
}

impl DistributedGraphLauncher {
    /// 创建新的分布式图启动器
    pub fn new(graph: Arc<InMemoryGraph>, node_factory: NodeFactory) -> Self {
        Self {
            graph,
            node_factory,
            status_collector: None,
            coordinator: None,
            node_actors: HashMap::new(),
        }
    }

    /// 两阶段初始化：创建所有组件并建立连接
    pub async fn setup(&mut self) -> Result<(), String> {
        // 第一阶段：创建系统组件
        self.create_system_components().await?;

        // 第二阶段：创建完全配置的节点Actor
        self.create_configured_node_actors().await?;

        log::info!("Distributed graph launcher setup completed successfully");
        Ok(())
    }

    /// 创建系统监控组件
    async fn create_system_components(&mut self) -> Result<(), String> {
        // 创建 StatusCollector
        let status_collector = Actor::spawn(StatusCollector::new());
        log::info!("Created StatusCollector");

        // 创建 Coordinator
        let coordinator = Actor::spawn(Coordinator::new(status_collector.clone()));
        log::info!("Created Coordinator");

        self.status_collector = Some(status_collector);
        self.coordinator = Some(coordinator);

        Ok(())
    }

    /// 创建完全配置的节点Actor
    async fn create_configured_node_actors(&mut self) -> Result<(), String> {
        let status_collector = self
            .status_collector
            .as_ref()
            .ok_or("StatusCollector not initialized")?;

        // 第一阶段：创建所有节点Actor（使用空配置）
        let mut temp_actors = HashMap::new();
        for node_info in self.graph.get_nodes() {
            let node_name = node_info.node_name.clone();
            let node_type = &node_info.node_type;

            // 从工厂创建节点实现
            let node_factory = self
                .node_factory
                .get(node_type.as_str())
                .ok_or_else(|| format!("No factory found for node type: {}", node_type))?;
            let external_node = node_factory();

            // 包装为分布式Actor使用的Node trait
            let wrapped_node = NodeWrapper::new(external_node);

            // 创建临时Actor（空配置）
            let node_actor = NodeActor::new(
                node_name.clone(),
                Box::new(wrapped_node),
                status_collector.clone(),
                HashMap::new(),
                HashMap::new(),
                Vec::new(),
                Vec::new(),
            );

            let actor_ref = Actor::spawn(node_actor);
            temp_actors.insert(node_name.clone(), actor_ref);
            log::info!(
                "Created temporary DistributedNodeActor for node: {}",
                node_name
            );
        }

        // 第二阶段：收集配置信息
        let node_configurations = self.collect_node_configurations(&temp_actors).await?;

        // 第三阶段：用完整配置重新创建Actor
        for node_info in self.graph.get_nodes() {
            let node_name = node_info.node_name.clone();
            let node_type = &node_info.node_type;

            // 从工厂创建节点实现
            let node_factory = self
                .node_factory
                .get(node_type.as_str())
                .ok_or_else(|| format!("No factory found for node type: {}", node_type))?;
            let external_node = node_factory();

            // 包装为分布式Actor使用的Node trait
            let wrapped_node = NodeWrapper::new(external_node);

            // 获取完整配置
            let config = node_configurations
                .get(&node_name)
                .ok_or_else(|| format!("Configuration not found for node: {}", node_name))?;

            // 创建最终配置的Actor
            let node_actor = NodeActor::new(
                node_name.clone(),
                Box::new(wrapped_node),
                status_collector.clone(),
                config.port_mappings.clone(),
                config.control_modes.clone(),
                config.required_data_ports.clone(),
                config.required_control_ports.clone(),
            );

            let actor_ref = Actor::spawn(node_actor);
            self.node_actors.insert(node_name.clone(), actor_ref);
            log::info!(
                "Created fully configured DistributedNodeActor for node: {}",
                node_name
            );
        }

        Ok(())
    }

    /// 收集所有节点的配置信息
    async fn collect_node_configurations(
        &self,
        actors: &HashMap<NodeName, ActorRef<NodeActor>>,
    ) -> Result<HashMap<NodeName, NodeConfiguration>, String> {
        let mut configurations = HashMap::new();

        for node_info in self.graph.get_nodes() {
            let node_name = &node_info.node_name;

            // 收集出口连接
            let outgoing_connections = self.get_outgoing_connections(node_name);
            let mut port_mappings = HashMap::new();

            for connection in outgoing_connections {
                let from_port = PortRef::new(node_name, &connection.from_port);
                let to_port = PortRef::new(&connection.to_node, &connection.to_port);
                let to_actor = actors
                    .get(&connection.to_node)
                    .ok_or_else(|| format!("Target actor not found: {}", connection.to_node))?;

                port_mappings
                    .entry(from_port)
                    .or_insert_with(Vec::new)
                    .push((to_actor.clone(), to_port));
            }

            // 收集输入端口信息
            let data_inputs = self.graph.get_data_input_connections(node_name);
            let mut required_data_ports = Vec::new();

            for input in data_inputs {
                let port_ref = PortRef::new(node_name, &input.to_port.port_name);
                if !required_data_ports.contains(&port_ref) {
                    required_data_ports.push(port_ref);
                }
            }

            // 暂时没有控制端口，使用空配置
            let control_modes = HashMap::new();
            let required_control_ports = Vec::new();

            let config = NodeConfiguration {
                port_mappings,
                control_modes,
                required_data_ports,
                required_control_ports,
            };

            configurations.insert(node_name.clone(), config);
        }

        Ok(configurations)
    }

    /// 启动图执行
    pub async fn launch_and_wait(&self, start_node_name: &str) -> Result<(), String> {
        let start_actor = self
            .node_actors
            .get(start_node_name)
            .ok_or_else(|| format!("Start node '{}' not found", start_node_name))?;

        let execution_id = Uuid::new_v4().to_string();

        // 创建初始触发消息
        let trigger_message = DataMessage {
            from_node: "system".to_string(),
            from_port: PortRef::new("system", "trigger"),
            to_node: start_node_name.to_string(),
            to_port: PortRef::new(start_node_name, "input"),
            data: Arc::new(anima_weave_core::signal::SignalLabel::active()),
            execution_id,
        };

        // 发送触发消息
        start_actor
            .tell(trigger_message)
            .await
            .map_err(|e| format!("Failed to send trigger message: {}", e))?;

        log::info!("Launched graph execution from node: {}", start_node_name);

        // 等待一段时间让图执行
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;

        Ok(())
    }

    /// 获取系统状态
    pub async fn get_status(&self) -> Result<(), String> {
        if let Some(coordinator) = &self.coordinator {
            // 这里可以查询系统状态
            log::info!("Graph execution status available through coordinator");
        }
        Ok(())
    }

    /// 关闭系统
    pub async fn shutdown(&mut self) {
        log::info!("Shutting down distributed graph launcher");
        // Kameo actors 会自动清理，但我们可以在这里做一些额外的清理工作
        self.node_actors.clear();
    }

    /// 获取从指定节点出发的所有连接
    fn get_outgoing_connections(&self, node_name: &str) -> Vec<OutgoingConnection> {
        let mut connections = Vec::new();

        // 获取所有节点的数据输入连接，找到来自指定节点的连接
        for node_info in self.graph.get_nodes() {
            let data_inputs = self.graph.get_data_input_connections(&node_info.node_name);
            for connection in data_inputs {
                if connection.from_port.node_name == node_name {
                    connections.push(OutgoingConnection {
                        from_port: connection.from_port.port_name,
                        to_node: connection.to_port.node_name,
                        to_port: connection.to_port.port_name,
                    });
                }
            }
        }

        connections
    }
}

/// 简化的连接信息
#[derive(Debug)]
struct OutgoingConnection {
    from_port: String,
    to_node: String,
    to_port: String,
}

/// 节点配置信息
#[derive(Debug, Clone)]
struct NodeConfiguration {
    port_mappings: HashMap<PortRef, Vec<(ActorRef<NodeActor>, PortRef)>>,
    control_modes: HashMap<PortRef, ActivationMode>,
    required_data_ports: Vec<PortRef>,
    required_control_ports: Vec<PortRef>,
}

/// NodeWrapper - 将anima_weave_node::Node适配为anima_weave_core::Node
struct NodeWrapper {
    inner: Box<dyn anima_weave_node::node::Node>,
}

impl NodeWrapper {
    fn new(inner: Box<dyn anima_weave_node::node::Node>) -> Self {
        Self { inner }
    }
}

impl std::fmt::Debug for NodeWrapper {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("NodeWrapper")
            .field("node_type", &self.inner.node_type())
            .finish()
    }
}

impl anima_weave_core::Node for NodeWrapper {
    fn execute(
        &self,
        inputs: &anima_weave_core::types::NodeDataInputs,
    ) -> Result<anima_weave_core::types::NodeDataOutputs, anima_weave_core::AnimaWeaveError> {
        self.inner.execute(inputs)
    }

    fn node_type(&self) -> &'static str {
        self.inner.node_type()
    }

    fn is_ready(&self) -> bool {
        true
    }
}
