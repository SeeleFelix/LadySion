use std::collections::HashMap;

use crate::graph::PortRef;
use crate::label::SemanticLabel;

pub type NodeName = String;
pub type PortName = String;
pub type NodeType = String;

/// 节点输入数据集合 - 端口到语义标签的映射
pub type NodeDataInputs = HashMap<PortRef, Box<dyn SemanticLabel>>;
/// 节点输出数据集合 - 端口到语义标签的映射
pub type NodeDataOutputs = HashMap<PortRef, Box<dyn SemanticLabel>>;
