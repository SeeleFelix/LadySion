use crate::types::{NodeName, PortName};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::SystemTime;

/// 全局事件计数器，用于生成唯一的事件ID
static EVENT_COUNTER: AtomicU64 = AtomicU64::new(1);

/// 事件元数据 - 所有事件共享的基础信息
///
/// 用于调试、追踪、日志记录等
#[derive(Debug, Clone)]
pub struct EventMeta {
    /// 事件唯一ID（计数器+时间戳）
    pub event_id: String,
    /// 事件创建时间
    pub timestamp: SystemTime,
    /// 事件源信息（可选，用于调试）
    pub source: Option<String>,
}

impl EventMeta {
    /// 创建新的事件元数据
    pub fn new() -> Self {
        let counter = EVENT_COUNTER.fetch_add(1, Ordering::SeqCst);
        let timestamp = SystemTime::now();
        let nanos = timestamp
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos();

        Self {
            event_id: format!("evt_{:06}_{:09}", counter, nanos),
            timestamp,
            source: None,
        }
    }

    /// 创建带源信息的事件元数据
    pub fn with_source(source: impl Into<String>) -> Self {
        let mut meta = Self::new();
        meta.source = Some(source.into());
        meta
    }

    /// 获取事件年龄（从创建到现在的时间）
    pub fn age(&self) -> Option<std::time::Duration> {
        SystemTime::now().duration_since(self.timestamp).ok()
    }
}

impl Default for EventMeta {
    fn default() -> Self {
        Self::new()
    }
}

/// 端口引用 - 标识图中的特定端口
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct PortRef {
    /// 节点名称（图中唯一标识）
    pub node_name: String,
    /// 端口名称
    pub port_name: String,
}

impl PortRef {
    pub fn new(node_name: impl Into<NodeName>, port_name: impl Into<PortName>) -> Self {
        Self {
            node_name: node_name.into(),
            port_name: port_name.into(),
        }
    }
}

/// 节点执行状态
#[derive(Debug, Clone, PartialEq)]
pub enum NodeStatus {
    /// 等待执行
    Pending,
    /// 正在执行
    Running,
    /// 执行完成
    Completed,
    /// 执行失败
    Failed(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use std::time::Duration;

    #[test]
    fn test_event_meta_creation() {
        let meta = EventMeta::new();
        assert!(!meta.event_id.is_empty());
        assert!(meta.source.is_none());

        // 事件ID应该以evt_开头
        assert!(meta.event_id.starts_with("evt_"));
    }

    #[test]
    fn test_event_meta_unique_ids() {
        let meta1 = EventMeta::new();
        let meta2 = EventMeta::new();

        // 两个事件ID应该不同
        assert_ne!(meta1.event_id, meta2.event_id);
    }

    #[test]
    fn test_event_meta_with_source() {
        let meta = EventMeta::with_source("test_coordinator");
        assert!(!meta.event_id.is_empty());
        assert_eq!(meta.source, Some("test_coordinator".to_string()));
    }

    #[test]
    fn test_event_meta_age() {
        let meta = EventMeta::new();

        // 立即检查应该年龄很小
        let age = meta.age().unwrap();
        assert!(age.as_millis() < 100);

        // 等待一下再检查
        thread::sleep(Duration::from_millis(10));
        let age2 = meta.age().unwrap();
        assert!(age2 > age);
    }

    #[test]
    fn test_event_meta_default() {
        let meta = EventMeta::default();
        assert!(!meta.event_id.is_empty());
        assert!(meta.source.is_none());
    }

    #[test]
    fn test_port_ref() {
        let port_ref = PortRef::new("node1", "output");
        assert_eq!(port_ref.node_name, "node1");
        assert_eq!(port_ref.port_name, "output");
    }

    #[test]
    fn test_port_ref_equality() {
        let port1 = PortRef::new("node1", "output");
        let port2 = PortRef::new("node1", "output");
        let port3 = PortRef::new("node2", "output");

        assert_eq!(port1, port2);
        assert_ne!(port1, port3);
    }

    #[test]
    fn test_node_status() {
        let pending = NodeStatus::Pending;
        let running = NodeStatus::Running;
        let completed = NodeStatus::Completed;
        let failed = NodeStatus::Failed("error".to_string());

        assert_eq!(pending, NodeStatus::Pending);
        assert_eq!(running, NodeStatus::Running);
        assert_eq!(completed, NodeStatus::Completed);

        match failed {
            NodeStatus::Failed(msg) => assert_eq!(msg, "error"),
            _ => panic!("应该是Failed状态"),
        }
    }
}
