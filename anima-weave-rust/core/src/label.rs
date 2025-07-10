use std::any::Any;
use std::collections::HashMap;
use std::fmt::Debug;

/// 转换错误类型
#[derive(Debug, Clone)]
pub enum TransformError {
    IncompatibleTypes {
        from: &'static str,
        to: &'static str,
    },
    ConversionFailed {
        reason: String,
    },
}

impl std::fmt::Display for TransformError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TransformError::IncompatibleTypes { from, to } => {
                write!(f, "Incompatible types: {} -> {}", from, to)
            }
            TransformError::ConversionFailed { reason } => {
                write!(f, "Conversion failed: {}", reason)
            }
        }
    }
}

impl std::error::Error for TransformError {}

// 允许 Box<dyn SemanticLabel> 派生 Clone
impl Clone for Box<dyn SemanticLabel> {
    fn clone(&self) -> Self {
        self.clone_box()
    }
}

/// 转换函数类型
pub type ConversionFn =
    Box<dyn Fn(&dyn Any) -> Result<Box<dyn SemanticLabel>, TransformError> + Send + Sync>;

/// 语义标签trait - 对应数学定义中的 ℒ = {Int, Bool, String, Array\[T\], ...}
///
/// 设计原则：
/// 1. 不可变性：语义标签一旦创建就不能修改，只能通过转换创建新的标签
/// 2. 类型安全：通过trait保证类型检查和兼容性验证
/// 3. Actor友好：支持Send + Sync，可以安全地在Actor间传递
/// 4. 自主转换：语义标签知道如何转换到其他兼容类型
///
/// 使用场景：
/// 1. 静态分析：通过conversion_map()获取转换关系，用于验证图连接合法性
/// 2. 运行时转换：通过try_convert_to()执行实际的类型转换
pub trait SemanticLabel: Send + Sync + Debug + 'static {
    /// 克隆trait object
    ///
    /// 这是在Rust中克隆trait object的标准方法
    fn clone_box(&self) -> Box<dyn SemanticLabel>;

    /// 获取语义标签类型名称（关联函数）
    fn semantic_label_type() -> &'static str
    where
        Self: Sized;

    /// 获取语义标签类型名称（实例方法，用于trait object）
    fn get_semantic_label_type(&self) -> &'static str;

    /// 类型擦除访问（只读）
    ///
    /// 默认实现：所有类型都是返回 self
    /// 可以在具体类型中省略此方法的实现
    fn as_any(&self) -> &dyn Any;

    /// 获取转换关系映射 - 用于静态分析转换关系
    ///
    /// 返回值：目标类型名 -> 转换函数的映射
    /// 这个方法可以被代码分析工具扫描，用于：
    /// - UI显示可连接的端口类型
    /// - 验证图连接的合法性
    /// - 生成类型转换文档
    fn conversion_map(&self) -> HashMap<&'static str, ConversionFn>;

    /// 获取支持的转换目标类型列表（用于静态分析）
    fn supported_conversions(&self) -> Vec<&'static str> {
        self.conversion_map().keys().cloned().collect()
    }

    /// 尝试转换到指定类型 - 运行时实际转换
    ///
    /// 在Event传递时使用，将一个节点的输出转换为下一个节点需要的输入类型
    ///
    /// 默认实现：
    /// 1. 从conversion_map()中查找目标类型
    /// 2. 如果找到转换函数，执行转换
    /// 3. 返回转换结果或相应错误
    ///
    /// 具体类型通常不需要重写此方法，只需要实现conversion_map()即可
    fn try_convert_to(
        &self,
        target_type: &'static str,
    ) -> Result<Box<dyn SemanticLabel>, TransformError> {
        let conversion_map = self.conversion_map();

        match conversion_map.get(target_type) {
            Some(conversion_fn) => conversion_fn(self.as_any()),
            None => Err(TransformError::IncompatibleTypes {
                from: self.get_semantic_label_type(),
                to: target_type,
            }),
        }
    }
}

/// 定义语义标签的宏 - 自动化所有样板代码
///
/// 使用方式：
/// ```rust
/// use anima_weave_core::semantic_label;
///
/// // 先定义所需的标签类型
/// semantic_label! {
///     StringLabel(value: String) {
///         // 无转换
///     }
/// }
///
/// semantic_label! {
///     NumberLabel(value: f64) {
///         StringLabel => |this| StringLabel { value: this.value.to_string() },
///     }
/// }
///
/// // 多字段，使用完整类型路径作为转换目标
/// semantic_label! {
///     ComplexLabel(x: f64, y: f64, name: String) {
///         StringLabel => |this| StringLabel { value: format!("({}, {}, {})", this.x, this.y, this.name) },
///         NumberLabel => |this| NumberLabel { value: this.x + this.y },
///     }
/// }
/// ```
///
/// 编译时检查：
/// - 转换目标类型必须存在（编译器验证路径）
/// - 转换函数签名自动匹配 ConversionFn
///
/// 自动生成：
/// - struct 定义 (Debug + Clone)
/// - type_name() 返回类型名字符串
/// - as_any() 标准实现  
/// - conversion_map() 基于转换规则
/// - try_convert_to() 默认实现
#[macro_export]
macro_rules! semantic_label {
    // 支持完整类型路径的语法：编译时类型检查
    ($(#[$attr:meta])* $name:ident($($field:ident: $field_type:ty),* $(,)?) {
        $($target_type:path => |$self_param:ident| $conversion:expr,)*
    }) => {
        $(#[$attr])*
        #[derive(Debug, Clone)]
        pub struct $name {
            $(pub $field: $field_type,)*
        }

        impl $crate::label::SemanticLabel for $name {
            fn clone_box(&self) -> Box<dyn $crate::label::SemanticLabel> {
                Box::new(self.clone())
            }

            fn semantic_label_type() -> &'static str where Self: Sized {
                stringify!($name)
            }

            fn get_semantic_label_type(&self) -> &'static str {
                Self::semantic_label_type()
            }

            fn as_any(&self) -> &dyn std::any::Any {
                self
            }

            fn conversion_map(&self) -> std::collections::HashMap<&'static str, $crate::label::ConversionFn> {
                #[allow(unused_mut)]
                let mut map = std::collections::HashMap::new();

                $(
                    // 使用临时实例获取目标类型的真实 type_name
                    let target_type_name = {
                        // 这里我们使用一个技巧：通过类型推断获取类型名
                        // 由于我们不能直接构造实例，我们用 stringify! 作为 fallback
                        // 但这确保了 $target_type 路径在编译时被验证
                        let _type_check: Option<$target_type> = None; // 编译时类型检查
                        stringify!($target_type)
                    };

                    map.insert(target_type_name, Box::new(|any: &dyn std::any::Any| -> Result<Box<dyn $crate::label::SemanticLabel>, $crate::label::TransformError> {
                        if let Some($self_param) = any.downcast_ref::<$name>() {
                            // 确保转换结果类型正确
                            let result: $target_type = $conversion;
                            Ok(Box::new(result) as Box<dyn $crate::label::SemanticLabel>)
                        } else {
                            Err($crate::label::TransformError::ConversionFailed {
                                reason: format!("Failed to downcast to {}", stringify!($name)),
                            })
                        }
                    }) as $crate::label::ConversionFn);
                )*

                map
            }
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    // 测试宏生成单字段结构
    semantic_label! {
        TestStringLabel(value: String) {
            TestNumberLabel => |this| TestNumberLabel { value: this.value.len() as f64 },
        }
    }

    // 测试宏生成多字段结构
    semantic_label! {
        TestComplexLabel(x: f64, y: f64, name: String) {
            TestStringLabel => |this| TestStringLabel {
                value: format!("({}, {}, {})", this.x, this.y, this.name)
            },
            TestNumberLabel => |this| TestNumberLabel { value: this.x + this.y },
        }
    }

    // 测试宏生成无转换的结构
    semantic_label! {
        TestNumberLabel(value: f64) {
            // 无转换
        }
    }

    #[test]
    fn test_single_field_label() {
        let label = TestStringLabel {
            value: "hello".to_string(),
        };

        // 测试 type_name
        assert_eq!(label.get_semantic_label_type(), "TestStringLabel");

        // 测试 as_any
        let any_ref = label.as_any();
        assert!(any_ref.downcast_ref::<TestStringLabel>().is_some());

        // 测试 conversion_map
        let conversions = label.conversion_map();
        assert_eq!(conversions.len(), 1);
        assert!(conversions.contains_key("TestNumberLabel"));

        // 测试 supported_conversions
        let supported = label.supported_conversions();
        assert_eq!(supported.len(), 1);
        assert!(supported.contains(&"TestNumberLabel"));
    }

    #[test]
    fn test_multi_field_label() {
        let label = TestComplexLabel {
            x: 1.0,
            y: 2.0,
            name: "test".to_string(),
        };

        // 测试 type_name
        assert_eq!(label.get_semantic_label_type(), "TestComplexLabel");

        // 测试转换映射
        let conversions = label.conversion_map();
        assert_eq!(conversions.len(), 2);
        assert!(conversions.contains_key("TestStringLabel"));
        assert!(conversions.contains_key("TestNumberLabel"));
    }

    #[test]
    fn test_no_conversion_label() {
        let label = TestNumberLabel { value: 42.0 };

        // 测试 type_name
        assert_eq!(label.get_semantic_label_type(), "TestNumberLabel");

        // 测试无转换
        let conversions = label.conversion_map();
        assert_eq!(conversions.len(), 0);

        let supported = label.supported_conversions();
        assert_eq!(supported.len(), 0);
    }

    #[test]
    fn test_actual_conversion() {
        let string_label = TestStringLabel {
            value: "hello".to_string(),
        };

        // 测试实际转换
        let result = string_label.try_convert_to("TestNumberLabel");
        assert!(result.is_ok());

        let converted: Box<dyn SemanticLabel + 'static> = result.unwrap();
        assert_eq!(converted.get_semantic_label_type(), "TestNumberLabel");

        // 验证转换后的值
        let number_label = converted
            .as_any()
            .downcast_ref::<TestNumberLabel>()
            .unwrap();
        assert_eq!(number_label.value, 5.0); // "hello".len() = 5
    }

    #[test]
    fn test_complex_conversion() {
        let complex_label = TestComplexLabel {
            x: 1.5,
            y: 2.5,
            name: "test".to_string(),
        };

        // 测试转换为 String
        let string_result = complex_label.try_convert_to("TestStringLabel").unwrap();
        let string_label = string_result
            .as_any()
            .downcast_ref::<TestStringLabel>()
            .unwrap();
        assert_eq!(string_label.value, "(1.5, 2.5, test)");

        // 测试转换为 Number
        let number_result = complex_label.try_convert_to("TestNumberLabel").unwrap();
        let number_label = number_result
            .as_any()
            .downcast_ref::<TestNumberLabel>()
            .unwrap();
        assert_eq!(number_label.value, 4.0); // 1.5 + 2.5
    }

    #[test]
    fn test_unsupported_conversion() {
        let label = TestStringLabel {
            value: "test".to_string(),
        };

        // 测试不支持的转换
        let result = label.try_convert_to("UnsupportedType");
        assert!(result.is_err());

        if let Err(TransformError::IncompatibleTypes { from, to }) = result {
            assert_eq!(from, "TestStringLabel");
            assert_eq!(to, "UnsupportedType");
        } else {
            panic!("错误类型不正确");
        }
    }
}
