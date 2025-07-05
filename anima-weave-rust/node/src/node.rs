//! Node trait and metadata structures

use anima_weave_core::{AnimaWeaveError, NodeDataInputs, NodeDataOutputs};
use std::fmt::Debug;

#[derive(Debug, Clone)]
pub struct NodeInfo {
    pub name: &'static str,
    pub description: &'static str,
    pub input_ports: Vec<PortDef>,
    pub output_ports: Vec<PortDef>,
}

#[derive(Debug, Clone)]
pub enum PortType {
    /// 数据端口，可以是任意SemanticLabel类型
    Data { semantic_label: &'static str },
    /// 控制端口，固定是SignalLabel
    Control,
}

impl std::fmt::Display for PortType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PortType::Data { semantic_label } => write!(f, "Data({})", semantic_label),
            PortType::Control => write!(f, "Control"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct PortDef {
    pub name: &'static str,
    pub port_type: PortType,
    pub required: bool,
}

impl PortDef {
    pub fn required_data(name: &'static str, semantic_label: &'static str) -> Self {
        Self {
            name,
            port_type: PortType::Data { semantic_label },
            required: true,
        }
    }

    pub fn required_control(name: &'static str) -> Self {
        Self {
            name,
            port_type: PortType::Control,
            required: true,
        }
    }

    pub fn optional_data(name: &'static str, semantic_label: &'static str) -> Self {
        Self {
            name,
            port_type: PortType::Data { semantic_label },
            required: false,
        }
    }

    pub fn optional_control(name: &'static str) -> Self {
        Self {
            name,
            port_type: PortType::Control,
            required: false,
        }
    }

    pub fn output_data(name: &'static str, semantic_label: &'static str) -> Self {
        Self {
            name,
            port_type: PortType::Data { semantic_label },
            required: false,
        }
    }

    pub fn output_control(name: &'static str) -> Self {
        Self {
            name,
            port_type: PortType::Control,
            required: false,
        }
    }
}

/// Node execution interface
pub trait Node: Send + Sync + Debug {
    fn info(&self) -> &'static NodeInfo;
    fn execute(&self, inputs: &NodeDataInputs) -> Result<NodeDataOutputs, AnimaWeaveError>;

    fn node_type(&self) -> &'static str {
        self.info().name
    }
}
