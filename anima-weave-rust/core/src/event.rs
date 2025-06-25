use crate::{Port, DynamicLabel};

/// 事件trait - 数据事件和控制事件的抽象
pub trait Event {
    fn port(&self) -> &Port;
    fn from_node(&self) -> &str;
}

/// 数据事件
#[derive(Debug, Clone)]
pub struct DataEvent {
    pub port: Port,
    pub value: Box<dyn DynamicLabel>,
    pub from_node: String,
}

/// 控制事件
#[derive(Debug, Clone)]
pub struct ControlEvent {
    pub port: Port,
    pub signal: ControlSignal,
    pub from_node: String,
}

/// 控制信号
#[derive(Debug, Clone, PartialEq)]
pub enum ControlSignal {
    Active,
    Inactive,
    NoInput,
}

impl Event for DataEvent {
    fn port(&self) -> &Port {
        &self.port
    }
    
    fn from_node(&self) -> &str {
        &self.from_node
    }
}

impl Event for ControlEvent {
    fn port(&self) -> &Port {
        &self.port
    }
    
    fn from_node(&self) -> &str {
        &self.from_node
    }
} 