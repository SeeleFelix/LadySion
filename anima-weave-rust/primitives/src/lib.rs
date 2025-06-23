//! # Anima Core
//!
//! Core trait definitions for the AnimaWeave graph execution system.
//!
//! This crate contains only trait definitions with zero dependencies.
//! All implementations are provided by higher-level crates.

pub mod converter;
pub mod error;
pub mod label;
pub mod node;
pub mod port;
pub mod registry;
pub mod vessel;

pub use converter::Converter;
pub use error::AnimaError;
pub use label::SemanticLabel;
pub use node::{Node, NodeExecution};
pub use port::{PortCollection, PortDefinition};
pub use registry::Registry;
pub use vessel::Vessel;
