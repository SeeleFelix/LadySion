use crate::event::DataMessage;
use crate::label::SemanticLabel;
use crate::types::{ExecutionId, NodeName, PortRef};
use kameo::actor::ActorRef;
use std::collections::HashMap;
use std::sync::Arc;

use super::node_actor::NodeActor;

/// 消息路由组件 - 负责向下游发送数据
#[derive(Debug)]
pub struct MessageRouter {
    node_name: NodeName,
    port_mappings: HashMap<PortRef, Vec<(ActorRef<NodeActor>, PortRef)>>,
}

impl MessageRouter {
    pub fn new(node_name: NodeName, port_mappings: HashMap<PortRef, Vec<(ActorRef<NodeActor>, PortRef)>>) -> Self {
        Self {
            node_name,
            port_mappings,
        }
    }

    /// 路由输出到下游节点
    pub async fn route_outputs(
        &self,
        outputs: HashMap<PortRef, Vec<Arc<dyn SemanticLabel>>>,
        execution_id: ExecutionId,
    ) {
        for (port, data_list) in outputs {
            self.send_data_to_downstream(port, data_list, execution_id.clone()).await;
        }
    }

    /// 发送数据到下游节点
    async fn send_data_to_downstream(
        &self,
        from_port: PortRef,
        data_list: Vec<Arc<dyn SemanticLabel>>,
        execution_id: ExecutionId,
    ) {
        if let Some(connections) = self.port_mappings.get(&from_port) {
            for (downstream_actor, to_port) in connections {
                for data in &data_list {
                    let message = DataMessage {
                        from_node: self.node_name.clone(),
                        from_port: from_port.clone(),
                        to_node: "unknown".to_string(),
                        to_port: to_port.clone(),
                        data: data.clone(),
                        execution_id: execution_id.clone(),
                    };

                    let _ = downstream_actor.tell(message).await;
                }
            }
        }
    }



    /// 获取连接数量
    pub fn get_connection_count(&self) -> usize {
        self.port_mappings.len()
    }

    /// 更新端口映射
    pub fn update_port_mappings(&mut self, new_mappings: HashMap<PortRef, Vec<(ActorRef<NodeActor>, PortRef)>>) {
        self.port_mappings = new_mappings;
    }
} 
