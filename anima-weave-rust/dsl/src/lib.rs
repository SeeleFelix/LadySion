use anima_weave_core::Graph;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ParseError {
    #[error("Parse error: {0}")]
    ParseError(String),
}

/// 解析trait
pub trait Parse {
    fn parse(&self, content: &str) -> Result<Graph, ParseError>;
}

/// DSL解析器
pub struct DslParser;

impl Parse for DslParser {
    fn parse(&self, _content: &str) -> Result<Graph, ParseError> {
        Err(ParseError::ParseError(
            "DSL解析器尚未实现，请使用程序化方式构建Graph".to_string(),
        ))
    }
}
