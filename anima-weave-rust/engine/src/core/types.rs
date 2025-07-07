use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use crate::core::graph::PortRef;
use crate::core::label::SemanticLabel;
use crate::core::signal::SignalLabel;

pub type NodeName = String;
pub type PortName = String; 
pub type NodeType = String;

/// 节点输入数据集合 - 端口到语义标签的映射
pub type NodeDataInputs  = HashMap<PortRef, Box<dyn SemanticLabel>>;
/// 节点输出数据集合 - 端口到语义标签的映射
pub type NodeDataOutputs = HashMap<PortRef, Box<dyn SemanticLabel>>;

/// 节点输入数据集合 - 端口到语义标签的映射
pub type NodeControlInputs  = HashMap<PortRef, Vec<SignalLabel>>;
/// 节点输出数据集合 - 端口到语义标签的映射
pub type NodeControlOutputs = HashMap<PortRef, SignalLabel>;

/// 激活模式 - 定义控制信号如何聚合
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ActivationMode {
    AND,
    OR,
    XOR,
}
