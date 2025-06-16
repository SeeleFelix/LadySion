// 图执行Actor - 图管理和调度

use actix::{Actor, Context, Handler, Addr, AsyncContext};
use std::collections::HashMap;
use futures::future::join_all;
use crate::{GraphDefinition, PluginRegistry, NodeOutputs};
use super::messages::*;
use super::{DataBusActor, NodeActor};

/// 图执行Actor
/// 负责：
/// 1. 创建和管理所有节点Actor
/// 2. 配置数据总线的连接关系
/// 3. 启动图执行流程
/// 4. 收集最终结果
pub struct GraphExecutorActor {
    /// 数据总线引用
    data_bus: Addr<DataBusActor>,
    
    /// 节点Actor映射
    node_actors: HashMap<String, Addr<NodeActor>>,
    
    /// 图定义
    graph: Option<GraphDefinition>,
    
    /// 插件注册表
    registry: Option<PluginRegistry>,
    
    /// 等待的Future句柄
    execution_future: Option<actix::SpawnHandle>,
}

impl GraphExecutorActor {
    pub fn new(data_bus: Addr<DataBusActor>) -> Self {
        Self {
            data_bus,
            node_actors: HashMap::new(),
            graph: None,
            registry: None,
            execution_future: None,
        }
    }
    
    /// 构建连接映射
    fn build_connections(&self, graph: &GraphDefinition) -> (HashMap<PortRef, Vec<PortRef>>, HashMap<PortRef, Vec<PortRef>>) {
        let mut data_connections = HashMap::new();
        let mut control_connections = HashMap::new();
        
        // 处理数据连接
        for connection in &graph.data_flow.connections {
            let from_port = PortRef::new(
                connection.from_node.clone(), 
                connection.from_port.clone()
            );
            let to_port = PortRef::new(
                connection.to_node.clone(), 
                connection.to_port.clone()
            );
            
            data_connections
                .entry(from_port)
                .or_insert_with(Vec::new)
                .push(to_port);
        }
        
        // 处理控制连接
        for connection in &graph.control_flow.connections {
            let from_port = PortRef::new(
                connection.from_node.clone(), 
                connection.from_port.clone()
            );
            let to_port = PortRef::new(
                connection.to_node.clone(), 
                connection.to_port.clone()
            );
            
            control_connections
                .entry(from_port)
                .or_insert_with(Vec::new)
                .push(to_port);
        }
        
        (data_connections, control_connections)
    }
    
    /// 创建所有节点Actor
    async fn create_node_actors(&mut self, graph: &GraphDefinition, registry: &PluginRegistry) {
        println!("🏗️ GraphExecutor: Creating {} node actors", graph.nodes.len());
        
        for (node_id, node_spec) in &graph.nodes {
            let node_actor = NodeActor::new(
                node_id.clone(),
                node_spec.clone(),
                registry.clone(),
                self.data_bus.clone(),
            ).start();
            
            // 注册节点Actor到数据总线
            self.data_bus.do_send(RegisterNodeActorMessage {
                node_id: node_id.clone(),
                actor_addr: node_actor.clone(),
            });
            
            self.node_actors.insert(node_id.clone(), node_actor);
            println!("✨ GraphExecutor: Created NodeActor for {}", node_id);
        }
    }
    
    /// 配置数据总线连接
    async fn configure_data_bus(&mut self, graph: &GraphDefinition) {
        let (data_connections, control_connections) = self.build_connections(graph);
        
        println!("🔗 GraphExecutor: Configuring {} data connections, {} control connections",
                data_connections.len(), control_connections.len());
        
        // 这里需要想办法配置DataBusActor
        // 由于我们没有直接访问DataBusActor状态的方法，需要添加配置消息
        // 暂时先打印连接信息
        for (from_port, to_ports) in &data_connections {
            for to_port in to_ports {
                println!("📡 Data: {}.{} -> {}.{}", 
                        from_port.node_id, from_port.port_name,
                        to_port.node_id, to_port.port_name);
            }
        }
        
        for (from_port, to_ports) in &control_connections {
            for to_port in to_ports {
                println!("🎮 Control: {}.{} -> {}.{}", 
                        from_port.node_id, from_port.port_name,
                        to_port.node_id, to_port.port_name);
            }
        }
    }
    
    /// 设置订阅关系
    async fn setup_subscriptions(&mut self, graph: &GraphDefinition) {
        println!("📡 GraphExecutor: Setting up subscriptions");
        
        // 为每个连接的目标端口设置订阅
        for connection in &graph.data_flow.connections {
            if let Some(node_actor) = self.node_actors.get(&connection.to_node) {
                self.data_bus.do_send(SubscribeDataMessage {
                    node_id: connection.to_node.clone(),
                    port_name: connection.to_port.clone(),
                    subscriber: node_actor.clone(),
                });
            }
        }
        
        for connection in &graph.control_flow.connections {
            if let Some(node_actor) = self.node_actors.get(&connection.to_node) {
                self.data_bus.do_send(SubscribeDataMessage {
                    node_id: connection.to_node.clone(),
                    port_name: connection.to_port.clone(),
                    subscriber: node_actor.clone(),
                });
            }
        }
    }
    
    /// 等待图执行完成
    async fn wait_for_completion(&self) -> Result<HashMap<String, NodeOutputs>, String> {
        // 简化实现：等待一段时间让所有节点完成
        // 实际应该监听所有节点完成事件
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        
        // 从数据总线获取结果
        // 这里需要添加获取结果的消息
        // 暂时返回空结果
        Ok(HashMap::new())
    }
}

impl Actor for GraphExecutorActor {
    type Context = Context<Self>;
    
    fn started(&mut self, _ctx: &mut Self::Context) {
        println!("🎭 GraphExecutorActor started");
    }
}

/// 处理执行图消息
impl Handler<ExecuteGraphMessage> for GraphExecutorActor {
    type Result = Result<HashMap<String, NodeOutputs>, String>;
    
    fn handle(&mut self, msg: ExecuteGraphMessage, ctx: &mut Self::Context) -> Self::Result {
        println!("🚀 GraphExecutor: Starting graph execution with {} nodes", 
                msg.graph.nodes.len());
        
        self.graph = Some(msg.graph.clone());
        self.registry = Some(msg.registry.clone());
        
        // 创建异步执行流程
        let data_bus = self.data_bus.clone();
        let graph = msg.graph;
        let registry = msg.registry;
        
        let fut = async move {
            // 1. 构建连接映射
            let (data_connections, control_connections) = {
                let mut data_connections = HashMap::new();
                let mut control_connections = HashMap::new();
                
                // 处理数据连接
                for connection in &graph.data_flow.connections {
                    let from_port = PortRef::new(
                        connection.from_node.clone(), 
                        connection.from_port.clone()
                    );
                    let to_port = PortRef::new(
                        connection.to_node.clone(), 
                        connection.to_port.clone()
                    );
                    
                    data_connections
                        .entry(from_port)
                        .or_insert_with(Vec::new)
                        .push(to_port);
                }
                
                // 处理控制连接
                for connection in &graph.control_flow.connections {
                    let from_port = PortRef::new(
                        connection.from_node.clone(), 
                        connection.from_port.clone()
                    );
                    let to_port = PortRef::new(
                        connection.to_node.clone(), 
                        connection.to_port.clone()
                    );
                    
                    control_connections
                        .entry(from_port)
                        .or_insert_with(Vec::new)
                        .push(to_port);
                }
                
                (data_connections, control_connections)
            };
            
            // 2. 创建所有节点Actor
            let mut node_actors = HashMap::new();
            for (node_id, node_spec) in &graph.nodes {
                let node_actor = NodeActor::new(
                    node_id.clone(),
                    node_spec.clone(),
                    registry.clone(),
                    data_bus.clone(),
                ).start();
                
                node_actors.insert(node_id.clone(), node_actor);
                println!("✨ Created NodeActor for {}", node_id);
            }
            
            // 3. 设置订阅关系
            for connection in &graph.data_flow.connections {
                if let Some(node_actor) = node_actors.get(&connection.to_node) {
                    data_bus.do_send(SubscribeDataMessage {
                        node_id: connection.to_node.clone(),
                        port_name: connection.to_port.clone(),
                        subscriber: node_actor.clone(),
                    });
                }
            }
            
            for connection in &graph.control_flow.connections {
                if let Some(node_actor) = node_actors.get(&connection.to_node) {
                    data_bus.do_send(SubscribeDataMessage {
                        node_id: connection.to_node.clone(),
                        port_name: connection.to_port.clone(),
                        subscriber: node_actor.clone(),
                    });
                }
            }
            
            // 4. 等待执行完成
            tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
            
            // 5. 返回空结果（TODO: 实现真正的结果收集）
            Ok(HashMap::new())
        };
        
        // 同步执行（简化实现）
        // 在实际实现中应该异步处理
        futures::executor::block_on(fut)
    }
} 