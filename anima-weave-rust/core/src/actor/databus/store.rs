use crate::event::types::PortRef;
use crate::types::{NodeName, PortName};
use crate::{SemanticLabel, SignalLabel};
use std::collections::HashMap;
use thiserror::Error;

/// An error that can occur when adding an output to the DataStore.
#[derive(Debug, Error)]
pub enum DataStoreError {
    #[error("Type mismatch: expected SignalLabel for a control port, but got {actual_type}")]
    ControlPortTypeMismatch { actual_type: String },
}

/// A data store for node outputs, based on the "Data as Log, Control as State" model.
#[derive(Debug, Default)]
pub struct DataStore {
    /// Stores an append-only log of values for data ports.
    data_storage: HashMap<(NodeName, PortName), Vec<Box<dyn SemanticLabel>>>,
    /// Stores the latest state for control ports.
    control_storage: HashMap<(NodeName, PortName), SignalLabel>,
}

impl DataStore {
    /// Creates a new, empty `DataStore`.
    pub fn new() -> Self {
        Self::default()
    }

    /// Appends a new value to the history of a data port.
    pub fn add_data_output(&mut self, port_ref: &PortRef, value: Box<dyn SemanticLabel>) {
        self.data_storage
            .entry((port_ref.node_name.clone(), port_ref.port_name.clone()))
            .or_default()
            .push(value);
    }

    /// Overwrites the current state of a control port.
    pub fn add_control_output(&mut self, port_ref: &PortRef, value: SignalLabel) {
        self.control_storage.insert(
            (port_ref.node_name.clone(), port_ref.port_name.clone()),
            value,
        );
    }

    /// Gets the latest data value from a data port's history.
    pub fn get_latest_data(
        &self,
        node_name: &str,
        port_name: &str,
    ) -> Option<&Box<dyn SemanticLabel>> {
        self.data_storage
            .get(&(node_name.to_string(), port_name.to_string()))
            .and_then(|history| history.last())
    }

    /// Gets the current state of a control port.
    pub fn get_control_state(&self, node_name: &str, port_name: &str) -> Option<&SignalLabel> {
        self.control_storage
            .get(&(node_name.to_string(), port_name.to_string()))
    }

    /// Checks if a specific port has any output values.
    pub fn has_any_output(&self, node_name: &str, port_name: &str) -> bool {
        self.get_control_state(node_name, port_name).is_some()
    }

    /// Consumes (removes) the state of a set of control ports.
    pub fn consume_control_states(&mut self, ports_to_consume: &[PortRef]) {
        for port_ref in ports_to_consume {
            self.control_storage
                .remove(&(port_ref.node_name.clone(), port_ref.port_name.clone()));
        }
    }
}
