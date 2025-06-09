// Anima Weave Parser Library

use pest_derive::Parser;
use std::fs;
use std::path::Path;

// Pest语法解析器
#[derive(Parser)]
#[grammar = "anima-weave.pest"]
struct AnimaWeaveParser;

// 解析结果类型
#[derive(Debug, PartialEq)]
pub enum ParseError {
    FileNotFound,
    ParseFailed(String),
    InvalidTypeName,
    InvalidSyntax(String),
}

// 基础数据类型
#[derive(Debug, PartialEq, Clone)]
pub enum DataType {
    Int,
    String,
    Double,
    Bool,
    Custom(String),
}

// Types section的解析结果
#[derive(Debug, PartialEq)]
pub struct TypesSection {
    pub types: Vec<DataType>,
}

// 完整的Anima文件解析结果
#[derive(Debug, PartialEq)]
pub struct AnimaDefinition {
    pub types_section: Option<TypesSection>,
    // 后续可以添加其他section
}

// 主要的解析函数
pub fn parse_anima_file<P: AsRef<Path>>(path: P) -> Result<AnimaDefinition, ParseError> {
    // 1. 加载文件
    let content = fs::read_to_string(path).map_err(|_| ParseError::FileNotFound)?;
    
    // 2. 解析DSL语法
    parse_anima_content(&content)
}

pub fn parse_anima_content(content: &str) -> Result<AnimaDefinition, ParseError> {
    use pest::Parser;
    
    // 使用pest解析器解析内容
    let pairs = AnimaWeaveParser::parse(Rule::AnimaWeave_file, content)
        .map_err(|e| ParseError::ParseFailed(format!("Pest error: {}", e)))?;
    
    let mut types_section = None;
    
    // 解析AST
    for pair in pairs {
        match pair.as_rule() {
            Rule::AnimaWeave_file => {
                for inner_pair in pair.into_inner() {
                    match inner_pair.as_rule() {
                        Rule::file_content => {
                            types_section = parse_file_content(inner_pair)?;
                        }
                        Rule::EOI => break,
                        _ => {}
                    }
                }
            }
            _ => {}
        }
    }
    
    Ok(AnimaDefinition { types_section })
}

fn parse_file_content(pair: pest::iterators::Pair<Rule>) -> Result<Option<TypesSection>, ParseError> {
    let mut types_section = None;
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::definition_file => {
                types_section = parse_definition_file(inner_pair)?;
            }
            Rule::graph_file => {
                // Graph files don't have types section yet
                // 暂时返回None，后续实现graph file解析
            }
            _ => {}
        }
    }
    
    Ok(types_section)
}

fn parse_definition_file(pair: pest::iterators::Pair<Rule>) -> Result<Option<TypesSection>, ParseError> {
    let mut types_section = None;
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::types_section => {
                types_section = Some(parse_types_section(inner_pair)?);
            }
            Rule::import_section => {
                // 暂时忽略import section
            }
            Rule::nodes_section => {
                // 暂时忽略nodes section
            }
            _ => {}
        }
    }
    
    Ok(types_section)
}

fn parse_types_section(pair: pest::iterators::Pair<Rule>) -> Result<TypesSection, ParseError> {
    let mut types = Vec::new();
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::type_definition => {
                let type_name = parse_type_definition(inner_pair)?;
                types.push(type_name);
            }
            _ => {}
        }
    }
    
    Ok(TypesSection { types })
}

fn parse_type_definition(pair: pest::iterators::Pair<Rule>) -> Result<DataType, ParseError> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::type_name => {
                return parse_type_name(inner_pair);
            }
            _ => {}
        }
    }
    Err(ParseError::InvalidSyntax("No type name found".to_string()))
}

fn parse_type_name(pair: pest::iterators::Pair<Rule>) -> Result<DataType, ParseError> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::qualified_name => {
                let type_str = inner_pair.as_str().trim();
                
                return match type_str {
                    "int" => Ok(DataType::Int),
                    "string" => Ok(DataType::String),
                    "double" => Ok(DataType::Double),
                    "bool" => Ok(DataType::Bool),
                    _ => {
                        // 检查是否是有效的标识符
                        if is_valid_identifier(type_str) {
                            Ok(DataType::Custom(type_str.to_string()))
                        } else {
                            Err(ParseError::InvalidTypeName)
                        }
                    }
                };
            }
            _ => {}
        }
    }
    Err(ParseError::InvalidSyntax("No qualified name found".to_string()))
}

fn is_valid_identifier(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }
    
    // 按照pest语法中的identifier规则：letter ~ (letter | digit | "_")*
    let mut chars = s.chars();
    
    // 第一个字符必须是字母或下划线
    if let Some(first_char) = chars.next() {
        if !first_char.is_ascii_alphabetic() && first_char != '_' {
            return false;
        }
    } else {
        return false;
    }
    
    // 其余字符必须是字母、数字或下划线
    for ch in chars {
        if !ch.is_ascii_alphanumeric() && ch != '_' {
            return false;
        }
    }
    
    true
} 