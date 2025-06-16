// AnimaWeave Actor消息定义

use actix::{Message, Addr};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use crate::{GraphDefinition, PluginRegistry, NodeOutputs, NodeInputs, NodeSpec};

/// 图执行消息
#[derive(Message, Clone)]
#[rtype(result = "Result<HashMap<String, NodeOutputs>, String>")]
pub struct ExecuteGraphMessage {
    pub graph: GraphDefinition,
    pub registry: PluginRegistry,
}

/// 节点唤醒消息
#[derive(Message, Clone)]
#[rtype(result = "Result<(), String>")]
pub struct AwakeNodeMessage {
    pub node_id: String,
    pub inputs: NodeInputs,
}

/// 节点完成消息
#[derive(Message, Clone)]
#[rtype(result = "()")]
pub struct NodeCompletedMessage {
    pub node_id: String,
    pub outputs: NodeOutputs,
}

/// 数据可用消息
#[derive(Message, Clone)]
#[rtype(result = "()")]
pub struct DataAvailableMessage {
    pub from_node: String,
    pub from_port: String,
    pub to_node: String,
    pub to_port: String,
    pub value: crate::TypedValue,
}

/// 控制信号消息
#[derive(Message, Clone)]
#[rtype(result = "()")]
pub struct ControlSignalMessage {
    pub from_node: String,
    pub from_port: String,
    pub to_node: String,
    pub to_port: String,
    pub signal: crate::TypedValue,
}

/// 注册节点Actor消息
#[derive(Message)]
#[rtype(result = "()")]
pub struct RegisterNodeActorMessage {
    pub node_id: String,
    pub actor_addr: Addr<crate::actor::NodeActor>,
}

/// 订阅数据消息
#[derive(Message)]
#[rtype(result = "()")]
pub struct SubscribeDataMessage {
    pub node_id: String,
    pub port_name: String,
    pub subscriber: Addr<crate::actor::NodeActor>,
}

/// 端口引用，用于标识特定节点的特定端口
#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub struct PortRef {
    pub node_id: String,
    pub port_name: String,
}

impl PortRef {
    pub fn new(node_id: String, port_name: String) -> Self {
        Self { node_id, port_name }
    }
} 