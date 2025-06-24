//! Data bus system for managing semantic labels
//! 
//! This provides a Java-like collection for storing and retrieving labels

use crate::label::{DynamicLabel, SemanticLabel};
use std::collections::HashMap;

/// Data bus for storing and retrieving semantic labels
/// 
/// Like Java's Map<String, Object> but with type safety
pub struct DataBus {
    labels: HashMap<String, Box<dyn DynamicLabel>>,
}

impl DataBus {
    /// Creates a new empty data bus
    pub fn new() -> Self {
        Self {
            labels: HashMap::new(),
        }
    }

    /// Stores a generic label (Java-like put method)
    pub fn put<T>(&mut self, key: &str, label: SemanticLabel<T>) 
    where
        T: Clone + Send + Sync + std::fmt::Debug + 'static,
    {
        self.labels.insert(key.to_string(), label.into_boxed());
    }

    /// Stores a dynamic label (for pre-boxed labels)
    pub fn put_dynamic(&mut self, key: &str, label: Box<dyn DynamicLabel>) {
        self.labels.insert(key.to_string(), label);
    }

    /// Gets a label as dynamic reference (like Java's get returning Object)
    pub fn get(&self, key: &str) -> Option<&dyn DynamicLabel> {
        self.labels.get(key).map(|boxed| boxed.as_ref())
    }

    /// Gets a typed value directly (like Java's generic cast)
    /// Note: Returns the value directly to avoid lifetime issues
    pub fn get_value<T: Clone + 'static>(&self, key: &str) -> Option<T> {
        self.labels.get(key)?.downcast_ref::<T>().cloned()
    }

    /// Checks if a key exists
    pub fn contains_key(&self, key: &str) -> bool {
        self.labels.contains_key(key)
    }

    /// Removes a label (like Java's remove)
    pub fn remove(&mut self, key: &str) -> Option<Box<dyn DynamicLabel>> {
        self.labels.remove(key)
    }

    /// Gets all keys (like Java's keySet)
    pub fn keys(&self) -> Vec<&String> {
        self.labels.keys().collect()
    }

    /// Gets the type name of a stored label
    pub fn get_type_name(&self, key: &str) -> Option<&str> {
        self.get(key).map(|label| label.get_type_name())
    }

    /// Checks if a label is of a specific type
    pub fn is_type<T: 'static>(&self, key: &str) -> bool {
        if let Some(label) = self.labels.get(key) {
            label.is_type::<T>()
        } else {
            false
        }
    }

    /// Gets the number of stored labels
    pub fn size(&self) -> usize {
        self.labels.len()
    }

    /// Checks if the bus is empty
    pub fn is_empty(&self) -> bool {
        self.labels.is_empty()
    }

    /// Clears all labels
    pub fn clear(&mut self) {
        self.labels.clear();
    }
}

impl Default for DataBus {
    fn default() -> Self {
        Self::new()
    }
}

/// Java-style iteration support
impl DataBus {
    /// Iterates over all entries (like Java's entrySet)
    pub fn entries(&self) -> impl Iterator<Item = (&String, &dyn DynamicLabel)> {
        self.labels.iter().map(|(k, v)| (k, v.as_ref()))
    }

    /// Filters entries by type (like Java streams)
    pub fn entries_of_type<T: 'static>(&self) -> impl Iterator<Item = (&String, &T)> {
        self.labels.iter().filter_map(|(k, v)| {
            v.downcast_ref::<T>().map(|typed_value| (k, typed_value))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_java_like_data_bus() {
        let mut bus = DataBus::new();
        
        // Create labels using the new design
        let number_label = SemanticLabel::new(42.0, "Number");
        let text_label = SemanticLabel::new("Hello".to_string(), "Text");
        let bool_label = SemanticLabel::new(true, "Bool");
        
        // Java-like operations
        bus.put("number", number_label);
        bus.put("text", text_label);
        bus.put("flag", bool_label);
        
        // Type-safe retrieval (now returns owned values)
        assert_eq!(bus.get_value::<f64>("number").unwrap(), 42.0);
        assert_eq!(bus.get_value::<String>("text").unwrap(), "Hello");
        assert_eq!(bus.get_value::<bool>("flag").unwrap(), true);
        
        // Type checking
        assert!(bus.is_type::<f64>("number"));
        assert!(!bus.is_type::<String>("number"));
        
        // Java-like size operations
        assert_eq!(bus.size(), 3);
        assert!(!bus.is_empty());
        
        // Iteration
        for (key, label) in bus.entries() {
            println!("Key: {}, Type: {}", key, label.get_type_name());
        }
        
        // Type-filtered iteration
        for (key, value) in bus.entries_of_type::<f64>() {
            println!("Number {}: {}", key, value);
        }
    }
    
    #[test]
    fn test_conversions_with_bus() {
        let mut bus = DataBus::new();
        
        // Store original
        let number = SemanticLabel::new(123.0, "Number");
        bus.put("original", number);
        
        // Convert and store using the new design
        if let Some(num_value) = bus.get_value::<f64>("original") {
            // Use the conversion method from SemanticLabel
            let original_label = SemanticLabel::new(num_value, "Number");
            if let Some(text_label) = original_label.convert_to("Text", |n| Some(n.to_string())) {
                bus.put("converted", text_label);
            }
        }
        
        // Verify conversion
        assert_eq!(bus.get_value::<String>("converted").unwrap(), "123");
    }
} 