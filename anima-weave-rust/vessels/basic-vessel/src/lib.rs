//! # Basic Vessel
//!
//! TODO: Implement basic vessel based on trait abstractions

// Placeholder for basic vessel implementation
// Will be implemented after core traits are finalized

pub fn create_basic_vessel() {
    // TODO: Implement basic vessel with Start, GetTimestamp, IsEven nodes
    // This will be done in a future story
}

//! Basic Vessel - Foundational data types for AnimaWeave graphs
//! 
//! Demonstrates vessel-independent semantic label system using macros.
//! Each vessel defines its own types without any cross-dependencies.

use anima_weave_primitives::{
    define_vessel, define_converters,
    label::{SemanticLabel, DynamicLabel},
    vessel::Vessel,
};

// Define basic data types used in this vessel
#[derive(Debug, Clone, PartialEq)]
pub struct Coordinates {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Default for Coordinates {
    fn default() -> Self {
        Self { x: 0.0, y: 0.0, z: 0.0 }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Timestamp {
    pub milliseconds: u64,
}

impl Default for Timestamp {
    fn default() -> Self {
        Self { 
            milliseconds: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64
        }
    }
}

// Use the macro to define the entire vessel with minimal boilerplate
define_vessel!(
    BasicVessel,
    vessel_id: "basic",
    description: "Foundational data types for basic operations",
    labels: {
        NumberLabel(f64) => "basic.Number",
        TextLabel(String) => "basic.Text", 
        BoolLabel(bool) => "basic.Bool",
        CoordinatesLabel(Coordinates) => "basic.Coordinates",
        TimestampLabel(Timestamp) => "basic.Timestamp",
    }
);

// Define converters between basic types with minimal boilerplate
define_converters!(BasicConverters, {
    NumberLabel => BoolLabel via |n: &f64| *n != 0.0,
    NumberLabel => TextLabel via |n: &f64| n.to_string(),
    BoolLabel => NumberLabel via |b: &bool| if *b { 1.0 } else { 0.0 },
    BoolLabel => TextLabel via |b: &bool| b.to_string(),
    TextLabel => NumberLabel via |s: &String| s.parse().unwrap_or(0.0),
});

// Additional vessel-specific convenience methods (optional)
impl BasicVessel {
    /// Creates a coordinate label from individual values
    pub fn create_coordinates(x: f64, y: f64, z: f64) -> CoordinatesLabel {
        CoordinatesLabel::create(Coordinates { x, y, z })
    }
    
    /// Creates a timestamp label for the current time
    pub fn create_current_timestamp() -> TimestampLabel {
        TimestampLabel::create(Timestamp::default())
    }
    
    /// Creates a timestamp label from milliseconds
    pub fn create_timestamp_from_millis(millis: u64) -> TimestampLabel {
        TimestampLabel::create(Timestamp { milliseconds: millis })
    }
}

//! Basic vessel providing fundamental data types and operations
//! 
//! This vessel demonstrates how each vessel can define its own semantic labels
//! and operations, similar to how Java packages define their own classes.

use primitives::{
    define_vessel_label, impl_vessel_factory,
    label::{LabelFactory, DynamicLabel, SemanticLabel},
    vessel::Vessel,
    node::Node,
};

/// Basic data types defined by this vessel
/// Each vessel is free to define its own domain-specific types

// Fundamental numeric types
define_vessel_label!(NumberLabel, f64, "basic.Number");
define_vessel_label!(IntegerLabel, i64, "basic.Integer");
define_vessel_label!(BooleanLabel, bool, "basic.Boolean");

// Text and string types
define_vessel_label!(TextLabel, String, "basic.Text");
define_vessel_label!(CharLabel, char, "basic.Char");

// Special basic types
define_vessel_label!(TimestampLabel, u64, "basic.Timestamp");
define_vessel_label!(SignalLabel, (), "basic.Signal");

/// Vessel-specific composite types
#[derive(Debug, Clone)]
pub struct Range {
    pub min: f64,
    pub max: f64,
}

define_vessel_label!(RangeLabel, Range, "basic.Range");

/// Basic vessel factory for creating labels
impl_vessel_factory!(BasicVesselFactory, "basic", {
    NumberLabel(f64) => "basic.Number",
    IntegerLabel(i64) => "basic.Integer", 
    BooleanLabel(bool) => "basic.Boolean",
    TextLabel(String) => "basic.Text",
    CharLabel(char) => "basic.Char",
    TimestampLabel(u64) => "basic.Timestamp",
    SignalLabel(()) => "basic.Signal",
    CoordinatesLabel(Coordinates) => "basic.Coordinates",
    RangeLabel(Range) => "basic.Range",
});

/// Convenience constructors (like Java static factory methods)
impl NumberLabel {
    pub fn zero() -> Self {
        Self::new(0.0)
    }
    
    pub fn from_int(value: i32) -> Self {
        Self::new(value as f64)
    }
}

impl BooleanLabel {
    pub fn true_value() -> Self {
        Self::new(true)
    }
    
    pub fn false_value() -> Self {
        Self::new(false)
    }
}

impl SignalLabel {
    pub fn trigger() -> Self {
        Self::new(())
    }
}

impl CoordinatesLabel {
    pub fn origin() -> Self {
        Self::new(Coordinates { x: 0.0, y: 0.0 })
    }
    
    pub fn at(x: f64, y: f64) -> Self {
        Self::new(Coordinates { x, y })
    }
}

impl RangeLabel {
    pub fn unit() -> Self {
        Self::new(Range { min: 0.0, max: 1.0 })
    }
    
    pub fn from_to(min: f64, max: f64) -> Self {
        Self::new(Range { min, max })
    }
}

/// Basic vessel converter functions
/// Each vessel can define its own conversion logic
pub struct BasicConverters;

impl BasicConverters {
    /// Convert number to text
    pub fn number_to_text(number: &NumberLabel) -> TextLabel {
        TextLabel::new(number.get_value().to_string())
    }
    
    /// Convert number to boolean
    pub fn number_to_bool(number: &NumberLabel) -> BooleanLabel {
        BooleanLabel::new(*number.get_value() != 0.0)
    }
    
    /// Convert text to number (fallible)
    pub fn text_to_number(text: &TextLabel) -> Option<NumberLabel> {
        text.get_value().parse::<f64>().ok()
            .map(|value| NumberLabel::new(value))
    }
    
    /// Convert coordinates to text representation
    pub fn coordinates_to_text(coords: &CoordinatesLabel) -> TextLabel {
        let c = coords.get_value();
        TextLabel::new(format!("({}, {})", c.x, c.y))
    }
}

/// Basic vessel implementation
pub struct BasicVessel {
    name: String,
}

impl BasicVessel {
    pub fn new() -> Self {
        Self {
            name: "basic".to_string(),
        }
    }
}

impl Vessel for BasicVessel {
    fn get_name(&self) -> &str {
        &self.name
    }
    
    fn get_version(&self) -> &str {
        "1.0.0"
    }
    
    fn get_description(&self) -> &str {
        "Basic vessel providing fundamental data types and operations"
    }
    
    fn list_nodes(&self) -> Vec<String> {
        vec![
            "add_numbers".to_string(),
            "concat_text".to_string(),
            "get_timestamp".to_string(),
            "is_even".to_string(),
        ]
    }
    
    fn create_label(&self, label_type: &str, value: Box<dyn std::any::Any>) -> Option<Box<dyn DynamicLabel>> {
        BasicVesselFactory::create_label(label_type, value)
    }
    
    fn list_label_types(&self) -> Vec<String> {
        BasicVesselFactory::list_label_types().iter()
            .map(|&s| s.to_string())
            .collect()
    }
}

impl Default for BasicVessel {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_vessel_creation() {
        let vessel = BasicVessel::new();
        assert_eq!(vessel.get_name(), "basic");
        assert_eq!(vessel.get_description(), "Foundational data types for basic operations");
    }
    
    #[test]
    fn test_label_creation_via_macro() {
        // All label types are automatically available
        let number = NumberLabel::create(42.0);
        let text = TextLabel::create("Hello".to_string());
        let bool_val = BoolLabel::create(true);
        let coords = CoordinatesLabel::create(Coordinates { x: 1.0, y: 2.0, z: 3.0 });
        let timestamp = TimestampLabel::create(Timestamp { milliseconds: 1234567890 });
        
        assert_eq!(*number.get_value(), 42.0);
        assert_eq!(number.get_type_name(), "basic.Number");
        
        assert_eq!(text.get_value(), "Hello");
        assert_eq!(text.get_type_name(), "basic.Text");
        
        assert_eq!(*bool_val.get_value(), true);
        assert_eq!(bool_val.get_type_name(), "basic.Bool");
        
        assert_eq!(coords.get_value().x, 1.0);
        assert_eq!(coords.get_type_name(), "basic.Coordinates");
        
        assert_eq!(timestamp.get_value().milliseconds, 1234567890);
        assert_eq!(timestamp.get_type_name(), "basic.Timestamp");
    }
    
    #[test]
    fn test_vessel_factory_integration() {
        let vessel = BasicVessel::new();
        
        // Test factory method
        let number_value = Box::new(123.0f64);
        let label = vessel.create_label("basic.Number", number_value).unwrap();
        assert_eq!(label.get_type_name(), "basic.Number");
        assert_eq!(*label.downcast_ref::<f64>().unwrap(), 123.0);
        
        // Test label type listing
        let types = vessel.list_label_types();
        assert!(types.contains(&"basic.Number".to_string()));
        assert!(types.contains(&"basic.Text".to_string()));
        assert!(types.contains(&"basic.Bool".to_string()));
        assert!(types.contains(&"basic.Coordinates".to_string()));
        assert!(types.contains(&"basic.Timestamp".to_string()));
    }
    
    #[test]
    fn test_converters_via_macro() {
        let number = NumberLabel::create(42.0);
        let bool_val = BoolLabel::create(true);
        
        // Test automatic converter methods
        let number_to_bool = BasicConverters::number_label_to_bool_label(&number);
        assert_eq!(*number_to_bool.get_value(), true);
        
        let number_to_text = BasicConverters::number_label_to_text_label(&number);
        assert_eq!(number_to_text.get_value(), "42");
        
        let bool_to_number = BasicConverters::bool_label_to_number_label(&bool_val);
        assert_eq!(*bool_to_number.get_value(), 1.0);
    }
    
    #[test]
    fn test_convenience_methods() {
        // Test vessel-specific convenience methods
        let coords = BasicVessel::create_coordinates(1.0, 2.0, 3.0);
        assert_eq!(coords.get_value().x, 1.0);
        assert_eq!(coords.get_value().y, 2.0);
        assert_eq!(coords.get_value().z, 3.0);
        
        let timestamp = BasicVessel::create_current_timestamp();
        assert!(timestamp.get_value().milliseconds > 0);
        
        let custom_timestamp = BasicVessel::create_timestamp_from_millis(9999);
        assert_eq!(custom_timestamp.get_value().milliseconds, 9999);
    }
    
    #[test]
    fn test_trait_object_compatibility() {
        // Different vessel labels can be stored together
        let mut labels: Vec<Box<dyn DynamicLabel>> = vec![];
        
        labels.push(NumberLabel::create(42.0).into_boxed());
        labels.push(TextLabel::create("Hello".to_string()).into_boxed());
        labels.push(BoolLabel::create(true).into_boxed());
        labels.push(CoordinatesLabel::create(Coordinates { x: 1.0, y: 2.0, z: 3.0 }).into_boxed());
        
        // All work together dynamically
        for label in &labels {
            match label.get_type_name() {
                "basic.Number" => {
                    let val = label.downcast_ref::<f64>().unwrap();
                    assert_eq!(*val, 42.0);
                }
                "basic.Text" => {
                    let val = label.downcast_ref::<String>().unwrap();
                    assert_eq!(val, "Hello");
                }
                "basic.Bool" => {
                    let val = label.downcast_ref::<bool>().unwrap();
                    assert_eq!(*val, true);
                }
                "basic.Coordinates" => {
                    let val = label.downcast_ref::<Coordinates>().unwrap();
                    assert_eq!(val.x, 1.0);
                }
                _ => panic!("Unexpected label type"),
            }
        }
    }
}
