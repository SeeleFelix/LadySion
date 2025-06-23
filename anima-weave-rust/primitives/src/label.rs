//! Semantic label system for type-safe data handling
//!
//! This module provides the semantic labeling system that enables
//! type-safe data flow between nodes while maintaining compatibility
//! with trait objects.

use std::any::Any;
use std::fmt;

/// Semantic label trait for type-safe data handling without generics
///
/// This trait represents a semantic label that can hold typed data while
/// being compatible with trait objects. The design deliberately avoids
/// generics to enable dynamic dispatch and storage in collections.
///
/// # Design Decision: No Generics
///
/// **Pros:**
/// - Compatible with trait objects (`Box<dyn SemanticLabel>`)
/// - Can be stored in collections without type parameters
/// - Enables dynamic dispatch for runtime flexibility
/// - Simpler vessel APIs without generic propagation
///
/// **Cons:**
/// - Runtime type checking via downcasting
/// - Slightly more verbose usage patterns
/// - Potential runtime panics if types don't match
///
/// **Alternative Considered:** Generic `SemanticLabel<T>`
/// Would provide compile-time type safety but prevent trait objects
/// and require generic parameters throughout the vessel system.
///
/// # Implementation Pattern
/// ```rust
/// #[derive(Debug, Clone)]
/// struct NumberLabel(f64);
///
/// impl SemanticLabel for NumberLabel {
///     fn label_type(&self) -> &'static str { "Number" }
///     fn as_any(&self) -> &dyn Any { self }
///     fn clone_boxed(&self) -> Box<dyn SemanticLabel> {
///         Box::new(self.clone())
///     }
/// }
/// ```
///
/// # Usage Pattern
/// ```rust
/// fn use_label(label: &dyn SemanticLabel) -> Option<f64> {
///     if label.label_type() == "Number" {
///         label.as_any()
///             .downcast_ref::<NumberLabel>()
///             .map(|n| n.0)
///     } else {
///         None
///     }
/// }
/// ```
pub trait SemanticLabel: fmt::Debug + Send + Sync {
    /// Returns the type identifier for this label
    ///
    /// This should be a stable string that uniquely identifies the
    /// semantic type. Used for runtime type checking before downcasting.
    /// Convention is to use a descriptive name like "Number", "Text", etc.
    fn label_type(&self) -> &'static str;

    /// Convert to Any for downcasting
    ///
    /// This enables type-safe downcasting to concrete label types.
    /// Required for extracting the actual data from the label.
    fn as_any(&self) -> &dyn Any;

    /// Clone this label into a new boxed trait object
    ///
    /// Required because Clone cannot be made into a trait object.
    /// This enables cloning of `Box<dyn SemanticLabel>` instances.
    fn clone_boxed(&self) -> Box<dyn SemanticLabel>;

    /// Get a human-readable description of the label's content
    ///
    /// This is primarily for debugging and logging purposes.
    /// Should provide enough information to understand the label's
    /// current state without requiring downcasting.
    fn describe(&self) -> String {
        format!("{}: {:?}", self.label_type(), self)
    }
}
