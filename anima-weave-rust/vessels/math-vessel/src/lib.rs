//! Math Vessel - Advanced mathematical data types for AnimaWeave graphs
//! 
//! Demonstrates vessel-independent semantic label system for mathematical operations.
//! Each vessel defines its own complex mathematical types without dependencies.

use anima_weave_primitives::{
    define_vessel, define_converters,
    label::{SemanticLabel, DynamicLabel},
    vessel::Vessel,
};

// Define mathematical data types used in this vessel
#[derive(Debug, Clone, PartialEq)]
pub struct Complex {
    pub real: f64,
    pub imag: f64,
}

impl Default for Complex {
    fn default() -> Self {
        Self { real: 0.0, imag: 0.0 }
    }
}

impl Complex {
    pub fn new(real: f64, imag: f64) -> Self {
        Self { real, imag }
    }
    
    pub fn magnitude(&self) -> f64 {
        (self.real * self.real + self.imag * self.imag).sqrt()
    }
    
    pub fn add(&self, other: &Complex) -> Complex {
        Complex {
            real: self.real + other.real,
            imag: self.imag + other.imag,
        }
    }
    
    pub fn multiply(&self, other: &Complex) -> Complex {
        Complex {
            real: self.real * other.real - self.imag * other.imag,
            imag: self.real * other.imag + self.imag * other.real,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Vector3D {
    pub x: f64,
    pub y: f64, 
    pub z: f64,
}

impl Default for Vector3D {
    fn default() -> Self {
        Self { x: 0.0, y: 0.0, z: 0.0 }
    }
}

impl Vector3D {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }
    
    pub fn magnitude(&self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }
    
    pub fn dot(&self, other: &Vector3D) -> f64 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Matrix2x2 {
    pub a: f64, pub b: f64,
    pub c: f64, pub d: f64,
}

impl Default for Matrix2x2 {
    fn default() -> Self {
        Self { a: 1.0, b: 0.0, c: 0.0, d: 1.0 } // Identity matrix
    }
}

impl Matrix2x2 {
    pub fn new(a: f64, b: f64, c: f64, d: f64) -> Self {
        Self { a, b, c, d }
    }
    
    pub fn determinant(&self) -> f64 {
        self.a * self.d - self.b * self.c
    }
    
    pub fn multiply(&self, other: &Matrix2x2) -> Matrix2x2 {
        Matrix2x2 {
            a: self.a * other.a + self.b * other.c,
            b: self.a * other.b + self.b * other.d,
            c: self.c * other.a + self.d * other.c,
            d: self.c * other.b + self.d * other.d,
        }
    }
}

// Use the macro to define the entire mathematical vessel
define_vessel!(
    MathVessel,
    vessel_id: "math",
    description: "Advanced mathematical data types and operations",
    labels: {
        ComplexLabel(Complex) => "math.Complex",
        VectorLabel(Vector3D) => "math.Vector3D",
        MatrixLabel(Matrix2x2) => "math.Matrix2x2",
        AngleLabel(f64) => "math.Angle",
        IntegerLabel(i64) => "math.Integer",
    }
);

// Define converters between mathematical types with minimal boilerplate
define_converters!(MathConverters, {
    ComplexLabel => AngleLabel via |c: &Complex| c.imag.atan2(c.real),
    VectorLabel => AngleLabel via |v: &Vector3D| v.z.atan2(v.x),
    AngleLabel => ComplexLabel via |a: &f64| Complex::new(a.cos(), a.sin()),
    IntegerLabel => AngleLabel via |i: &i64| *i as f64 * std::f64::consts::PI / 180.0,
    AngleLabel => IntegerLabel via |a: &f64| (a * 180.0 / std::f64::consts::PI) as i64,
});

// Additional vessel-specific convenience methods
impl MathVessel {
    /// Creates a complex number label from real and imaginary parts
    pub fn create_complex(real: f64, imag: f64) -> ComplexLabel {
        ComplexLabel::new(Complex::new(real, imag))
    }
    
    /// Creates a vector label from components
    pub fn create_vector(x: f64, y: f64, z: f64) -> VectorLabel {
        VectorLabel::new(Vector3D::new(x, y, z))
    }
    
    /// Creates a matrix label from components
    pub fn create_matrix(a: f64, b: f64, c: f64, d: f64) -> MatrixLabel {
        MatrixLabel::new(Matrix2x2::new(a, b, c, d))
    }
    
    /// Creates an angle label from degrees
    pub fn create_angle_degrees(degrees: f64) -> AngleLabel {
        AngleLabel::new(degrees * std::f64::consts::PI / 180.0)
    }
    
    /// Creates an angle label from radians
    pub fn create_angle_radians(radians: f64) -> AngleLabel {
        AngleLabel::new(radians)
    }
    
    /// Creates an integer label
    pub fn create_integer(value: i64) -> IntegerLabel {
        IntegerLabel::new(value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_math_vessel_creation() {
        let vessel = MathVessel::new();
        assert_eq!(vessel.get_name(), "math");
        assert_eq!(vessel.get_description(), "Advanced mathematical data types and operations");
    }
    
    #[test]
    fn test_complex_mathematical_labels() {
        // Test complex number operations
        let complex = ComplexLabel::new(Complex::new(3.0, 4.0));
        assert_eq!(complex.get_value().real, 3.0);
        assert_eq!(complex.get_value().imag, 4.0);
        assert_eq!(complex.get_value().magnitude(), 5.0);
        assert_eq!(complex.get_type_name(), "math.Complex");
        
        // Test vector operations
        let vector = VectorLabel::new(Vector3D::new(1.0, 2.0, 3.0));
        assert_eq!(vector.get_value().x, 1.0);
        assert!(vector.get_value().magnitude() > 3.7); // sqrt(14) ≈ 3.74
        assert_eq!(vector.get_type_name(), "math.Vector3D");
        
        // Test matrix operations
        let matrix = MatrixLabel::new(Matrix2x2::new(1.0, 2.0, 3.0, 4.0));
        assert_eq!(matrix.get_value().determinant(), -2.0);
        assert_eq!(matrix.get_type_name(), "math.Matrix2x2");
    }
    
    #[test]
    fn test_mathematical_converters() {
        // Test complex to angle conversion
        let complex = ComplexLabel::new(Complex::new(1.0, 1.0));
        let angle = MathConverters::complex_label_to_angle_label(&complex);
        assert!((angle.get_value() - std::f64::consts::PI / 4.0).abs() < 1e-10);
        
        // Test angle to complex conversion
        let angle = AngleLabel::new(std::f64::consts::PI / 2.0);
        let complex_from_angle = MathConverters::angle_label_to_complex_label(&angle);
        assert!((complex_from_angle.get_value().real - 0.0).abs() < 1e-10);
        assert!((complex_from_angle.get_value().imag - 1.0).abs() < 1e-10);
        
        // Test integer to angle conversion (degrees to radians)
        let integer = IntegerLabel::new(90);
        let angle_from_int = MathConverters::integer_label_to_angle_label(&integer);
        assert!((angle_from_int.get_value() - std::f64::consts::PI / 2.0).abs() < 1e-10);
    }
    
    #[test]
    fn test_convenience_methods() {
        // Test convenience creation methods
        let complex = MathVessel::create_complex(3.0, 4.0);
        assert_eq!(complex.get_value().real, 3.0);
        assert_eq!(complex.get_value().imag, 4.0);
        
        let vector = MathVessel::create_vector(1.0, 2.0, 3.0);
        assert_eq!(vector.get_value().x, 1.0);
        assert_eq!(vector.get_value().y, 2.0);
        assert_eq!(vector.get_value().z, 3.0);
        
        let matrix = MathVessel::create_matrix(1.0, 0.0, 0.0, 1.0);
        assert_eq!(matrix.get_value().determinant(), 1.0); // Identity matrix
        
        let angle_deg = MathVessel::create_angle_degrees(90.0);
        assert!((angle_deg.get_value() - std::f64::consts::PI / 2.0).abs() < 1e-10);
        
        let angle_rad = MathVessel::create_angle_radians(std::f64::consts::PI);
        assert!((angle_rad.get_value() - std::f64::consts::PI).abs() < 1e-10);
        
        let integer = MathVessel::create_integer(42);
        assert_eq!(*integer.get_value(), 42);
    }
    
    #[test]
    fn test_vessel_factory_integration() {
        let vessel = MathVessel::new();
        
        // Test factory creation
        let complex_value = Box::new(Complex::new(2.0, 3.0));
        let label = vessel.create_label("math.Complex", complex_value).unwrap();
        assert_eq!(label.get_type_name(), "math.Complex");
        
        let complex_ref = label.downcast_ref::<Complex>().unwrap();
        assert_eq!(complex_ref.real, 2.0);
        assert_eq!(complex_ref.imag, 3.0);
        
        // Test label type listing
        let types = vessel.list_label_types();
        assert!(types.contains(&"math.Complex".to_string()));
        assert!(types.contains(&"math.Vector3D".to_string()));
        assert!(types.contains(&"math.Matrix2x2".to_string()));
        assert!(types.contains(&"math.Angle".to_string()));
        assert!(types.contains(&"math.Integer".to_string()));
    }
    
    #[test]
    fn test_mathematical_operations() {
        // Test complex number arithmetic
        let c1 = Complex::new(1.0, 2.0);
        let c2 = Complex::new(3.0, 4.0);
        let sum = c1.add(&c2);
        assert_eq!(sum.real, 4.0);
        assert_eq!(sum.imag, 6.0);
        
        let product = c1.multiply(&c2);
        assert_eq!(product.real, -5.0); // (1*3 - 2*4)
        assert_eq!(product.imag, 10.0); // (1*4 + 2*3)
        
        // Test vector operations
        let v1 = Vector3D::new(1.0, 0.0, 0.0);
        let v2 = Vector3D::new(0.0, 1.0, 0.0);
        let dot_product = v1.dot(&v2);
        assert_eq!(dot_product, 0.0); // Orthogonal vectors
        
        // Test matrix operations
        let m1 = Matrix2x2::new(1.0, 2.0, 3.0, 4.0);
        let m2 = Matrix2x2::new(2.0, 0.0, 1.0, 2.0);
        let product = m1.multiply(&m2);
        assert_eq!(product.a, 4.0); // 1*2 + 2*1
        assert_eq!(product.b, 4.0); // 1*0 + 2*2
        assert_eq!(product.c, 10.0); // 3*2 + 4*1
        assert_eq!(product.d, 8.0); // 3*0 + 4*2
    }
    
    #[test]
    fn test_interoperability_with_trait_objects() {
        // Math vessel labels can be stored with other vessel labels
        let mut labels: Vec<Box<dyn DynamicLabel>> = vec![];
        
        labels.push(ComplexLabel::new(Complex::new(1.0, 2.0)).into_boxed());
        labels.push(VectorLabel::new(Vector3D::new(3.0, 4.0, 5.0)).into_boxed());
        labels.push(MatrixLabel::new(Matrix2x2::new(1.0, 0.0, 0.0, 1.0)).into_boxed());
        labels.push(AngleLabel::new(std::f64::consts::PI / 4.0).into_boxed());
        labels.push(IntegerLabel::new(42).into_boxed());
        
        // All work together dynamically
        for label in &labels {
            match label.get_type_name() {
                "math.Complex" => {
                    let val = label.downcast_ref::<Complex>().unwrap();
                    assert_eq!(val.real, 1.0);
                    assert_eq!(val.imag, 2.0);
                }
                "math.Vector3D" => {
                    let val = label.downcast_ref::<Vector3D>().unwrap();
                    assert_eq!(val.x, 3.0);
                    assert_eq!(val.y, 4.0);
                    assert_eq!(val.z, 5.0);
                }
                "math.Matrix2x2" => {
                    let val = label.downcast_ref::<Matrix2x2>().unwrap();
                    assert_eq!(val.determinant(), 1.0);
                }
                "math.Angle" => {
                    let val = label.downcast_ref::<f64>().unwrap();
                    assert!((val - std::f64::consts::PI / 4.0).abs() < 1e-10);
                }
                "math.Integer" => {
                    let val = label.downcast_ref::<i64>().unwrap();
                    assert_eq!(*val, 42);
                }
                _ => panic!("Unexpected label type: {}", label.get_type_name()),
            }
        }
    }
}
