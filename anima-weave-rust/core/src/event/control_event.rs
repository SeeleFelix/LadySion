use super::types::{EventMeta, PortRef};
use crate::SignalLabel;

/// 控制事件 - 纯控制信号
///
/// 职责：
/// - 传递激活/非激活信号
/// - 使用具体SignalLabel类型
/// - 由CoordinatorActor处理
#[derive(Debug)]
pub struct ControlEvent {
    /// 事件元数据
    pub meta: EventMeta,
    /// 信号源端口
    pub source_port: PortRef,
    /// 控制信号
    pub signal: SignalLabel,
}

impl ControlEvent {
    /// 创建新的控制事件
    pub fn new(source_port: PortRef, signal: SignalLabel) -> Self {
        Self {
            meta: EventMeta::new(),
            source_port,
            signal,
        }
    }

    /// 创建带源信息的控制事件
    pub fn with_source(
        source: impl Into<String>,
        source_port: PortRef,
        signal: SignalLabel,
    ) -> Self {
        Self {
            meta: EventMeta::with_source(source),
            source_port,
            signal,
        }
    }

    /// 创建激活信号事件
    pub fn active(source_port: PortRef) -> Self {
        Self::new(source_port, SignalLabel::active())
    }

    /// 创建非激活信号事件
    pub fn inactive(source_port: PortRef) -> Self {
        Self::new(source_port, SignalLabel::inactive())
    }

    /// 检查信号是否为激活状态
    pub fn is_active(&self) -> bool {
        self.signal.is_active()
    }

    /// 检查信号是否为非激活状态
    pub fn is_inactive(&self) -> bool {
        self.signal.is_inactive()
    }

    /// 获取事件ID
    pub fn event_id(&self) -> &str {
        &self.meta.event_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_control_event_active() {
        let port_ref = PortRef::new("node1", "control");
        let control_event = ControlEvent::active(port_ref.clone());

        assert_eq!(control_event.source_port, port_ref);
        assert!(control_event.is_active());
        assert!(!control_event.is_inactive());
        assert!(!control_event.event_id().is_empty());
        assert!(control_event.meta.source.is_none());
    }

    #[test]
    fn test_control_event_inactive() {
        let port_ref = PortRef::new("node1", "control");
        let control_event = ControlEvent::inactive(port_ref.clone());

        assert_eq!(control_event.source_port, port_ref);
        assert!(!control_event.is_active());
        assert!(control_event.is_inactive());
        assert!(!control_event.event_id().is_empty());
    }

    #[test]
    fn test_control_event_with_custom_signal() {
        let port_ref = PortRef::new("test_node", "ctrl_port");
        let custom_signal = SignalLabel::active();
        let control_event = ControlEvent::new(port_ref.clone(), custom_signal);

        assert_eq!(control_event.source_port, port_ref);
        assert!(control_event.is_active());
        assert!(!control_event.event_id().is_empty());
    }

    #[test]
    fn test_control_event_with_source() {
        let port_ref = PortRef::new("test_node", "ctrl_port");
        let control_event =
            ControlEvent::with_source("data_bus", port_ref.clone(), SignalLabel::active());

        assert_eq!(control_event.source_port, port_ref);
        assert!(control_event.is_active());
        assert!(!control_event.event_id().is_empty());
        assert_eq!(control_event.meta.source, Some("data_bus".to_string()));
    }

    #[test]
    fn test_control_event_unique_ids() {
        let port_ref = PortRef::new("test_node", "ctrl_port");
        let event1 = ControlEvent::active(port_ref.clone());
        let event2 = ControlEvent::inactive(port_ref);

        // 两个事件应该有不同的ID
        assert_ne!(event1.event_id(), event2.event_id());
    }
}
