// 数据总线Actor - 智能数据路由和缓存

use actix::{Actor, Context, Handler, Addr, AsyncContext};
use std::collections::HashMap;
use crate::{TypedValue, NodeOutputs};
use super::messages::*;
use super::NodeActor;

/// 数据总线Actor
/// 负责：
/// 1. 数据流路由 - 将输出数据路由到正确的输入端口
/// 2. 智能缓存 - 缓存数据直到不再需要
/// 3. 事件分发 - 数据可用时通知订阅者
pub struct DataBusActor {
    /// 数据缓存：端口 -> 数据值
    data_cache: HashMap<PortRef, TypedValue>,
    
    /// 订阅者：端口 -> 订阅该端口数据的节点Actor列表
    subscribers: HashMap<PortRef, Vec<Addr<NodeActor>>>,
    
    /// 数据连接映射：输出端口 -> 输入端口列表
    data_connections: HashMap<PortRef, Vec<PortRef>>,
    
    /// 控制连接映射：输出端口 -> 输入端口列表  
    control_connections: HashMap<PortRef, Vec<PortRef>>,
    
    /// 所有节点输出缓存，用于最终过滤
    all_outputs: HashMap<String, NodeOutputs>,
}

impl DataBusActor {
    pub fn new() -> Self {
        Self {
            data_cache: HashMap::new(),
            subscribers: HashMap::new(),
            data_connections: HashMap::new(),
            control_connections: HashMap::new(),
            all_outputs: HashMap::new(),
        }
    }
    
    /// 设置数据连接
    pub fn set_data_connections(&mut self, connections: HashMap<PortRef, Vec<PortRef>>) {
        self.data_connections = connections;
    }
    
    /// 设置控制连接
    pub fn set_control_connections(&mut self, connections: HashMap<PortRef, Vec<PortRef>>) {
        self.control_connections = connections;
    }
    
    /// 获取过滤后的终端输出
    pub fn get_filtered_outputs(&self) -> HashMap<String, NodeOutputs> {
        let mut filtered_outputs = HashMap::new();
        
        for (node_name, node_outputs) in &self.all_outputs {
            let mut filtered_node_outputs = NodeOutputs::new();
            
            // 检查每个输出端口是否被消费
            for (port_name, output_value) in &node_outputs.0 {
                let port_ref = PortRef::new(node_name.clone(), port_name.clone());
                let mut is_consumed = false;
                
                // 检查数据连接
                if self.data_connections.contains_key(&port_ref) {
                    is_consumed = true;
                }
                
                // 检查控制连接  
                if !is_consumed && self.control_connections.contains_key(&port_ref) {
                    is_consumed = true;
                }
                
                // 只保留未被消费的输出端口
                if !is_consumed {
                    filtered_node_outputs.insert_raw(port_name, output_value.clone());
                }
            }
            
            // 只有当节点还有输出端口时才加入结果
            if !filtered_node_outputs.is_empty() {
                filtered_outputs.insert(node_name.clone(), filtered_node_outputs);
            }
        }
        
        filtered_outputs
    }
}

impl Actor for DataBusActor {
    type Context = Context<Self>;
    
    fn started(&mut self, _ctx: &mut Self::Context) {
        println!("🚌 DataBusActor started");
    }
}

/// 处理节点完成消息
impl Handler<NodeCompletedMessage> for DataBusActor {
    type Result = ();
    
    fn handle(&mut self, msg: NodeCompletedMessage, _ctx: &mut Self::Context) {
        println!("📦 DataBus: Node {} completed with {} outputs", 
                msg.node_id, msg.outputs.0.len());
        
        // 保存节点输出到全局缓存
        self.all_outputs.insert(msg.node_id.clone(), msg.outputs.clone());
        
        // 处理每个输出端口
        for (port_name, value) in &msg.outputs.0 {
            let from_port = PortRef::new(msg.node_id.clone(), port_name.clone());
            
            // 缓存数据
            self.data_cache.insert(from_port.clone(), value.clone());
            
            // 查找数据连接并转发数据
            if let Some(target_ports) = self.data_connections.get(&from_port) {
                for target_port in target_ports {
                    println!("📡 DataBus: Forwarding data {}.{} -> {}.{}", 
                            from_port.node_id, from_port.port_name,
                            target_port.node_id, target_port.port_name);
                    
                    // 通知订阅者数据可用
                    if let Some(subscribers) = self.subscribers.get(target_port) {
                        for subscriber in subscribers {
                            subscriber.do_send(DataAvailableMessage {
                                from_node: from_port.node_id.clone(),
                                from_port: from_port.port_name.clone(),
                                to_node: target_port.node_id.clone(),
                                to_port: target_port.port_name.clone(),
                                value: value.clone(),
                            });
                        }
                    }
                }
            }
            
            // 查找控制连接并转发控制信号
            if let Some(target_ports) = self.control_connections.get(&from_port) {
                for target_port in target_ports {
                    println!("🎮 DataBus: Forwarding control {}.{} -> {}.{}", 
                            from_port.node_id, from_port.port_name,
                            target_port.node_id, target_port.port_name);
                    
                    // 通知订阅者控制信号可用
                    if let Some(subscribers) = self.subscribers.get(target_port) {
                        for subscriber in subscribers {
                            subscriber.do_send(ControlSignalMessage {
                                from_node: from_port.node_id.clone(),
                                from_port: from_port.port_name.clone(),
                                to_node: target_port.node_id.clone(),
                                to_port: target_port.port_name.clone(),
                                signal: value.clone(),
                            });
                        }
                    }
                }
            }
        }
    }
}

/// 处理订阅数据消息
impl Handler<SubscribeDataMessage> for DataBusActor {
    type Result = ();
    
    fn handle(&mut self, msg: SubscribeDataMessage, _ctx: &mut Self::Context) {
        let port_ref = PortRef::new(msg.node_id, msg.port_name);
        
        self.subscribers
            .entry(port_ref)
            .or_insert_with(Vec::new)
            .push(msg.subscriber);
    }
} 