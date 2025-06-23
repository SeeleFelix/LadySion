//! Vessel system for organizing and managing nodes and labels
//! 
//! This module provides the vessel trait that serves as the primary
//! organizational unit for nodes, semantic labels, and converters
//! within the AnimaWeave system.

use std::collections::HashMap;
use crate::{Node, SemanticLabel, Converter};

/// Core trait for vessel implementations
/// 
/// A vessel serves as a namespace and organizational unit that groups
/// related nodes, semantic labels, and converters together. Vessels
/// are the primary unit of modularity in AnimaWeave.
/// 
/// # Design Decision: Vessel as Namespace
/// 
/// **Key Insight from Architecture Review:**
/// Vessels should be namespace containers where nodes and labels are
/// referenced as `vessel_name.node_name` and `vessel_name.label_name`.
/// The vessel manages its internal resources while the global registry
/// only manages vessels themselves.
/// 
/// **Benefits:**
/// - Clear namespace isolation preventing name conflicts
/// - Simplified global registry (only tracks vessels)
/// - Natural organization boundary for related functionality
/// - Easy to reason about dependencies and relationships
/// 
/// **Responsibilities:**
/// - Provide access to nodes, labels, and converters within the vessel
/// - Manage internal resource discovery and organization
/// - Handle vessel-level metadata and configuration
/// - Enable namespace-based resource resolution
/// 
/// # Resource Resolution Pattern
/// ```
/// basic.add_numbers    → vessel: "basic", node: "add_numbers"
/// math.complex.real    → vessel: "math", label: "complex.real"
/// io.file.reader      → vessel: "io", node: "file.reader"
/// ```
/// 
/// # Implementation Pattern
/// ```rust
/// struct MyVessel {
///     nodes: HashMap<String, Box<dyn Node>>,
///     labels: HashMap<String, fn() -> Box<dyn SemanticLabel>>,
///     converters: Vec<Box<dyn Converter>>,
/// }
/// 
/// impl Vessel for MyVessel {
///     fn vessel_name(&self) -> &'static str { "my_vessel" }
///     fn nodes(&self) -> &HashMap<String, Box<dyn Node>> { &self.nodes }
///     // ... other methods
/// }
/// ```
pub trait Vessel: Send + Sync {
    /// Get the unique name of this vessel
    /// 
    /// This serves as the namespace identifier for all resources within
    /// the vessel. Must be unique across all vessels in the system.
    /// Used for resource resolution (e.g., "vessel_name.node_name").
    fn vessel_name(&self) -> &'static str;
    
    /// Get all nodes provided by this vessel
    /// 
    /// Returns a map where keys are node names (local to this vessel)
    /// and values are the node implementations. Node names must be
    /// unique within the vessel.
    fn nodes(&self) -> &HashMap<String, Box<dyn Node>>;
    
    /// Get all semantic label constructors provided by this vessel
    /// 
    /// Returns a map where keys are label type names and values are
    /// functions that can create new instances of those labels.
    /// This enables dynamic label creation at runtime.
    fn semantic_labels(&self) -> &HashMap<String, fn() -> Box<dyn SemanticLabel>>;
    
    /// Get all converters provided by this vessel
    /// 
    /// Returns all type converters that this vessel provides.
    /// These converters will be registered globally and can be
    /// used for automatic type conversion throughout the system.
    fn converters(&self) -> &[Box<dyn Converter>];
    
    /// Find a node by name within this vessel
    /// 
    /// Convenience method for looking up specific nodes.
    /// Returns `None` if the node doesn't exist in this vessel.
    fn get_node(&self, name: &str) -> Option<&dyn Node> {
        self.nodes().get(name).map(|n| n.as_ref())
    }
    
    /// Create a semantic label instance by type name
    /// 
    /// This method creates a new instance of the specified label type
    /// if it's provided by this vessel. Returns `None` if the label
    /// type is not available.
    fn create_label(&self, label_type: &str) -> Option<Box<dyn SemanticLabel>> {
        self.semantic_labels().get(label_type).map(|constructor| constructor())
    }
    
    /// Get vessel metadata and information
    /// 
    /// Returns key-value pairs of metadata about this vessel.
    /// Useful for documentation, debugging, and runtime decisions.
    /// Examples:
    /// - "version": "1.0.0"
    /// - "description": "Basic mathematical operations"
    /// - "category": "math", "io", "control", etc.
    /// - "author": "AnimaWeave Team"
    fn metadata(&self) -> HashMap<String, String> {
        HashMap::new()
    }
    
    /// Get a human-readable description of this vessel
    /// 
    /// This should provide a concise description of what this vessel
    /// provides and its intended use cases.
    fn description(&self) -> String {
        format!("{} vessel", self.vessel_name())
    }
    
    /// Get the version of this vessel
    /// 
    /// Used for dependency management and compatibility checking.
    /// Should follow semantic versioning (e.g., "1.2.3").
    fn version(&self) -> &'static str {
        "1.0.0"
    }
    
    /// List all resource names provided by this vessel
    /// 
    /// Returns a complete inventory of all nodes, labels, and other
    /// resources provided by this vessel. Useful for introspection
    /// and debugging.
    fn list_resources(&self) -> HashMap<String, Vec<String>> {
        let mut resources = HashMap::new();
        
        resources.insert(
            "nodes".to_string(),
            self.nodes().keys().cloned().collect()
        );
        
        resources.insert(
            "labels".to_string(),
            self.semantic_labels().keys().cloned().collect()
        );
        
        resources.insert(
            "converters".to_string(),
            vec!["converters".to_string()] // Simplified for now
        );
        
        resources
    }
    
    /// Validate that this vessel is properly configured
    /// 
    /// Performs self-validation to ensure the vessel is in a valid state.
    /// This includes checking for duplicate names, invalid configurations,
    /// and other potential issues.
    fn validate(&self) -> Result<(), String> {
        // Check for empty vessel name
        if self.vessel_name().is_empty() {
            return Err("Vessel name cannot be empty".to_string());
        }
        
        // Check for node name conflicts with label names
        let node_names: std::collections::HashSet<_> = self.nodes().keys().collect();
        let label_names: std::collections::HashSet<_> = self.semantic_labels().keys().collect();
        
        for name in node_names.intersection(&label_names) {
            return Err(format!("Name conflict: '{}' is used for both a node and a label", name));
        }
        
        Ok(())
    }
} 