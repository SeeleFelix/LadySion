use anima_weave_core::semantic_label;

semantic_label! {
    /// Prompt语义标签 - 提示文本类型
    ///
    /// 根据数学定义1：𝒮 = {String, Number, Prompt, ...}
    /// Prompt是数据语义标签集合中的提示文本类型
    ///
    /// Prompt的特点：
    /// - 专门用于存储AI提示内容
    /// - 可以转换为String用于传递给语言模型
    /// - 支持结构化的提示文本管理
    ///
    /// # 字段
    ///
    /// * `content` - 存储的提示文本内容
    ///
    /// # 转换
    ///
    /// * `StringLabel` - 提取提示内容为普通字符串
    ///
    /// # 示例
    ///
    /// ```rust
    /// use anima_weave_vessels::PromptLabel;
    /// use anima_weave_core::SemanticLabel;
    ///
    /// let prompt = PromptLabel {
    ///     content: "请分析这段代码".to_string()
    /// };
    /// let result = prompt.try_convert_to("super::StringLabel");
    /// assert!(result.is_ok());
    /// ```
    PromptLabel(content: String) {
        super::StringLabel => |this| super::StringLabel { value: this.content.clone() },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::StringLabel;
    use anima_weave_core::SemanticLabel;

    #[test]
    fn test_prompt_label_creation() {
        let prompt = PromptLabel {
            content: "Hello World".to_string(),
        };

        assert_eq!(prompt.content, "Hello World");
        assert_eq!(prompt.get_semantic_label_type(), "PromptLabel");
    }

    #[test]
    fn test_prompt_to_string_conversion() {
        let prompt = PromptLabel {
            content: "Hello World".to_string(),
        };

        // 测试转换到字符串
        let result = prompt.try_convert_to("super::StringLabel");
        assert!(result.is_ok());

        let converted = result.unwrap();
        if let Some(string_label) = converted.as_any().downcast_ref::<StringLabel>() {
            assert_eq!(string_label.value, "Hello World");
        } else {
            panic!("转换结果不是StringLabel类型");
        }
    }

    #[test]
    fn test_prompt_empty_content() {
        let prompt = PromptLabel {
            content: "".to_string(),
        };

        let result = prompt.try_convert_to("super::StringLabel");
        assert!(result.is_ok());

        if let Some(string_label) = result.unwrap().as_any().downcast_ref::<StringLabel>() {
            assert_eq!(string_label.value, "");
        }
    }
}
