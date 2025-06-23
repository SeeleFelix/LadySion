//! Vessel system for organizing nodes, labels, and converters

use crate::{Converter, Node, SemanticLabel};
use std::collections::HashMap;

/// Vessel trait for grouping related nodes, labels, and converters
///
/// Vessels provide namespace isolation using the pattern: `vessel_name.resource_name`
///
/// # Example
/// ```rust
/// // Get a node from the "math" vessel
/// let node = vessel.get_node("add");
/// 
/// // Create a label instance
/// let label = vessel.create_label("Number");
/// 
/// // Convert between label types
/// let converted = vessel.convert_label(label, "Text");
/// ```
pub trait Vessel: Send + Sync {
    /// Unique name of this vessel, used for namespace resolution
    fn vessel_name(&self) -> &'static str;

    /// All nodes provided by this vessel
    fn nodes(&self) -> &HashMap<String, Box<dyn Node>>;

    /// All semantic label constructors provided by this vessel
    fn semantic_labels(&self) -> &HashMap<String, fn() -> Box<dyn SemanticLabel>>;

    /// All converters provided by this vessel  
    fn converters(&self) -> &[Box<dyn Converter>];

    /// Get a node by name, returns None if not found
    fn get_node(&self, name: &str) -> Option<&dyn Node> {
        self.nodes().get(name).map(|n| n.as_ref())
    }

    /// Create a new semantic label instance, returns None if type not supported
    fn create_label(&self, label_type: &str) -> Option<Box<dyn SemanticLabel>> {
        self.semantic_labels()
            .get(label_type)
            .map(|constructor| constructor())
    }

    /// Check if this vessel can convert between two label types
    fn can_convert(&self, from_type: &str, to_type: &str) -> bool;

    /// Convert a label to another type using this vessel's converters
    fn convert_label(&self, label: Box<dyn SemanticLabel>, target_type: &str) -> Result<Box<dyn SemanticLabel>, String>;

    /// List all supported label types
    fn supported_label_types(&self) -> Vec<String> {
        self.semantic_labels().keys().cloned().collect()
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
