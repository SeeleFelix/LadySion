// TODO: 这些API还没有实现，暂时注释掉
// 
// // T1.1 基础数据类型解析 - 集成测试
// // 对应数学定义1: 数据类型集合 𝒯
// // 测试场景T1.1.1-T1.1.8
// 
// use anima_weave::{parse_anima_content, parse_anima_file, DataType, ParseError};
// use std::io::Write;
// use tempfile::NamedTempFile;
// 
// /// T1.1.1: 单个基础类型在types section中解析
// /// 验证最基本的DSL结构能够被正确解析
// #[test]
// fn single_basic_type_in_types_section() {
//     let content = "-- types\nint\n--";
//     let result = parse_anima_content(content);
//     
//     assert!(result.is_ok(), "应该成功解析单个基础类型");
//     
//     let def = result.unwrap();
//     assert!(def.types_section.is_some(), "应该包含types section");
//     
//     let types_section = def.types_section.unwrap();
//     assert_eq!(types_section.types.len(), 1, "应该只有一个类型");
//     assert_eq!(types_section.types[0], DataType::Int, "应该是int类型");
// }
// 
// /// T1.1.2: 多个基础类型在types section中解析
// /// 验证多种基础数据类型能够在同一个section中解析
// #[test]
// fn multiple_basic_types_in_types_section() {
//     let content = "-- types\nint\nstring\ndouble\nbool\n--";
//     let result = parse_anima_content(content);
//     
//     assert!(result.is_ok(), "应该成功解析多个基础类型");
//     
//     let def = result.unwrap();
//     assert!(def.types_section.is_some(), "应该包含types section");
//     
//     let types_section = def.types_section.unwrap();
//     assert_eq!(types_section.types.len(), 4, "应该有四个类型");
//     
//     // 验证所有基础类型都被正确解析
//     assert!(types_section.types.contains(&DataType::Int), "应该包含int类型");
//     assert!(types_section.types.contains(&DataType::String), "应该包含string类型");
//     assert!(types_section.types.contains(&DataType::Double), "应该包含double类型");
//     assert!(types_section.types.contains(&DataType::Bool), "应该包含bool类型");
// }
// 
// /// T1.1.3: types section文件加载
// /// 验证从文件系统加载.anima文件的能力
// #[test]
// fn types_section_file_loading() {
//     let mut temp_file = NamedTempFile::new().unwrap();
//     writeln!(temp_file, "-- types").unwrap();
//     writeln!(temp_file, "int").unwrap();
//     writeln!(temp_file, "string").unwrap();
//     writeln!(temp_file, "double").unwrap();
//     writeln!(temp_file, "--").unwrap();
//     
//     let result = parse_anima_file(temp_file.path());
//     
//     assert!(result.is_ok(), "应该成功从文件加载types section");
//     
//     let def = result.unwrap();
//     assert!(def.types_section.is_some(), "文件应该包含types section");
//     
//     let types_section = def.types_section.unwrap();
//     assert_eq!(types_section.types.len(), 3, "应该有三个类型");
// }
// 
// /// T1.1.4: 无效类型名称在types section中的错误处理
// /// 验证语法检查能够捕获无效的标识符
// #[test]
// fn invalid_type_name_error_handling() {
//     let content = "-- types\n123invalid\n--";
//     let result = parse_anima_content(content);
//     
//     assert!(result.is_err(), "应该拒绝以数字开头的标识符");
//     
//     // 验证错误类型合理（可能是ParseFailed而不是InvalidTypeName，
//     // 因为这应该在pest语法层面就失败）
//     match result.unwrap_err() {
//         ParseError::ParseFailed(_) | ParseError::InvalidTypeName => {
//             // 两种错误都是可接受的，取决于在哪一层检查失败
//         }
//         other => panic!("意外的错误类型: {:?}", other),
//     }
// }
// 
// /// T1.1.5: 空types section处理
// /// 验证空section的正确处理
// #[test]
// fn empty_types_section_handling() {
//     let content = "-- types\n--";
//     let result = parse_anima_content(content);
//     
//     assert!(result.is_ok(), "应该成功解析空的types section");
//     
//     let def = result.unwrap();
//     assert!(def.types_section.is_some(), "应该包含types section");
//     
//     let types_section = def.types_section.unwrap();
//     assert_eq!(types_section.types.len(), 0, "空section应该包含零个类型");
// }
// 
// /// T1.1.6: 类型名称标识符规则验证
// /// 验证各种有效标识符格式都能被正确识别
// #[test]
// fn type_name_identifier_rules_validation() {
//     let content = "-- types\nINT\nInt\nint\n_valid\n--";
//     let result = parse_anima_content(content);
//     
//     assert!(result.is_ok(), "应该成功解析各种有效标识符");
//     
//     let def = result.unwrap();
//     assert!(def.types_section.is_some(), "应该包含types section");
//     
//     let types_section = def.types_section.unwrap();
//     assert_eq!(types_section.types.len(), 4, "应该解析出4个有效标识符");
//     
//     // 验证大小写敏感和下划线开头的标识符都被支持
//     let type_names: Vec<String> = types_section.types.iter()
//         .filter_map(|t| match t {
//             DataType::Custom(name) => Some(name.clone()),
//             DataType::Int => Some("int".to_string()),
//             _ => None,
//         })
//         .collect();
//     
//     assert!(type_names.contains(&"INT".to_string()), "应该支持大写标识符");
//     assert!(type_names.contains(&"Int".to_string()), "应该支持混合大小写标识符");
//     assert!(type_names.contains(&"_valid".to_string()), "应该支持下划线开头的标识符");
// }
// 
// /// T1.1.7: types section格式验证
// /// 验证DSL的空格容忍性
// #[test]
// fn types_section_format_validation() {
//     let content = "--  types  \n  int  \n  string  \n--";
//     let result = parse_anima_content(content);
//     
//     assert!(result.is_ok(), "应该容忍额外的空格");
//     
//     let def = result.unwrap();
//     assert!(def.types_section.is_some(), "应该包含types section");
//     
//     let types_section = def.types_section.unwrap();
//     assert_eq!(types_section.types.len(), 2, "应该正确解析带空格的类型");
//     
//     // 验证空格被正确处理，类型名正确识别
//     assert!(types_section.types.contains(&DataType::Int), "应该识别int类型");
//     assert!(types_section.types.contains(&DataType::String), "应该识别string类型");
// }
// 
// /// T1.1.8: 不完整types section错误处理
// /// 验证语法检查能够捕获不完整的section
// #[test]
// fn incomplete_types_section_error_handling() {
//     let content = "-- types\nint\nstring";  // 缺少结束标记 "--"
//     let result = parse_anima_content(content);
//     
//     assert!(result.is_err(), "应该拒绝缺少结束标记的section");
//     
//     // 这应该是解析错误，因为语法不完整
//     match result.unwrap_err() {
//         ParseError::ParseFailed(_) => {
//             // 预期的错误类型
//         }
//         other => panic!("意外的错误类型，应该是ParseFailed: {:?}", other),
//     }
// } 