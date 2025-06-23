//! Registry system for global vessel management
//! 
//! This module provides the registry trait that manages the global
//! collection of vessels and enables resource resolution across
//! the entire AnimaWeave system.

use std::collections::HashMap;
use crate::{Vessel, Node, SemanticLabel, Converter};

/// Core trait for vessel registry implementations
/// 
/// The registry serves as the global manager for all vessels in the
/// AnimaWeave system. It provides vessel discovery, resource resolution,
/// and system-wide coordination.
/// 
/// # Design Decision: Registry Only Manages Vessels
/// 
/// **Simplified Responsibility:**
/// The registry only tracks and manages vessels themselves, not individual
/// nodes or labels. All resource resolution follows the pattern:
/// 1. Parse resource identifier (e.g., "vessel.node")
/// 2. Look up vessel by name
/// 3. Delegate to vessel for specific resource
/// 
/// **Benefits:**
/// - Clear separation of concerns
/// - Vessels maintain their own internal organization
/// - Registry logic stays simple and focused
/// - Easy to reason about system structure
/// 
/// **Resource Resolution Flow:**
/// ```
/// "basic.add_numbers" → registry.get_vessel("basic") → vessel.get_node("add_numbers")
/// "math.complex"      → registry.get_vessel("math")  → vessel.create_label("complex")
/// ```
/// 
/// # Implementation Pattern
/// ```rust
/// struct DefaultRegistry {
///     vessels: HashMap<String, Box<dyn Vessel>>,
/// }
/// 
/// impl Registry for DefaultRegistry {
///     fn register_vessel(&mut self, vessel: Box<dyn Vessel>) -> Result<(), String> {
///         let name = vessel.vessel_name().to_string();
///         self.vessels.insert(name, vessel);
///         Ok(())
///     }
///     
///     fn get_vessel(&self, name: &str) -> Option<&dyn Vessel> {
///         self.vessels.get(name).map(|v| v.as_ref())
///     }
/// }
/// ```
pub trait Registry: Send + Sync {
    /// Register a new vessel in the system
    /// 
    /// Adds a vessel to the global registry, making its resources
    /// available for resolution. Vessel names must be unique.
    /// 
    /// # Parameters
    /// - `vessel`: The vessel to register (ownership transferred)
    /// 
    /// # Returns
    /// - `Ok(())` if registration succeeds
    /// - `Err(reason)` if registration fails (e.g., name conflict)
    fn register_vessel(&mut self, vessel: Box<dyn Vessel>) -> Result<(), String>;
    
    /// Get a vessel by name
    /// 
    /// Looks up a vessel in the global registry by its name.
    /// This is the primary method for vessel resolution.
    /// 
    /// # Parameters
    /// - `name`: The vessel name to look up
    /// 
    /// # Returns
    /// - `Some(vessel)` if found
    /// - `None` if not found
    fn get_vessel(&self, name: &str) -> Option<&dyn Vessel>;
    
    /// List all registered vessel names
    /// 
    /// Returns the names of all vessels currently registered
    /// in the system. Useful for discovery and debugging.
    fn list_vessels(&self) -> Vec<String>;
    
    /// Resolve a node by full path
    /// 
    /// Resolves a node using the vessel.node format.
    /// This is a convenience method that combines vessel lookup
    /// with node resolution.
    /// 
    /// # Parameters
    /// - `path`: Full path in format "vessel_name.node_name"
    /// 
    /// # Returns
    /// - `Some(node)` if both vessel and node are found
    /// - `None` if vessel doesn't exist or node not found in vessel
    /// 
    /// # Example
    /// ```rust
    /// let node = registry.resolve_node("basic.add_numbers");
    /// ```
    fn resolve_node(&self, path: &str) -> Option<&dyn Node> {
        let parts: Vec<&str> = path.splitn(2, '.').collect();
        if parts.len() != 2 {
            return None;
        }
        
        let (vessel_name, node_name) = (parts[0], parts[1]);
        self.get_vessel(vessel_name)?.get_node(node_name)
    }
    
    /// Create a semantic label by full path
    /// 
    /// Creates a new semantic label instance using the vessel.label format.
    /// This is a convenience method that combines vessel lookup with
    /// label creation.
    /// 
    /// # Parameters
    /// - `path`: Full path in format "vessel_name.label_type"
    /// 
    /// # Returns
    /// - `Some(label)` if both vessel and label type are found
    /// - `None` if vessel doesn't exist or label type not found in vessel
    /// 
    /// # Example
    /// ```rust
    /// let label = registry.create_label("math.complex");
    /// ```
    fn create_label(&self, path: &str) -> Option<Box<dyn SemanticLabel>> {
        let parts: Vec<&str> = path.splitn(2, '.').collect();
        if parts.len() != 2 {
            return None;
        }
        
        let (_vessel_name, _label_type) = (parts[0], parts[1]);
        // TODO: Implement create_label in vessel trait
        None
    }
    
    /// Get all converters from all vessels
    /// 
    /// Collects and returns all converters provided by all registered
    /// vessels. Used for building the global conversion system.
    fn get_all_converters(&self) -> Vec<&dyn Converter> {
        let converters = Vec::new();
        for vessel_name in self.list_vessels() {
            if let Some(_vessel) = self.get_vessel(&vessel_name) {
                // TODO: Get converters from vessel
                // for converter in vessel.converters() {
                //     converters.push(converter.as_ref());
                // }
            }
        }
        converters
    }
    
    /// Get comprehensive system information
    /// 
    /// Returns detailed information about all vessels and their
    /// resources. Useful for system introspection and debugging.
    fn system_info(&self) -> HashMap<String, HashMap<String, Vec<String>>> {
        let mut info = HashMap::new();
        
        for vessel_name in self.list_vessels() {
            if let Some(_vessel) = self.get_vessel(&vessel_name) {
                // TODO: Get resources from vessel
                info.insert(vessel_name, HashMap::new());
            }
        }
        
        info
    }
    
    /// Validate the entire registry
    /// 
    /// Performs system-wide validation including:
    /// - Individual vessel validation
    /// - Name conflict detection
    /// - Dependency checking (if applicable)
    /// 
    /// # Returns
    /// - `Ok(())` if the entire system is valid
    /// - `Err(reason)` if validation fails
    fn validate_system(&self) -> Result<(), String> {
        // Validate each vessel individually
        for vessel_name in self.list_vessels() {
            if let Some(vessel) = self.get_vessel(&vessel_name) {
                vessel.validate().map_err(|e| {
                    format!("Vessel '{}' validation failed: {:?}", vessel_name, e)
                })?;
            }
        }
        
        // Check for vessel name uniqueness (should be guaranteed by registration)
        let vessel_names = self.list_vessels();
        let unique_names: std::collections::HashSet<_> = vessel_names.iter().collect();
        if vessel_names.len() != unique_names.len() {
            return Err("Duplicate vessel names detected".to_string());
        }
        
        Ok(())
    }
    
    /// Search for resources matching a pattern
    /// 
    /// Searches across all vessels for resources (nodes, labels, converters)
    /// that match the given pattern. Useful for discovery and auto-completion.
    /// 
    /// # Parameters
    /// - `pattern`: Search pattern (supports wildcards like "*", "basic.*", etc.)
    /// 
    /// # Returns
    /// List of full resource paths that match the pattern
    fn search_resources(&self, pattern: &str) -> Vec<String> {
        let mut matches = Vec::new();
        
        for vessel_name in self.list_vessels() {
            if let Some(_vessel) = self.get_vessel(&vessel_name) {
                // Search nodes
                // TODO: Get nodes from vessel
                for node_name in Vec::<String>::new() {
                    let full_path = format!("{}.{}", vessel_name, node_name);
                    if self.matches_pattern(&full_path, pattern) {
                        matches.push(full_path);
                    }
                }
                
                // Search labels
                // TODO: Get labels from vessel  
                for label_name in Vec::<String>::new() {
                    let full_path = format!("{}.{}", vessel_name, label_name);
                    if self.matches_pattern(&full_path, pattern) {
                        matches.push(full_path);
                    }
                }
            }
        }
        
        matches.sort();
        matches
    }
    
    /// Simple pattern matching helper
    /// 
    /// Basic wildcard pattern matching for resource search.
    /// Supports "*" as wildcard character.
    fn matches_pattern(&self, text: &str, pattern: &str) -> bool {
        if pattern == "*" {
            return true;
        }
        
        if pattern.ends_with('*') {
            let prefix = &pattern[..pattern.len() - 1];
            return text.starts_with(prefix);
        }
        
        if pattern.starts_with('*') {
            let suffix = &pattern[1..];
            return text.ends_with(suffix);
        }
        
        text == pattern
    }
} 