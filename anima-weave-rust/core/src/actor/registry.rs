//! NodeActorRegistry - Coordinator 用来查找 NodeActor 的收件人
//!
//! 简单 HashMap 实现，映射 NodeName → Recipient<NodeExecuteEvent>

use crate::{event::NodeExecuteEvent, types::NodeName};
use kameo::actor::Recipient;
use std::collections::HashMap;

#[derive(Default, Debug)]
pub struct NodeRegistry {
    map: HashMap<NodeName, Recipient<NodeExecuteEvent>>,
}

impl NodeRegistry {
    /// 创建空注册表
    pub fn new() -> Self {
        Self { map: HashMap::new() }
    }

    /// 注册节点 Actor 收件人
    pub fn register(&mut self, node_name: impl Into<NodeName>, recipient: Recipient<NodeExecuteEvent>) {
        self.map.insert(node_name.into(), recipient);
    }

    /// 获取节点 Actor 收件人
    pub fn lookup(&self, node_name: &NodeName) -> Option<Recipient<NodeExecuteEvent>> {
        self.map.get(node_name).cloned()
    }

    /// 判断节点是否已注册
    pub fn contains(&self, node_name: &NodeName) -> bool {
        self.map.contains_key(node_name)
    }

    /// 当前已注册节点数量
    pub fn len(&self) -> usize {
        self.map.len()
    }
} 