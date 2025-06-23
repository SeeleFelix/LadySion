//! # Anima Registry - Compile-time Registration System
//!
//! This crate provides compile-time registration of vessels using the inventory crate.
//! All vessels are discovered at compile time for zero-cost lookup.

use primitives::*;
use std::collections::HashMap;

// ============================================================================
// Concrete Error Implementation
// ============================================================================

#[derive(Debug)]
pub enum RegistryError {
    VesselNotFound { name: String },
    NodeNotFound { full_name: String },
    LabelNotFound { full_name: String },
    ConverterNotFound { from: String, to: String },
    InvalidFullName { name: String },
    GraphValidationFailed { message: String },
}

impl std::fmt::Display for RegistryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RegistryError::VesselNotFound { name } => write!(f, "Vessel not found: {}", name),
            RegistryError::NodeNotFound { full_name } => write!(f, "Node not found: {}", full_name),
            RegistryError::LabelNotFound { full_name } => {
                write!(f, "Label not found: {}", full_name)
            }
            RegistryError::ConverterNotFound { from, to } => {
                write!(f, "Converter not found: {} -> {}", from, to)
            }
            RegistryError::InvalidFullName { name } => {
                write!(f, "Invalid full name format: {}", name)
            }
            RegistryError::GraphValidationFailed { message } => {
                write!(f, "Graph validation failed: {}", message)
            }
        }
    }
}

impl AnimaError for RegistryError {
    fn error_type(&self) -> &'static str {
        match self {
            RegistryError::VesselNotFound { .. } => "VESSEL_NOT_FOUND",
            RegistryError::NodeNotFound { .. } => "NODE_NOT_FOUND",
            RegistryError::LabelNotFound { .. } => "LABEL_NOT_FOUND",
            RegistryError::ConverterNotFound { .. } => "CONVERTER_NOT_FOUND",
            RegistryError::InvalidFullName { .. } => "INVALID_FULL_NAME",
            RegistryError::GraphValidationFailed { .. } => "GRAPH_VALIDATION_FAILED",
        }
    }
}

// ============================================================================
// Registration Structures
// ============================================================================

/// Vessel registration entry for compile-time discovery
pub struct VesselRegistration {
    pub name: &'static str,
    pub factory: fn() -> Box<dyn Vessel>,
}

// Submit vessels to inventory for compile-time discovery
inventory::collect!(VesselRegistration);

// ============================================================================
// Registry Implementation
// ============================================================================

pub struct DefaultRegistry {
    vessels: HashMap<String, Box<dyn Vessel>>,
}

impl DefaultRegistry {
    /// Create a new registry and load all registered vessels
    pub fn new() -> Self {
        let mut registry = Self {
            vessels: HashMap::new(),
        };

        // Load all vessels registered via inventory
        registry.load_vessels();
        registry
    }

    /// Get global registry instance (singleton pattern)
    pub fn global() -> &'static DefaultRegistry {
        use std::sync::OnceLock;
        static REGISTRY: OnceLock<DefaultRegistry> = OnceLock::new();
        REGISTRY.get_or_init(|| DefaultRegistry::new())
    }

    fn load_vessels(&mut self) {
        for registration in inventory::iter::<VesselRegistration> {
            let vessel = (registration.factory)();
            let name = vessel.vessel_name().to_string();
            self.vessels.insert(name, vessel);
        }
    }
}

impl Registry for DefaultRegistry {
    fn register_vessel(&mut self, vessel: Box<dyn Vessel>) -> Result<(), String> {
        let name = vessel.vessel_name().to_string();
        if self.vessels.contains_key(&name) {
            return Err(format!("Vessel '{}' already registered", name));
        }
        self.vessels.insert(name, vessel);
        Ok(())
    }

    fn get_vessel(&self, vessel_name: &str) -> Option<&dyn Vessel> {
        self.vessels.get(vessel_name).map(|v| v.as_ref())
    }

    fn list_vessels(&self) -> Vec<String> {
        self.vessels.keys().cloned().collect()
    }
}

// ============================================================================
// Convenience Macros
// ============================================================================

/// Register a vessel for compile-time discovery
#[macro_export]
macro_rules! register_vessel {
    ($name:expr, $factory:expr) => {
        inventory::submit! {
            VesselRegistration {
                name: $name,
                factory: $factory,
            }
        }
    };
}

// ============================================================================
// Re-exports
// ============================================================================

pub use inventory;
