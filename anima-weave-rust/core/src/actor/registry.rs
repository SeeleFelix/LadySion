//! NodeActorRegistry - Coordinator 用来查找 NodeActor 的收件人
//!
//! 简单 HashMap 实现，映射 NodeName → Recipient<NodeExecuteEvent>

use crate::{event::NodeExecuteEvent, types::NodeName};
use kameo::actor::Recipient;
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug)]
pub struct NodeRegistry {
    inner: Mutex<HashMap<NodeName, Recipient<NodeExecuteEvent>>>,
}

impl NodeRegistry {
    /// 创建空注册表
    pub fn new() -> Self {
        Self { inner: Mutex::new(HashMap::new()) }
    }

    /// 注册节点 Actor 收件人，若重名则返回Err
    pub fn register(&self, node_name: impl Into<NodeName>, recipient: Recipient<NodeExecuteEvent>) -> Result<(), String> {
        let node_name = node_name.into();
        let mut map = self.inner.lock().unwrap();
        if map.contains_key(&node_name) {
            return Err(format!("Node name '{}' already registered", node_name));
        }
        map.insert(node_name, recipient);
        Ok(())
    }

    /// 获取节点 Actor 收件人
    pub fn lookup(&self, node_name: &NodeName) -> Option<Recipient<NodeExecuteEvent>> {
        let map = self.inner.lock().unwrap();
        map.get(node_name).cloned()
    }

    /// 判断节点是否已注册
    pub fn contains(&self, node_name: &NodeName) -> bool {
        let map = self.inner.lock().unwrap();
        map.contains_key(node_name)
    }

    /// 当前已注册节点数量
    pub fn len(&self) -> usize {
        let map = self.inner.lock().unwrap();
        map.len()
    }
}

impl Default for NodeRegistry {
    fn default() -> Self {
        Self::new()
    }
} 