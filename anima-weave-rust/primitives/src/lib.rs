//! # Anima Core
//! 
//! Core trait definitions for the AnimaWeave graph execution system.
//! 
//! This crate contains only trait definitions with zero dependencies.
//! All implementations are provided by higher-level crates.

pub mod error;
pub mod label;
pub mod converter;
pub mod port;
pub mod node;
pub mod vessel;
pub mod registry;

pub use error::AnimaError;
pub use label::SemanticLabel;
pub use converter::Converter;
pub use port::{PortDefinition, PortCollection};
pub use node::{Node, NodeExecution};
pub use vessel::Vessel;
pub use registry::Registry; 