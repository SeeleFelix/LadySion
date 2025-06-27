use crate::labels::{NumberLabel, PromptLabel, StringLabel};
use anima_weave_core::SemanticLabel;

/// 常量节点 - 输出固定值
#[derive(Debug, Clone)]
pub struct ConstantNode<T: SemanticLabel + Clone> {
    pub value: T,
}

impl<T: SemanticLabel + Clone> ConstantNode<T> {
    pub fn new(value: T) -> Self {
        Self { value }
    }

    pub fn execute(&self) -> Box<dyn SemanticLabel> {
        Box::new(self.value.clone())
    }
}

/// 加法节点 - 两个数字相加
#[derive(Debug, Clone)]
pub struct AddNode;

impl AddNode {
    pub fn execute(&self, a: &NumberLabel, b: &NumberLabel) -> NumberLabel {
        NumberLabel {
            value: a.value + b.value,
        }
    }
}

/// 字符串连接节点
#[derive(Debug, Clone)]
pub struct ConcatNode;

impl ConcatNode {
    pub fn execute(&self, a: &StringLabel, b: &StringLabel) -> StringLabel {
        StringLabel {
            value: format!("{}{}", a.value, b.value),
        }
    }
}

/// 提示词模板节点 - 将变量插入到提示词模板中
#[derive(Debug, Clone)]
pub struct PromptTemplateNode {
    pub template: String,
}

impl PromptTemplateNode {
    pub fn new(template: String) -> Self {
        Self { template }
    }

    pub fn execute(&self, variables: &[(&str, &dyn SemanticLabel)]) -> PromptLabel {
        let mut result = self.template.clone();

        for (key, value) in variables {
            let placeholder = format!("{{{}}}", key);
            let replacement = match value.try_convert_to("String") {
                Ok(string_label) => {
                    if let Some(s) = string_label.as_any().downcast_ref::<StringLabel>() {
                        s.value.clone()
                    } else {
                        format!("{:?}", value)
                    }
                }
                Err(_) => format!("{:?}", value),
            };
            result = result.replace(&placeholder, &replacement);
        }

        PromptLabel { content: result }
    }
}
