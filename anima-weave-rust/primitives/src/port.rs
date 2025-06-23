//! Port system for defining node interfaces
//! 
//! This module provides the port definition system that allows nodes
//! to declare their input and output interfaces in a type-safe manner
//! while maintaining compatibility with dynamic dispatch.

use std::collections::HashMap;

/// Definition of a single input or output port
/// 
/// This trait represents the metadata and constraints for a port,
/// including its expected semantic label types and validation rules.
/// 
/// # Design Decision: Metadata vs Generics
/// 
/// We use string-based type identifiers rather than generic type parameters
/// to maintain compatibility with trait objects and enable runtime introspection.
/// This allows for dynamic graph validation and automatic type conversion.
/// 
/// # Implementation Pattern
/// ```rust
/// #[derive(Debug)]
/// struct NumberInputPort {
///     name: String,
///     required: bool,
/// }
/// 
/// impl PortDefinition for NumberInputPort {
///     fn port_name(&self) -> &str { &self.name }
///     fn expected_type(&self) -> &str { "Number" }
///     fn is_required(&self) -> bool { self.required }
/// }
/// ```
pub trait PortDefinition: Send + Sync {
    /// Get the name of this port
    /// 
    /// Port names must be unique within a node's input or output port collection.
    /// Used for connecting ports between nodes in the graph.
    fn port_name(&self) -> &str;
    
    /// Get the expected semantic label type for this port
    /// 
    /// This should match the `label_type()` returned by compatible semantic labels.
    /// Used for type validation and automatic conversion during graph execution.
    fn expected_type(&self) -> &str;
    
    /// Check if this port is required for node execution
    /// 
    /// Required ports must have data before the node can execute.
    /// Optional ports can be missing without preventing execution.
    fn is_required(&self) -> bool;
    
    /// Get a human-readable description of this port
    /// 
    /// This is primarily for debugging, documentation, and UI purposes.
    /// Should describe what this port represents and any constraints.
    fn description(&self) -> String {
        format!("{} ({}{})", 
            self.port_name(), 
            self.expected_type(),
            if self.is_required() { ", required" } else { ", optional" }
        )
    }
    
    /// Validate that a label type is acceptable for this port
    /// 
    /// By default, this checks for exact type match, but implementations
    /// can override to allow compatible types or conversions.
    fn accepts_type(&self, label_type: &str) -> bool {
        self.expected_type() == label_type
    }
}

/// Collection of port definitions for a node
/// 
/// This trait manages the complete interface specification for a node,
/// including both input and output ports. It provides methods for
/// introspection and validation.
/// 
/// # Design Decision: Trait vs Struct
/// 
/// We use a trait rather than a concrete struct to allow nodes maximum
/// flexibility in how they define and manage their ports. Some nodes might
/// compute ports dynamically, while others might use static definitions.
/// 
/// # Implementation Pattern
/// ```rust
/// struct MyNodePorts {
///     inputs: HashMap<String, Box<dyn PortDefinition>>,
///     outputs: HashMap<String, Box<dyn PortDefinition>>,
/// }
/// 
/// impl PortCollection for MyNodePorts {
///     fn input_ports(&self) -> &HashMap<String, Box<dyn PortDefinition>> {
///         &self.inputs
///     }
///     
///     fn output_ports(&self) -> &HashMap<String, Box<dyn PortDefinition>> {
///         &self.outputs
///     }
/// }
/// ```
pub trait PortCollection: Send + Sync {
    /// Get all input port definitions
    /// 
    /// The map key should match the port name returned by `port_name()`.
    /// Used for validating incoming connections and data.
    fn input_ports(&self) -> &HashMap<String, Box<dyn PortDefinition>>;
    
    /// Get all output port definitions
    /// 
    /// The map key should match the port name returned by `port_name()`.
    /// Used for validating outgoing connections and data types.
    fn output_ports(&self) -> &HashMap<String, Box<dyn PortDefinition>>;
    
    /// Find an input port by name
    /// 
    /// Convenience method for looking up specific input ports.
    fn get_input_port(&self, name: &str) -> Option<&dyn PortDefinition> {
        self.input_ports().get(name).map(|p| p.as_ref())
    }
    
    /// Find an output port by name
    /// 
    /// Convenience method for looking up specific output ports.
    fn get_output_port(&self, name: &str) -> Option<&dyn PortDefinition> {
        self.output_ports().get(name).map(|p| p.as_ref())
    }
    
    /// Check if all required input ports are satisfied
    /// 
    /// This method checks if all required input ports have been provided
    /// with data. Used before node execution to ensure prerequisites are met.
    fn validate_inputs(&self, available_inputs: &[&str]) -> Result<(), String> {
        for (name, port) in self.input_ports() {
            if port.is_required() && !available_inputs.contains(&name.as_str()) {
                return Err(format!("Required input port '{}' is missing", name));
            }
        }
        Ok(())
    }
    
    /// Get a summary of all ports for debugging
    /// 
    /// Returns a human-readable description of all input and output ports.
    fn describe_ports(&self) -> String {
        let mut result = String::new();
        
        result.push_str("Inputs:\n");
        for port in self.input_ports().values() {
            result.push_str(&format!("  {}\n", port.description()));
        }
        
        result.push_str("Outputs:\n");
        for port in self.output_ports().values() {
            result.push_str(&format!("  {}\n", port.description()));
        }
        
        result
    }
} 