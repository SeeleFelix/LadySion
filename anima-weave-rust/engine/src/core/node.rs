use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use crate::core::types::{NodeName, PortName};

// Re-exporting from graph for convenience

// Using a simple alias for now. We can introduce a proper Label system later.
pub type Label = String; 
pub type NodeData = HashMap<PortName, Label>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PortType {
    Data(Label),
    Control,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortDef {
    pub name: PortName,
    pub port_type: PortType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeInfo {
    pub name: NodeName,
    pub description: String,
    pub inputs: Vec<PortDef>,
    pub outputs: Vec<PortDef>,
}

/// The fundamental trait that all executable nodes must implement.
///
/// This trait is the contract for what it means to be a "computation unit" in AnimaWeave.
pub trait Node: Send + Sync {
    /// Returns static information about the node.
    /// This is used by the builder to understand the node's capabilities.
    fn info(&self) -> &NodeInfo;

    /// Executes the node's logic.
    ///
    /// # Arguments
    /// * `inputs` - A map where keys are input port names and values are the data.
    ///
    /// # Returns
    /// A result containing a map of output port names to their resulting data,
    /// or an error if the execution fails.
    fn execute(&self, inputs: &NodeData) -> Result<NodeData, anyhow::Error>;
}
