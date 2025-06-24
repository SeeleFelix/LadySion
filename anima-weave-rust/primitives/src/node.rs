//! Node execution system for graph processing
//!
//! This module provides the core node traits that define how individual
//! processing units work within the AnimaWeave graph execution system.

use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;

use crate::{AnimaError, DynamicLabel};
use crate::port::PortCollection;

/// Handle for tracking asynchronous node execution
///
/// This trait represents a handle to an ongoing or completed node execution.
/// It allows checking execution status and retrieving results without
/// blocking the calling thread.
///
/// # Design Decision: Handle Pattern vs async_trait
///
/// **Current Approach: Handle Pattern**
/// - Immediate return from `execute_boxed()` with polling-based completion
/// - Compatible with trait objects (`Box<dyn NodeExecution>`)
/// - No dependencies on external crates like async_trait
/// - Manual future management but simpler trait object handling
///
/// **Alternative: async_trait**
/// - Would enable `async fn execute()` in trait
/// - Requires external dependency and generates complex code
/// - Makes trait objects more difficult to work with
/// - Standard approach but adds complexity
///
/// We chose the handle pattern to maintain trait object compatibility
/// and avoid external dependencies while still supporting async execution.
///
/// # Usage Pattern
/// ```rust
/// let handle = node.execute_boxed(inputs);
///
/// // Option 1: Poll until completion
/// while !handle.is_complete() {
///     tokio::task::yield_now().await;
/// }
/// let result = handle.result().unwrap();
///
/// // Option 2: Await the future
/// let result = handle.await?;
/// ```
pub trait NodeExecution: Send {
    /// Check if the execution has completed
    ///
    /// Returns `true` if the execution is finished (successfully or with error),
    /// `false` if it's still running or not yet started.
    fn is_complete(&self) -> bool;

    /// Get the execution result if available
    ///
    /// Returns `Some(result)` if execution is complete, `None` if still running.
    /// The result contains either the output data or an error.
    fn result(
        &self,
    ) -> Option<Result<HashMap<String, Box<dyn DynamicLabel>>, Box<dyn AnimaError>>>;

    /// Convert this handle into a future for awaiting
    ///
    /// This enables using standard async/await syntax with the execution handle.
    /// The future will complete when the node execution finishes.
    fn into_future(
        self,
    ) -> Pin<
        Box<
            dyn Future<
                    Output = Result<HashMap<String, Box<dyn DynamicLabel>>, Box<dyn AnimaError>>,
                > + Send,
        >,
    >
    where
        Self: Sized + 'static;
}

/// Core trait for executable nodes in the graph
///
/// This trait defines the interface for all nodes that can be executed
/// within an AnimaWeave graph. Nodes are the fundamental processing
/// units that transform input data into output data.
///
/// # Design Decision: Sync vs Async Execution
///
/// **Hybrid Approach:**
/// - `execute_boxed()` returns immediately with a `NodeExecution` handle
/// - Supports both synchronous (immediate completion) and asynchronous execution
/// - Compatible with trait objects and dynamic dispatch
///
/// **Benefits:**
/// - Non-blocking API that works with trait objects
/// - Flexibility for both sync and async node implementations
/// - Consistent interface regardless of execution complexity
///
/// **Trade-offs:**
/// - Slightly more complex than pure sync or pure async approaches
/// - Requires manual future management in some cases
///
/// # Implementation Patterns
///
/// ## Synchronous Node
/// ```rust
/// impl Node for MySyncNode {
///     fn execute_boxed(&self, inputs: HashMap<String, Box<dyn SemanticLabel>>)
///         -> Box<dyn NodeExecution> {
///         let result = self.process_immediately(inputs);
///         Box::new(ImmediateExecution::new(result))
///     }
/// }
/// ```
///
/// ## Asynchronous Node
/// ```rust
/// impl Node for MyAsyncNode {
///     fn execute_boxed(&self, inputs: HashMap<String, Box<dyn SemanticLabel>>)
///         -> Box<dyn NodeExecution> {
///         let future = self.process_async(inputs);
///         Box::new(AsyncExecution::new(future))
///     }
/// }
/// ```
pub trait Node: Send + Sync {
    /// Get the unique identifier for this node type
    ///
    /// This should be a stable string that uniquely identifies the node type
    /// within its vessel. Used for registration, lookup, and debugging.
    fn node_type(&self) -> &'static str;

    /// Get the port definitions for this node
    ///
    /// Returns the complete interface specification including all input
    /// and output ports. Used for graph validation and type checking.
    fn ports(&self) -> &dyn PortCollection;

    /// Execute this node with the given inputs
    ///
    /// This method starts node execution and immediately returns a handle
    /// that can be used to track progress and retrieve results. The actual
    /// execution may be synchronous or asynchronous.
    ///
    /// # Parameters
    /// - `inputs`: Map of port names to input data labels
    ///
    /// # Returns
    /// A handle that can be used to check completion status and get results
    ///
    /// # Type Safety
    /// The runtime should validate that:
    /// - All required input ports have data
    /// - Input data types match port expectations
    /// - Output data types match port specifications
    fn execute_boxed(
        &self,
        inputs: HashMap<String, Box<dyn DynamicLabel>>,
    ) -> Box<dyn NodeExecution>;

    /// Get a human-readable description of this node
    ///
    /// This is primarily for debugging, documentation, and UI purposes.
    /// Should describe what this node does and any important behavior.
    fn description(&self) -> String {
        format!("{} node", self.node_type())
    }

    /// Get metadata about this node
    ///
    /// Returns key-value pairs of metadata that can be used for
    /// documentation, debugging, or runtime decisions. Examples:
    /// - "category": "math", "io", "control"
    /// - "complexity": "simple", "moderate", "complex"
    /// - "version": "1.0.0"
    fn metadata(&self) -> HashMap<String, String> {
        HashMap::new()
    }

    /// Validate that this node can execute with the given input types
    ///
    /// This method performs static validation without actually executing
    /// the node. Used for graph validation and early error detection.
    ///
    /// # Parameters
    /// - `input_types`: Map of port names to available label types
    ///
    /// # Returns
    /// `Ok(())` if the node can execute, `Err(reason)` if validation fails
    fn validate_execution(&self, input_types: &HashMap<String, String>) -> Result<(), String> {
        // Check required ports
        for (port_name, port_def) in self.ports().input_ports() {
            if port_def.is_required() {
                if let Some(available_type) = input_types.get(port_name) {
                    if !port_def.accepts_type(available_type) {
                        return Err(format!(
                            "Port '{}' expects type '{}' but got '{}'",
                            port_name,
                            port_def.expected_type(),
                            available_type
                        ));
                    }
                } else {
                    return Err(format!("Required port '{}' is missing", port_name));
                }
            }
        }
        Ok(())
    }
}
