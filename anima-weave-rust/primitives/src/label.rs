//! Semantic label system for typed data flow
//! 
//! This provides the foundation for vessels to define their own label types.
//! Similar to how Java allows each package to define its own classes.

use std::fmt;
use std::any::Any;

/// Generic semantic label that holds a typed value
/// 
/// This is the base structure that vessels can use to create their own label types.
/// Each vessel can define labels like: `pub type ComplexNumber = SemanticLabel<Complex>`
#[derive(Debug, Clone)]
pub struct SemanticLabel<T> {
    value: T,
    type_name: &'static str,
}

impl<T> SemanticLabel<T> 
where 
    T: Clone + Send + Sync + fmt::Debug + 'static,
{
    /// Creates a new semantic label with the given value
    pub fn new(value: T, type_name: &'static str) -> Self {
        Self { value, type_name }
    }
    
    /// Gets the value (Java-like getter)
    pub fn get_value(&self) -> &T {
        &self.value
    }
    
    /// Sets the value (Java-like setter)
    pub fn set_value(&mut self, value: T) {
        self.value = value;
    }
    
    /// Gets the type name
    pub fn get_type_name(&self) -> &'static str {
        self.type_name
    }
    
    /// Converts to a different type using a conversion function
    /// This is like Java's converter pattern
    pub fn convert_to<U, F>(&self, type_name: &'static str, converter: F) -> Option<SemanticLabel<U>>
    where
        U: Clone + Send + Sync + fmt::Debug + 'static,
        F: FnOnce(&T) -> Option<U>,
    {
        converter(&self.value).map(|converted_value| {
            SemanticLabel::new(converted_value, type_name)
        })
    }
    
    /// Converts to a boxed trait object for dynamic storage
    pub fn into_boxed(self) -> Box<dyn DynamicLabel> {
        Box::new(self)
    }
}

/// Type-erased version for dynamic storage (like Java's Object)
/// 
/// This allows different vessel's label types to be stored together
pub trait DynamicLabel: fmt::Debug + Send + Sync {
    /// Gets the type name
    fn get_type_name(&self) -> &'static str;
    
    /// Gets the value as Any for downcasting (like Java's instanceof + cast)
    fn get_value_any(&self) -> &dyn Any;
    
    /// Clones this label
    fn clone_boxed(&self) -> Box<dyn DynamicLabel>;
}

/// Helper functions for type checking and downcasting
/// Separated from DynamicLabel to make it object-safe
impl dyn DynamicLabel {
    /// Checks if this label can be downcast to type T
    pub fn is_type<T: 'static>(&self) -> bool {
        self.get_value_any().is::<T>()
    }
    
    /// Attempts to downcast to a concrete type (like Java's cast)
    pub fn downcast_ref<T: 'static>(&self) -> Option<&T> {
        self.get_value_any().downcast_ref::<T>()
    }
}

impl<T> DynamicLabel for SemanticLabel<T>
where
    T: Clone + Send + Sync + fmt::Debug + 'static,
{
    fn get_type_name(&self) -> &'static str {
        self.type_name
    }
    
    fn get_value_any(&self) -> &dyn Any {
        &self.value
    }
    
    fn clone_boxed(&self) -> Box<dyn DynamicLabel> {
        Box::new(self.clone())
    }
}

/// Trait for vessels to implement their own label factories
/// 
/// Each vessel can implement this to provide its own label creation methods
pub trait LabelFactory {
    /// Gets the vessel name that this factory belongs to
    fn vessel_name() -> &'static str;
    
    /// Creates a label by name with a generic value
    /// Vessels should implement this to handle their specific label types
    fn create_label(label_name: &str, value: Box<dyn Any>) -> Option<Box<dyn DynamicLabel>>;
    
    /// Lists all label types that this vessel can create
    fn list_label_types() -> Vec<&'static str>;
}

/// Macro to help vessels define their own label types easily
/// 
/// This reduces boilerplate and makes vessel label definition consistent
#[macro_export]
macro_rules! define_vessel_label {
    ($label_name:ident, $value_type:ty, $type_str:expr) => {
        pub type $label_name = $crate::label::SemanticLabel<$value_type>;
        
        impl $label_name {
            /// Creates a new label of this specific type
            pub fn create(value: $value_type) -> Self {
                $crate::label::SemanticLabel::new(value, $type_str)
            }
            
            /// Creates an empty label with default value
            pub fn empty() -> Self 
            where 
                $value_type: Default,
            {
                $crate::label::SemanticLabel::new(Default::default(), $type_str)
            }
        }
    };
}

/// Macro to help vessels implement their label factory with minimal boilerplate
#[macro_export]
macro_rules! impl_vessel_factory {
    ($factory_name:ident, $vessel_name:expr, {
        $( $label_name:ident($value_type:ty) => $type_str:expr ),* $(,)?
    }) => {
        pub struct $factory_name;
        
        impl $crate::label::LabelFactory for $factory_name {
            fn vessel_name() -> &'static str {
                $vessel_name
            }
            
            fn create_label(label_name: &str, value: Box<dyn std::any::Any>) -> Option<Box<dyn $crate::label::DynamicLabel>> {
                match label_name {
                    $(
                        $type_str => {
                            if let Ok(typed_value) = value.downcast::<$value_type>() {
                                let label = $crate::label::SemanticLabel::new(*typed_value, $type_str);
                                Some(Box::new(label))
                            } else {
                                None
                            }
                        }
                    )*
                    _ => None,
                }
            }
            
            fn list_label_types() -> Vec<&'static str> {
                vec![$( $type_str ),*]
            }
        }
    };
}

/// More advanced macro for defining a complete vessel with labels, factory, and convenience methods
#[macro_export]
macro_rules! define_vessel {
    (
        $vessel_name:ident,
        vessel_id: $vessel_id:expr,
        description: $description:expr,
        labels: {
            $( $label_name:ident($value_type:ty) => $type_str:expr ),* $(,)?
        }
        $(, constructors: {
            $( $label_ctor:ident => $constructor_body:expr ),* $(,)?
        })?
    ) => {
        // Define all label types
        $(
            $crate::define_vessel_label!($label_name, $value_type, $type_str);
        )*
        
        // Create factory struct name
        paste::paste! {
            $crate::impl_vessel_factory!([<$vessel_name Factory>], $vessel_id, {
                $( $label_name($value_type) => $type_str ),*
            });
        }
        
        // Define the vessel struct
        pub struct $vessel_name {
            name: String,
        }
        
        impl $vessel_name {
            pub fn new() -> Self {
                Self {
                    name: $vessel_id.to_string(),
                }
            }
        }
        
        impl $crate::vessel::Vessel for $vessel_name {
            fn get_name(&self) -> &str {
                &self.name
            }
            
            fn get_version(&self) -> &str {
                "1.0.0"
            }
            
            fn get_description(&self) -> &str {
                $description
            }
            
            fn list_nodes(&self) -> Vec<String> {
                vec![] // To be implemented by each vessel
            }
            
            fn create_label(&self, label_type: &str, value: Box<dyn std::any::Any>) -> Option<Box<dyn $crate::label::DynamicLabel>> {
                paste::paste! {
                    [<$vessel_name Factory>]::create_label(label_type, value)
                }
            }
            
            fn list_label_types(&self) -> Vec<String> {
                paste::paste! {
                    [<$vessel_name Factory>]::list_label_types().iter()
                        .map(|&s| s.to_string())
                        .collect()
                }
            }
        }
        
        impl Default for $vessel_name {
            fn default() -> Self {
                Self::new()
            }
        }
        
        // Optional constructors
        $(
            $( $constructor_body )*
        )?
    };
}

/// Macro for defining label converters with less boilerplate
#[macro_export]
macro_rules! define_converters {
    ($converter_name:ident, {
        $( $from_label:ident => $to_label:ident via $conversion:expr ),* $(,)?
    }) => {
        pub struct $converter_name;
        
        impl $converter_name {
            $(
                paste::paste! {
                    pub fn [<$from_label:snake _to_ $to_label:snake>](from: &$from_label) -> $to_label {
                        let converted_value = $conversion(from.get_value());
                        $to_label::create(converted_value)
                    }
                }
            )*
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    
    // Example: Basic vessel defining its own labels using the macro
    define_vessel_label!(NumberLabel, f64, "Number");
    define_vessel_label!(TextLabel, String, "Text");
    
    // Example: Math vessel defining complex labels
    #[derive(Debug, Clone, Default)]
    struct Complex {
        real: f64,
        imag: f64,
    }
    
    define_vessel_label!(ComplexLabel, Complex, "Complex");
    
    // Example: Basic vessel factory
    impl_vessel_factory!(BasicVesselFactory, "basic", {
        NumberLabel(f64) => "Number",
        TextLabel(String) => "Text",
    });
    
    #[test]
    fn test_vessel_label_definition() {
        // Each vessel can create its own labels using create()
        let number = NumberLabel::create(42.0);
        assert_eq!(*number.get_value(), 42.0);
        assert_eq!(number.get_type_name(), "Number");
        
        let complex = ComplexLabel::create(Complex { real: 1.0, imag: 2.0 });
        assert_eq!(complex.get_value().real, 1.0);
        assert_eq!(complex.get_type_name(), "Complex");
    }
    
    #[test]
    fn test_vessel_factory() {
        // Factory can create labels by name
        let number_value = Box::new(123.0f64);
        let label = BasicVesselFactory::create_label("Number", number_value).unwrap();
        
        assert_eq!(label.get_type_name(), "Number");
        assert_eq!(*label.downcast_ref::<f64>().unwrap(), 123.0);
        
        // List available types
        let types = BasicVesselFactory::list_label_types();
        assert!(types.contains(&"Number"));
        assert!(types.contains(&"Text"));
    }
    
    #[test]
    fn test_trait_object_safety() {
        // Each vessel works independently but can interoperate
        let mut labels: Vec<Box<dyn DynamicLabel>> = vec![];
        
        // Basic vessel labels
        labels.push(NumberLabel::create(42.0).into_boxed());
        labels.push(TextLabel::create("Hello".to_string()).into_boxed());
        
        // Math vessel labels
        labels.push(ComplexLabel::create(Complex { real: 1.0, imag: 2.0 }).into_boxed());
        
        // All can be stored together and accessed dynamically
        for label in &labels {
            println!("Type: {}", label.get_type_name());
            
            if let Some(number) = label.downcast_ref::<f64>() {
                println!("  Number value: {}", number);
            } else if let Some(text) = label.downcast_ref::<String>() {
                println!("  Text value: {}", text);
            } else if let Some(complex) = label.downcast_ref::<Complex>() {
                println!("  Complex value: {} + {}i", complex.real, complex.imag);
            }
        }
    }
}
