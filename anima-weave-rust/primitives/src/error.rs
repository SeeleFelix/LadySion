//! Error handling traits for AnimaWeave
//!
//! This module defines the core error trait that vessels can implement
//! to provide their own error types while maintaining compatibility
//! with the trait object system.

use std::fmt;

/// Core error trait for vessel-specific error types
///
/// This trait allows vessels to define their own error types while maintaining
/// compatibility with the trait object system. All vessel errors should implement
/// this trait to enable proper error handling and propagation.
///
/// # Design Decision: Trait Objects vs Generics
/// We chose trait objects over generics to avoid propagating error type parameters
/// throughout the entire system. This trades some performance for significantly
/// simpler APIs.
///
/// # Example
/// ```rust
/// #[derive(Debug)]
/// struct MyVesselError {
///     message: String,
/// }
///
/// impl AnimaError for MyVesselError {
///     fn error_type(&self) -> &'static str {
///         "MyVesselError"
///     }
/// }
/// ```
pub trait AnimaError: fmt::Debug + fmt::Display + Send + Sync {
    /// Returns a string identifier for this error type
    ///
    /// This should be a stable identifier that can be used for
    /// error matching and handling. Convention is to use the
    /// struct name.
    fn error_type(&self) -> &'static str;

    /// Convert to std::error::Error trait object
    ///
    /// This enables integration with the standard Rust error handling
    /// ecosystem while maintaining our custom error trait.
    fn as_std_error(&self) -> &dyn std::error::Error
    where
        Self: std::error::Error + Sized,
    {
        self
    }
}
