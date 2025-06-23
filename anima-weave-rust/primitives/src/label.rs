//! Semantic label system for typed data flow

use std::any::Any;
use std::fmt;

/// Semantic label trait for representing typed data
///
/// Labels carry data between nodes in the graph. Use trait objects
/// instead of generics to allow dynamic storage and dispatch.
///
/// Labels are created and managed by vessels - external code should
/// not interact with this trait directly. All operations go through
/// the vessel proxy methods.
///
/// # Implementation Example
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
pub trait SemanticLabel: fmt::Debug + Send + Sync {
    /// Type identifier for this label
    fn label_type(&self) -> &'static str;

    /// Convert to Any for downcasting (used internally by vessels)
    fn as_any(&self) -> &dyn Any;

    /// Clone into a new boxed trait object
    fn clone_boxed(&self) -> Box<dyn SemanticLabel>;

    /// Human-readable description for debugging
    fn describe(&self) -> String {
        format!("{}: {:?}", self.label_type(), self)
    }
}
