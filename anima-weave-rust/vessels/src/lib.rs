pub mod labels;
pub mod nodes;

pub use labels::{number_label::NumberLabel, prompt_label::PromptLabel, string_label::StringLabel};

pub use nodes::{AddNode, RandomNode, StartNode};

pub use anima_weave_node::{
    Node, create_node_by_type, create_node_factory, get_registered_node_types,
};

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
        // 所有标签都应该有不同的type_name
        assert_ne!(
            number.get_semantic_label_type(),
            string.get_semantic_label_type()
        );
        assert_ne!(
            number.get_semantic_label_type(),
            prompt.get_semantic_label_type()
        );
        assert_ne!(
            string.get_semantic_label_type(),
            prompt.get_semantic_label_type()
        );

        // 但都应该实现SemanticLabel trait
        let number_as_trait: &dyn SemanticLabel = &number;
        let string_as_trait: &dyn SemanticLabel = &string;
        let prompt_as_trait: &dyn SemanticLabel = &prompt;

        assert_eq!(number_as_trait.get_semantic_label_type(), "NumberLabel");
        assert_eq!(string_as_trait.get_semantic_label_type(), "StringLabel");
        assert_eq!(prompt_as_trait.get_semantic_label_type(), "PromptLabel");
    }

    #[test]
    fn test_conversion_graph_completeness() {
        // 测试转换图的完整性：验证所有转换路径都可达StringLabel
        let number = NumberLabel { value: 42.0 };
        let prompt = PromptLabel {
            content: "Hello".to_string(),
        };

        // 所有类型都应该能转换到StringLabel
        let number_to_string = number.try_convert_to("super::StringLabel");
        let prompt_to_string = prompt.try_convert_to("super::StringLabel");

        assert!(number_to_string.is_ok());
        assert!(prompt_to_string.is_ok());

        // 验证转换结果都是StringLabel类型
        assert_eq!(
            number_to_string.unwrap().get_semantic_label_type(),
            "StringLabel"
        );
        assert_eq!(
            prompt_to_string.unwrap().get_semantic_label_type(),
            "StringLabel"
        );
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
        ];

        // 每个标签都应该有唯一的类型名
        let mut type_names = std::collections::HashSet::new();
        for label in &labels {
            assert!(type_names.insert(label.get_semantic_label_type()));
        }

        // 应该有4种不同的类型
        assert_eq!(type_names.len(), 3);

        // 每个标签都应该支持as_any转换
        for label in &labels {
            let any_ref = label.as_any();
            assert!(
                any_ref.is::<NumberLabel>()
                    || any_ref.is::<StringLabel>()
                    || any_ref.is::<PromptLabel>()
            );
        }
    }

    #[test]
    fn test_node_registration_system() {
        // 测试节点注册系统
        let factory = create_node_factory();

        // 应该至少有StartNode和AddNode
        assert!(factory.len() >= 2);

        // 测试根据类型创建节点
        let start_node = create_node_by_type("StartNode");
        let add_node = create_node_by_type("AddNode");

        assert!(start_node.is_some());
        assert!(add_node.is_some());

        if let Some(node) = start_node {
            let info = node.info();
            assert_eq!(info.name, "StartNode");
        }

        if let Some(node) = add_node {
            let info = node.info();
            assert_eq!(info.name, "AddNode");
        }
    }
}
