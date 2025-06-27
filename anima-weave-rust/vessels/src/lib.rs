pub mod labels;
pub mod nodes;

pub use labels::{NumberLabel, PromptLabel, SignalLabel, StringLabel};
pub use nodes::*;

#[cfg(test)]
mod integration_tests {
    use super::*;
    use anima_weave_core::SemanticLabel;

    #[test]
    fn test_cross_package_type_consistency() {
        // 测试跨包类型的一致性
        let number = NumberLabel { value: 123.0 };
        let string = StringLabel {
            value: "123".to_string(),
        };
        let prompt = PromptLabel {
            content: "test".to_string(),
        };
        let signal = SignalLabel::active();

        // 所有标签都应该有不同的type_name
        assert_ne!(number.type_name(), string.type_name());
        assert_ne!(number.type_name(), prompt.type_name());
        assert_ne!(number.type_name(), signal.type_name());
        assert_ne!(string.type_name(), prompt.type_name());
        assert_ne!(string.type_name(), signal.type_name());
        assert_ne!(prompt.type_name(), signal.type_name());

        // 但都应该实现SemanticLabel trait
        let number_as_trait: &dyn SemanticLabel = &number;
        let string_as_trait: &dyn SemanticLabel = &string;
        let prompt_as_trait: &dyn SemanticLabel = &prompt;
        let signal_as_trait: &dyn SemanticLabel = &signal;

        assert_eq!(number_as_trait.type_name(), "NumberLabel");
        assert_eq!(string_as_trait.type_name(), "StringLabel");
        assert_eq!(prompt_as_trait.type_name(), "PromptLabel");
        assert_eq!(signal_as_trait.type_name(), "SignalLabel");
    }

    #[test]
    fn test_conversion_graph_completeness() {
        // 测试转换图的完整性：验证所有转换路径都可达StringLabel
        let number = NumberLabel { value: 42.0 };
        let prompt = PromptLabel {
            content: "Hello".to_string(),
        };
        let signal = SignalLabel::active();

        // 所有类型都应该能转换到StringLabel
        let number_to_string = number.try_convert_to("super::StringLabel");
        let prompt_to_string = prompt.try_convert_to("super::StringLabel");
        let signal_to_string = signal.try_convert_to("super::StringLabel");

        assert!(number_to_string.is_ok());
        assert!(prompt_to_string.is_ok());
        assert!(signal_to_string.is_ok());

        // 验证转换结果都是StringLabel类型
        assert_eq!(number_to_string.unwrap().type_name(), "StringLabel");
        assert_eq!(prompt_to_string.unwrap().type_name(), "StringLabel");
        assert_eq!(signal_to_string.unwrap().type_name(), "StringLabel");
    }

    #[test]
    fn test_semantic_label_system_completeness() {
        // 验证整个语义标签系统的完整性
        let labels: Vec<Box<dyn SemanticLabel>> = vec![
            Box::new(NumberLabel { value: 1.0 }),
            Box::new(StringLabel {
                value: "test".to_string(),
            }),
            Box::new(PromptLabel {
                content: "prompt".to_string(),
            }),
            Box::new(SignalLabel::active()),
        ];

        // 每个标签都应该有唯一的类型名
        let mut type_names = std::collections::HashSet::new();
        for label in &labels {
            assert!(type_names.insert(label.type_name()));
        }

        // 应该有4种不同的类型
        assert_eq!(type_names.len(), 4);

        // 每个标签都应该支持as_any转换
        for label in &labels {
            let any_ref = label.as_any();
            assert!(
                any_ref.is::<NumberLabel>()
                    || any_ref.is::<StringLabel>()
                    || any_ref.is::<PromptLabel>()
                    || any_ref.is::<SignalLabel>()
            );
        }
    }
}
