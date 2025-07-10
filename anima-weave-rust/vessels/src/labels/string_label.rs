use anima_weave_core::semantic_label;

semantic_label! {
    /// String语义标签 - 文本数据的基础类型
    ///
    /// 根据数学定义1：𝒮 = {String, Number, Prompt, ...}
    /// String是数据语义标签集合中的基础文本类型
    ///
    /// String的特点：
    /// - 承载文本数据，是多数转换的目标类型
    /// - 不支持向其他类型的转换（作为最终形式）
    /// - 常用于调试输出和文本显示
    ///
    /// # 字段
    ///
    /// * `value` - 存储的字符串值
    ///
    /// # 示例
    ///
    /// ```rust
    /// use anima_weave_vessels::StringLabel;
    ///
    /// let text = StringLabel {
    ///     value: "Hello, World!".to_string()
    /// };
    /// assert_eq!(text.value, "Hello, World!");
    /// ```
    StringLabel(value: String) {
        // String不转换为其他类型
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anima_weave_core::{SemanticLabel, label::TransformError};

    #[test]
    fn test_string_label_creation() {
        let string = StringLabel {
            value: "test".to_string(),
        };

        assert_eq!(string.value, "test");
        assert_eq!(string.get_semantic_label_type(), "StringLabel");
    }

    #[test]
    fn test_string_label_no_conversions() {
        let string = StringLabel {
            value: "test".to_string(),
        };

        // StringLabel没有定义任何转换
        let conversion_map = string.conversion_map();
        assert!(conversion_map.is_empty());

        // 尝试转换到不存在的类型应该失败
        let result = string.try_convert_to("NonExistentType");
        assert!(result.is_err());

        if let Err(TransformError::IncompatibleTypes { from, to }) = result {
            assert_eq!(from, "StringLabel");
            assert_eq!(to, "NonExistentType");
        } else {
            panic!("应该返回IncompatibleTypes错误");
        }
    }
}
