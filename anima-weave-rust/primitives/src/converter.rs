//! Type conversion system for automatic label transformations
//!
//! This module provides the converter trait that enables automatic
//! transformation between different semantic label types, allowing
//! for flexible data flow in the graph execution system.

use crate::SemanticLabel;

/// Trait for automatic type conversion between semantic labels
///
/// This trait enables vessels to define conversion rules between different
/// semantic label types, allowing the runtime to automatically transform
/// data as it flows through the graph.
///
/// # Design Decision: Runtime vs Compile-time Conversion
///
/// **Current Approach: Runtime Conversion**
/// - Converters work with trait objects (`Box<dyn SemanticLabel>`)
/// - Type checking happens at runtime via `label_type()`
/// - Enables dynamic graph construction and modification
///
/// **Alternative: Compile-time Generic Conversion**
/// - Would require `Converter<From, To>` with generic parameters
/// - Provides compile-time type safety
/// - Makes dynamic dispatch and trait objects impossible
///
/// We chose runtime conversion to maintain compatibility with the trait
/// object system and enable dynamic graph manipulation.
///
/// # Implementation Pattern
/// ```rust
/// struct NumberToTextConverter;
///
/// impl Converter for NumberToTextConverter {
///     fn can_convert(&self, from_type: &str, to_type: &str) -> bool {
///         from_type == "Number" && to_type == "Text"
///     }
///     
///     fn convert(&self, label: Box<dyn SemanticLabel>) -> Result<Box<dyn SemanticLabel>, String> {
///         if let Some(number) = label.as_any().downcast_ref::<NumberLabel>() {
///             Ok(Box::new(TextLabel(number.0.to_string())))
///         } else {
///             Err("Expected NumberLabel".to_string())
///         }
///     }
/// }
/// ```
///
/// # Safety Considerations
/// - Always verify input type in `convert()` even if `can_convert()` returned true
/// - Conversion should be deterministic and not have side effects
/// - Consider precision loss and edge cases in numeric conversions
pub trait Converter: Send + Sync {
    /// Check if this converter can transform from one type to another
    ///
    /// This is used by the runtime to determine which converter to use
    /// for a given transformation. Should be a fast, side-effect-free check.
    ///
    /// # Parameters
    /// - `from_type`: The source label type identifier
    /// - `to_type`: The target label type identifier
    ///
    /// # Returns
    /// `true` if this converter can perform the transformation, `false` otherwise
    fn can_convert(&self, from_type: &str, to_type: &str) -> bool;

    /// Perform the actual conversion
    ///
    /// This method should consume the input label and produce a new label
    /// of the target type. The conversion should be deterministic and
    /// not have side effects.
    ///
    /// # Parameters
    /// - `label`: The input label to convert (ownership transferred)
    ///
    /// # Returns
    /// - `Ok(converted_label)` if conversion succeeds
    /// - `Err(error_message)` if conversion fails
    ///
    /// # Safety
    /// Even if `can_convert()` returned true, this method should still
    /// verify the input type as a safety measure.
    fn convert(&self, label: Box<dyn SemanticLabel>) -> Result<Box<dyn SemanticLabel>, String>;

    /// Get a human-readable description of this converter
    ///
    /// This is primarily for debugging and logging purposes.
    /// Should describe what types this converter handles.
    fn description(&self) -> String {
        "Generic converter".to_string()
    }

    /// Get the priority of this converter for conflict resolution
    ///
    /// When multiple converters can handle the same transformation,
    /// the one with higher priority is chosen. Default priority is 0.
    ///
    /// Use higher priorities for more specific or optimized converters.
    fn priority(&self) -> i32 {
        0
    }
}
