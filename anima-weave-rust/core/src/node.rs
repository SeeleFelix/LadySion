use std::fmt::Debug;

use crate::types::{NodeDataInputs, NodeDataOutputs, PortName};

// Re-exporting from graph for convenience

/// 端口类型
#[derive(Debug, Clone)]
pub enum PortType {
    /// 数据端口，可以承载任意 SemanticLabel
    Data { semantic_label: &'static str },
}

impl std::fmt::Display for PortType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PortType::Data { semantic_label } => write!(f, "Data({})", semantic_label),
        }
    }
}

/// 端口定义
#[derive(Debug, Clone)]
pub struct PortDef {
    pub name: PortName,
    pub port_type: PortType,
    pub required: bool,
}

impl PortDef {
    pub fn required_data<T: crate::label::SemanticLabel>(name: &'static str) -> Self {
        Self {
            name: name.to_string(),
            port_type: PortType::Data {
                semantic_label: T::semantic_label_type(),
            },
            required: true,
        }
    }

    pub fn optional_data<T: crate::label::SemanticLabel>(name: &'static str) -> Self {
        Self {
            name: name.to_string(),
            port_type: PortType::Data {
                semantic_label: T::semantic_label_type(),
            },
            required: false,
        }
    }

    pub fn output_data<T: crate::label::SemanticLabel>(name: &'static str) -> Self {
        Self {
            name: name.to_string(),
            port_type: PortType::Data {
                semantic_label: T::semantic_label_type(),
            },
            required: true,
        }
    }
}

/// 节点静态信息
#[derive(Debug, Clone)]
pub struct NodeInfo {
    pub name: &'static str,
    pub description: &'static str,
    pub input_ports: Vec<PortDef>,
    pub output_ports: Vec<PortDef>,
}

/// 可执行节点接口
pub trait Node: Send + Sync + Debug {
    fn info(&self) -> &'static NodeInfo;

    fn execute(&self, inputs: NodeDataInputs) -> Result<NodeDataOutputs, anyhow::Error>;

    fn node_type(&self) -> &'static str {
        self.info().name
    }
}
