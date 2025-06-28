use super::types::{EventMeta, PortRef};
use crate::SemanticLabel;

/// 数据事件 - 纯数据载体
///
/// 职责：
/// - 只传递数据，不关心目标
/// - 由DataBus处理路由和转换
/// - 不包含转换逻辑
#[derive(Debug)]
pub struct DataEvent {
    /// 事件元数据
    pub meta: EventMeta,
    /// 数据源端口
    pub source_port: PortRef,
    /// 语义标签数据
    pub data: Box<dyn SemanticLabel>,
}

impl DataEvent {
    /// 创建新的数据事件
    pub fn new(source_port: PortRef, data: Box<dyn SemanticLabel>) -> Self {
        Self {
            meta: EventMeta::new(),
            source_port,
            data,
        }
    }

    /// 创建带源信息的数据事件
    pub fn with_source(
        source: impl Into<String>,
        source_port: PortRef,
        data: Box<dyn SemanticLabel>,
    ) -> Self {
        Self {
            meta: EventMeta::with_source(source),
            source_port,
            data,
        }
    }

    /// 获取数据类型名称
    pub fn data_type(&self) -> &'static str {
        self.data.get_semantic_label_type()
    }

    /// 获取事件ID
    pub fn event_id(&self) -> &str {
        &self.meta.event_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::SignalLabel;

    #[test]
    fn test_data_event_creation() {
        let port_ref = PortRef::new("node1", "output");
        let signal = SignalLabel::active();
        let data_event = DataEvent::new(port_ref.clone(), Box::new(signal));

        assert_eq!(data_event.source_port, port_ref);
        assert_eq!(data_event.data_type(), "SignalLabel");
        assert!(!data_event.event_id().is_empty());
        assert!(data_event.meta.source.is_none());
    }

    #[test]
    fn test_data_event_with_source() {
        let port_ref = PortRef::new("node1", "output");
        let signal = SignalLabel::active();
        let data_event = DataEvent::with_source("coordinator", port_ref.clone(), Box::new(signal));

        assert_eq!(data_event.source_port, port_ref);
        assert_eq!(data_event.data_type(), "SignalLabel");
        assert!(!data_event.event_id().is_empty());
        assert_eq!(data_event.meta.source, Some("coordinator".to_string()));
    }

    #[test]
    fn test_data_event_with_different_types() {
        let port_ref = PortRef::new("test_node", "data_out");

        // 测试不同类型的数据
        let signal_data = DataEvent::new(port_ref.clone(), Box::new(SignalLabel::active()));
        assert_eq!(signal_data.data_type(), "SignalLabel");

        // 可以添加更多类型测试当有更多标签类型时
    }

    #[test]
    fn test_data_event_unique_ids() {
        let port_ref = PortRef::new("test_node", "data_out");
        let event1 = DataEvent::new(port_ref.clone(), Box::new(SignalLabel::active()));
        let event2 = DataEvent::new(port_ref, Box::new(SignalLabel::inactive()));

        // 两个事件应该有不同的ID
        assert_ne!(event1.event_id(), event2.event_id());
    }
}
