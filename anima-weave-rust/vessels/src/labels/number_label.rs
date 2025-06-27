use anima_weave_core::semantic_label;

semantic_label! {
    /// Number语义标签 - 数值数据类型
    ///
    /// 根据数学定义1：𝒮 = {String, Number, Prompt, ...}
    /// Number是数据语义标签集合中的数值类型
    ///
    /// Number的特点：
    /// - 承载浮点数值数据，支持数学运算
    /// - 可以转换为String用于显示和调试
    /// - 是数值计算节点的主要数据类型
    ///
    /// # 字段
    ///
    /// * `value` - 存储的f64数值
    ///
    /// # 转换
    ///
    /// * `StringLabel` - 将数值转换为字符串表示
    ///
    /// # 示例
    ///
    /// ```rust
    /// use anima_weave_vessels::NumberLabel;
    /// use anima_weave_core::SemanticLabel;
    ///
    /// let number = NumberLabel { value: 42.5 };
    /// let result = number.try_convert_to("super::StringLabel");
    /// assert!(result.is_ok());
    /// ```
    NumberLabel(value: f64) {
        super::StringLabel => |this| super::StringLabel { value: this.value.to_string() },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::StringLabel;
    use anima_weave_core::SemanticLabel;

    #[test]
    fn test_number_label_creation() {
        let number = NumberLabel { value: 42.5 };

        assert_eq!(number.value, 42.5);
        assert_eq!(number.type_name(), "NumberLabel");
    }

    #[test]
    fn test_number_to_string_conversion() {
        let number = NumberLabel { value: 42.5 };

        // 测试转换功能
        let conversion_map = number.conversion_map();
        assert!(conversion_map.contains_key("super::StringLabel"));

        // 执行实际转换
        let result = number.try_convert_to("super::StringLabel");
        assert!(result.is_ok());

        let converted = result.unwrap();
        assert_eq!(converted.type_name(), "StringLabel");

        // 验证转换后的值
        if let Some(string_label) = converted.as_any().downcast_ref::<StringLabel>() {
            assert_eq!(string_label.value, "42.5");
        } else {
            panic!("转换结果不是StringLabel类型");
        }
    }

    #[test]
    fn test_number_integer_conversion() {
        let number = NumberLabel { value: 123.0 };

        let result = number.try_convert_to("super::StringLabel");
        assert!(result.is_ok());

        if let Some(string_label) = result.unwrap().as_any().downcast_ref::<StringLabel>() {
            assert_eq!(string_label.value, "123");
        }
    }
}
