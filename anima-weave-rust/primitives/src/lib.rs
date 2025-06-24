//! # Anima Core
//!
//! Core trait definitions for the AnimaWeave graph execution system.
//!
//! This crate contains only trait definitions with zero dependencies.
//! All implementations are provided by higher-level crates.

pub mod databus;
pub mod error;
pub mod label;
pub mod node;
pub mod port;
pub mod registry;
pub mod vessel;

// Re-export commonly used types and traits
pub use databus::DataBus;
pub use error::AnimaError;
pub use label::{SemanticLabel, LabelFactory, DynamicLabel};
pub use node::Node;
pub use registry::Registry;
pub use vessel::Vessel;
