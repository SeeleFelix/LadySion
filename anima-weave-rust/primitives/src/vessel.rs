//! Vessel system for organizing nodes

use crate::Node;
use std::collections::HashMap;

/// Vessel trait for grouping related nodes
///
/// Vessels provide namespace isolation for nodes using the pattern: `vessel_name.node_name`
///
/// # Example
/// ```rust
/// // Get a node from the "math" vessel
/// let node = vessel.get_node("add");
///
/// ```
pub trait Vessel: Send + Sync {
    /// Unique name of this vessel, used for namespace resolution
    fn vessel_name(&self) -> &'static str;

    /// All nodes provided by this vessel
    fn nodes(&self) -> &HashMap<String, Box<dyn Node>>;

    /// Get a node by name, returns None if not found
    fn get_node(&self, name: &str) -> Option<&dyn Node> {
        self.nodes().get(name).map(|n| n.as_ref())
    }

    /// Vessel metadata as key-value pairs
    fn metadata(&self) -> HashMap<String, String> {
        HashMap::new()
    }

    /// Human-readable description of this vessel
    fn description(&self) -> String {
        format!("{} vessel", self.vessel_name())
    }

    /// Vessel version (semantic versioning)
    fn version(&self) -> &'static str {
        "1.0.0"
    }
}
