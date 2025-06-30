use std::collections::HashMap;
use std::sync::Arc;

use anima_weave_core::actor::{
    coordinator::Coordinator,
    databus::actor::DataBus,
    node::NodeExecutor,
    node_actor::NodeActor,
    registry::NodeRegistry,
};
use anima_weave_core::event::{NodeExecuteEvent, NodeExecutionEvent, NodeOutputEvent, NodeReadyEvent};
use anima_weave_core::graph::{Graph, GraphQuery};
use anima_weave_core::in_memory_graph::InMemoryGraph;
use kameo::prelude::{Actor, ActorRef, Recipient};
use log;
use uuid::Uuid;

// The Node Factory maps a node type string to a function that creates a NodeExecutor instance.
pub type NodeFactory =
    HashMap<&'static str, Box<dyn Fn() -> Arc<dyn NodeExecutor> + Send + Sync>>;

/// The GraphLauncher is responsible for setting up and running a graph execution.
// TODO: This should eventually accept a path to a .weave file and parse it into a Graph.
#[allow(dead_code)] // This is for the main application, but used in tests for now
pub struct GraphLauncher {
    graph: Arc<InMemoryGraph>,
    registry: Arc<NodeRegistry>,
    node_factory: NodeFactory,
    coordinator: Option<ActorRef<Coordinator>>,
    databus: Option<ActorRef<DataBus>>,
}

#[allow(dead_code)]
impl GraphLauncher {
    pub fn new(graph: Arc<InMemoryGraph>, node_factory: NodeFactory) -> Self {
        Self {
            graph,
            registry: Arc::new(NodeRegistry::new()),
            node_factory,
            coordinator: None,
            databus: None,
        }
    }

    /// Sets up the Coordinator, DataBus, and all NodeActors for the graph.
    pub async fn setup(&mut self) -> Result<(), String> {
        // 1. Setup Coordinator and DataBus
        let coordinator_ref = Actor::spawn(Coordinator::with_registry(self.registry.clone()));
        let ready_recipient = coordinator_ref.clone().recipient::<NodeReadyEvent>();
        let exec_recipient = coordinator_ref.clone().recipient::<NodeExecutionEvent>();
        
        self.coordinator = Some(coordinator_ref);

        let databus_ref = DataBus::spawn((self.graph.clone(), ready_recipient));
        let databus_recipient = databus_ref.clone().recipient::<NodeOutputEvent>();

        self.databus = Some(databus_ref);

        // 2. Setup NodeActors based on the graph definition
        for node in self.graph.get_nodes() {
            let node_name = node.node_name.clone();
            let node_executor = self.create_node_executor(&node.node_type)?;
            let _node_actor_ref =
                NodeActor::spawn_and_register(
                    node.node_name,
                    node_executor,
                    databus_recipient.clone(),
                    exec_recipient.clone(),
                    self.registry.clone(),
                );

            log::info!("Spawned NodeActor for '{}'", node_name);
        }

        Ok(())
    }

    /// Launches the graph execution and waits for a predefined duration.
    // TODO: Replace the sleep with a proper completion signal mechanism.
    pub async fn launch_and_wait(&self, start_node_name: &str) {
        let start_actor = self.registry.lookup(&start_node_name.to_string())
            .unwrap_or_else(|| panic!("Start node '{}' not found in registry", start_node_name));

        let exec_id = Uuid::new_v4().to_string();
        let execute_event = NodeExecuteEvent::empty(start_node_name.to_string(), exec_id);
        
        start_actor.tell(execute_event).await.unwrap();

        // This is still a "mock" for proper completion detection.
        tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    }

    /// 根据节点类型创建具体的执行器实例
    fn create_node_executor(&self, node_type: &str) -> Result<Arc<dyn NodeExecutor>, String> {
        self.node_factory.get(node_type)
            .map(|factory_fn| factory_fn())
            .ok_or_else(|| format!("Node type '{}' not found in factory", node_type))
    }
} 