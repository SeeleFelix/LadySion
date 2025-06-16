// 节点Actor - 独立的节点执行器

use actix::{Actor, Context, Handler, Addr, AsyncContext};
use std::collections::HashMap;
use crate::{NodeSpec, NodeInputs, NodeOutputs, PluginRegistry, TypedValue};
use super::messages::*;
use super::DataBusActor;

/// 节点执行状态
#[derive(Debug, Clone, PartialEq)]
pub enum NodeState {
    Waiting,    // 等待输入数据
    Ready,      // 输入已就绪，准备执行
    Executing,  // 正在执行
    Completed,  // 执行完成
}

/// 节点Actor
/// 每个节点实例都是一个独立的Actor，负责：
/// 1. 接收数据和控制信号
/// 2. 执行节点逻辑
/// 3. 发送输出结果
pub struct NodeActor {
    /// 节点ID
    node_id: String,
    
    /// 节点规格
    node_spec: NodeSpec,
    
    /// 插件注册表
    plugin_registry: PluginRegistry,
    
    /// 数据总线引用
    data_bus: Addr<DataBusActor>,
    
    /// 节点状态
    state: NodeState,
    
    /// 当前输入数据
    current_inputs: NodeInputs,
    
    /// 已收到的输入端口集合（用于判断是否就绪）
    received_inputs: std::collections::HashSet<String>,
    
    /// 是否为Start节点（无需等待输入）
    is_start_node: bool,
}

impl NodeActor {
    pub fn new(
        node_id: String,
        node_spec: NodeSpec,
        plugin_registry: PluginRegistry,
        data_bus: Addr<DataBusActor>,
    ) -> Self {
        let is_start_node = node_spec.node_type == "Start";
        let state = if is_start_node {
            NodeState::Ready
        } else {
            NodeState::Waiting
        };
        
        Self {
            node_id,
            node_spec,
            plugin_registry,
            data_bus,
            state,
            current_inputs: NodeInputs::new(),
            received_inputs: std::collections::HashSet::new(),
            is_start_node,
        }
    }
    
    /// 检查节点是否准备好执行
    fn check_readiness(&mut self) -> bool {
        if self.is_start_node {
            return true;
        }
        
        // TODO: 这里应该根据节点定义检查必需的输入端口
        // 现在简化处理：如果有任何输入就认为准备好了
        !self.received_inputs.is_empty()
    }
    
    /// 执行节点
    async fn execute_node(&mut self) -> Result<NodeOutputs, String> {
        if self.state != NodeState::Ready {
            return Err(format!("Node {} is not ready for execution", self.node_id));
        }
        
        self.state = NodeState::Executing;
        
        let full_node_type = format!("{}.{}", self.node_spec.package, self.node_spec.node_type);
        println!("🔥 NodeActor {}: Executing {} with {} inputs", 
                self.node_id, full_node_type, self.current_inputs.0.len());
        
        // 使用插件执行节点
        let result = self.plugin_registry.execute_node(&full_node_type, &self.current_inputs);
        
        match result {
            Ok(outputs) => {
                self.state = NodeState::Completed;
                println!("✅ NodeActor {}: Execution successful with {} outputs", 
                        self.node_id, outputs.0.len());
                Ok(outputs)
            }
            Err(e) => {
                println!("❌ NodeActor {}: Execution failed: {}", self.node_id, e);
                Err(e)
            }
        }
    }
}

impl Actor for NodeActor {
    type Context = Context<Self>;
    
    fn started(&mut self, ctx: &mut Self::Context) {
        println!("🌟 NodeActor {} started ({})", self.node_id, 
                if self.is_start_node { "Start Node" } else { "Regular Node" });
        
        // 如果是Start节点，立即尝试执行
        if self.is_start_node && self.state == NodeState::Ready {
            ctx.notify(AwakeNodeMessage {
                node_id: self.node_id.clone(),
                inputs: NodeInputs::new(),
            });
        }
    }
}

/// 处理节点唤醒消息
impl Handler<AwakeNodeMessage> for NodeActor {
    type Result = Result<(), String>;
    
    fn handle(&mut self, msg: AwakeNodeMessage, ctx: &mut Self::Context) -> Self::Result {
        if msg.node_id != self.node_id {
            return Err(format!("Wrong node ID: expected {}, got {}", self.node_id, msg.node_id));
        }
        
        println!("⏰ NodeActor {}: Received awake message", self.node_id);
        
        // 合并输入数据
        for (port_name, value) in msg.inputs.0 {
            self.current_inputs.insert_raw(&port_name, value);
            self.received_inputs.insert(port_name);
        }
        
        // 检查是否准备好执行
        if self.check_readiness() {
            self.state = NodeState::Ready;
            
            // 异步执行节点
            let data_bus = self.data_bus.clone();
            let node_id = self.node_id.clone();
            
            let fut = self.execute_node();
            let fut = async move {
                match fut.await {
                    Ok(outputs) => {
                        // 通知数据总线节点完成
                        data_bus.do_send(NodeCompletedMessage {
                            node_id,
                            outputs,
                        });
                    }
                    Err(e) => {
                        println!("❌ Node execution failed: {}", e);
                    }
                }
            };
            
            ctx.spawn(actix::fut::wrap_future(fut));
        }
        
        Ok(())
    }
}

/// 处理数据可用消息
impl Handler<DataAvailableMessage> for NodeActor {
    type Result = ();
    
    fn handle(&mut self, msg: DataAvailableMessage, ctx: &mut Self::Context) {
        if msg.to_node != self.node_id {
            return;
        }
        
        println!("📥 NodeActor {}: Received data for port {}", self.node_id, msg.to_port);
        
        // 添加输入数据
        self.current_inputs.insert_raw(&msg.to_port, msg.value);
        self.received_inputs.insert(msg.to_port.clone());
        
        // 检查是否准备好执行
        if self.state == NodeState::Waiting && self.check_readiness() {
            ctx.notify(AwakeNodeMessage {
                node_id: self.node_id.clone(),
                inputs: NodeInputs::new(), // 输入已经在current_inputs中了
            });
        }
    }
}

/// 处理控制信号消息
impl Handler<ControlSignalMessage> for NodeActor {
    type Result = ();
    
    fn handle(&mut self, msg: ControlSignalMessage, ctx: &mut Self::Context) {
        if msg.to_node != self.node_id {
            return;
        }
        
        println!("🎮 NodeActor {}: Received control signal for port {}", self.node_id, msg.to_port);
        
        // 添加控制信号
        self.current_inputs.insert_raw(&msg.to_port, msg.signal);
        self.received_inputs.insert(msg.to_port.clone());
        
        // 检查是否准备好执行
        if self.state == NodeState::Waiting && self.check_readiness() {
            ctx.notify(AwakeNodeMessage {
                node_id: self.node_id.clone(),
                inputs: NodeInputs::new(), // 输入已经在current_inputs中了
            });
        }
    }
} 