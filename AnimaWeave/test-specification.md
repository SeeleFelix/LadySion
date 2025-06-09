# AnimaWeave Parser 端到端测试规范

## 📋 测试目标

基于Anima Weave DSL的**对外提供能力**设计端到端测试，确保解析器能够正确处理完整的`.anima`和`.weave`文件，并提供准确的语法检查、类型推断和错误报告。

## 🎯 测试分层架构

### 阶段1: 核心解析能力 (Parse Layer)
**对外能力**: 将DSL文本转换为结构化AST

### 阶段2: 静态检查能力 (Check Layer) 
**对外能力**: 提供编译时检查和智能推算

### 阶段3: 执行引擎基础 (Engine Layer)
**对外能力**: 支持基础的节点执行语义

---

## 🔬 阶段1测试用例: 核心解析能力

### T1.1 基础文件结构解析

#### T1.1.1 空定义文件解析
```rust
#[test]
fn test_empty_definition_file() {
    let input = "";
    let result = parse_animaweave(input);
    assert!(result.is_ok());
    assert!(matches!(result.unwrap(), AnimaWeaveFile::Definition(_)));
}
```

#### T1.1.2 空图文件解析  
```rust
#[test]
fn test_empty_graph_file() {
    let input = "-- graph\n--";
    let result = parse_animaweave(input);
    assert!(result.is_ok());
    assert!(matches!(result.unwrap(), AnimaWeaveFile::Graph(_)));
}
```

### T1.2 Import Section解析

#### T1.2.1 简单导入
```rust
#[test]
fn test_simple_import() {
    let input = r#"
-- import
std.math
std.signal
--
"#;
    let result = parse_animaweave(input);
    let ast = result.unwrap();
    // 验证导入了2个模块
}
```

#### T1.2.2 带别名映射的导入
```rust
#[test] 
fn test_import_with_alias() {
    let input = r#"
-- import
std.math {
    Add MyAdd
    Sub MySub
}
--
"#;
    // 验证别名映射正确解析
}
```

### T1.3 Types Section解析

#### T1.3.1 基础类型定义
```rust
#[test]
fn test_basic_type_definition() {
    let input = r#"
-- types
Point = {
    x int
    y int
}

Vector = {
    direction float
    magnitude float
}
--
"#;
    // 验证结构体类型定义
}
```

#### T1.3.2 复杂类型定义
```rust
#[test]
fn test_complex_type_definition() {
    let input = r#"
-- types  
Matrix = {
    data [[float]]
    rows int
    cols int
}

Result<T> = {
    value T
    error string?
}
--
"#;
    // 验证泛型和可选类型
}
```

### T1.4 Nodes Section解析

#### T1.4.1 最简节点定义
```rust
#[test]
fn test_minimal_node_definition() {
    let input = r#"
-- nodes
Add {
    in {
        a int
        b int
    }
    
    out {
        result int
    }
}
--
"#;
    // 验证基础节点结构
}
```

#### T1.4.2 完整节点定义
```rust
#[test]
fn test_complete_node_definition() {
    let input = r#"
-- nodes
Calculator {
    mode Concurrent
    
    in {
        operand1 float
        operand2 float
        operation string
        execute Signal mode=AND
    }
    
    out {
        result float
        error string?
        done Signal
    }
    
    config {
        precision int = 6
        timeout Duration = 5s
    }
}
--
"#;
    // 验证所有节点属性
}
```

### T1.5 Graph Section解析

#### T1.5.1 简单连接图
```rust
#[test]
fn test_simple_connection_graph() {
    let input = r#"
-- graph
input1 -> Add.a
input2 -> Add.b
Add.result -> output
--
"#;
    // 验证基础连接语法
}
```

#### T1.5.2 复杂连接图
```rust
#[test]
fn test_complex_connection_graph() {
    let input = r#"
-- graph
// 多级连接
input -> Processor.data
config -> Processor.settings

// 分支连接
Processor.result -> [Filter.input, Logger.data]
Processor.error -> ErrorHandler.error

// 条件连接
Filter.output -> Aggregator.item if Filter.valid
ErrorHandler.handled -> Logger.error
--
"#;
    // 验证复杂连接模式
}
```

---

## 🔍 阶段2测试用例: 静态检查能力

### T2.1 类型兼容性检查

#### T2.1.1 类型匹配检查
```rust
#[test] 
fn test_type_compatibility_success() {
    let input = r#"
-- nodes
Source { out { value int } }
Sink { in { data int } }
--

-- graph  
Source.value -> Sink.data
--
"#;
    let result = validate_animaweave(input);
    assert!(result.is_ok());
}
```

#### T2.1.2 类型不匹配检查
```rust
#[test]
fn test_type_compatibility_failure() {
    let input = r#"
-- nodes
Source { out { value string } }
Sink { in { data int } }
--

-- graph
Source.value -> Sink.data  // 类型不匹配!
--
"#;
    let result = validate_animaweave(input);
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), 
        AnimaWeaveError::TypeMismatch { .. }));
}
```

### T2.2 DAG循环检测

#### T2.2.1 无循环图检查
```rust
#[test]
fn test_acyclic_graph_validation() {
    let input = r#"
-- graph
A.out -> B.in
B.out -> C.in
C.out -> D.in
--
"#;
    let result = validate_dag(input);
    assert!(result.is_ok());
}
```

#### T2.2.2 循环检测
```rust
#[test] 
fn test_cycle_detection() {
    let input = r#"
-- graph
A.out -> B.in
B.out -> C.in  
C.out -> A.in  // 形成循环!
--
"#;
    let result = validate_dag(input);
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(),
        AnimaWeaveError::CycleDetected { .. }));
}
```

### T2.3 端口自动推算

#### T2.3.1 边界端口推算
```rust
#[test]
fn test_boundary_port_inference() {
    let input = r#"
-- nodes
Add { 
    in { a int, b int }
    out { result int }
}
--

-- graph
input1 -> Add.a  // input1应被推算为边界输入端口
input2 -> Add.b  // input2应被推算为边界输入端口
Add.result -> output  // output应被推算为边界输出端口
--
"#;
    let result = infer_boundary_ports(input);
    let boundary = result.unwrap();
    
    assert_eq!(boundary.inputs.len(), 2);
    assert!(boundary.inputs.contains("input1"));
    assert!(boundary.inputs.contains("input2"));
    
    assert_eq!(boundary.outputs.len(), 1);
    assert!(boundary.outputs.contains("output"));
}
```

---

## 🚀 阶段3测试用例: 执行引擎基础

### T3.1 状态空间建模

#### T3.1.1 节点状态转换
```rust
#[test]
fn test_node_state_transitions() {
    let node = create_test_node("Add");
    
    // 初始状态
    assert_eq!(node.state(), NodeState::Waiting);
    
    // 接收输入后状态变化
    node.receive_input("a", Value::Int(5));
    assert_eq!(node.state(), NodeState::Waiting);
    
    node.receive_input("b", Value::Int(3));
    assert_eq!(node.state(), NodeState::Ready);
    
    // 执行后状态变化
    node.execute();
    assert_eq!(node.state(), NodeState::Completed);
}
```

### T3.2 简单节点执行

#### T3.2.1 数值运算节点
```rust
#[test]
fn test_arithmetic_node_execution() {
    let input = r#"
-- nodes  
Add {
    in { a int, b int }
    out { result int }
}
--
"#;
    
    let graph = build_execution_graph(input).unwrap();
    let add_node = graph.get_node("Add").unwrap();
    
    // 提供输入
    add_node.set_input("a", Value::Int(10));
    add_node.set_input("b", Value::Int(20));
    
    // 执行节点
    let result = add_node.execute();
    assert!(result.is_ok());
    
    // 验证输出
    let output = add_node.get_output("result").unwrap();
    assert_eq!(output, Value::Int(30));
}
```

---

## 📊 错误处理测试用例

### E1 语法错误
```rust
#[test]
fn test_syntax_error_reporting() {
    let input = r#"
-- nodes
Add {
    in {
        a int
        b int  // 缺少分号
    }
    out {
        result int
    }
// 缺少结束括号
"#;
    
    let result = parse_animaweave(input);
    assert!(result.is_err());
    
    if let Err(AnimaWeaveError::ParseError(err)) = result {
        assert!(err.line > 0);
        assert!(err.message.contains("语法错误"));
    }
}
```

### E2 语义错误
```rust
#[test] 
fn test_semantic_error_reporting() {
    let input = r#"
-- nodes
Add {
    in { a int, b int }
    out { result string }  // 输出类型与运算不匹配
}
--
"#;
    
    let result = validate_animaweave(input);
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(),
        AnimaWeaveError::SemanticError { .. }));
}
```

---

## 🎯 对外API接口测试

### API1 主解析接口
```rust
pub fn parse_animaweave(input: &str) -> ParseResult<AnimaWeaveFile>
```

### API2 验证接口  
```rust
pub fn validate_animaweave(input: &str) -> ValidationResult<ValidationReport>
```

### API3 推算接口
```rust
pub fn infer_boundary_ports(input: &str) -> InferenceResult<BoundaryPorts>
```

### API4 执行图构建接口
```rust 
pub fn build_execution_graph(input: &str) -> BuildResult<ExecutionGraph>
```

---

## 📈 性能测试用例

### P1 大规模文件解析
```rust
#[test]
fn test_large_file_parsing() {
    let large_input = generate_large_nodeflow_file(1000); // 1000个节点
    
    let start = Instant::now();
    let result = parse_animaweave(&large_input);
    let duration = start.elapsed();
    
    assert!(result.is_ok());
    assert!(duration < Duration::from_secs(1)); // 1秒内完成
}
```

---

## 🔄 测试数据准备计划

1. **最小示例集** - 每个语法特性的最简单用例
2. **综合示例集** - 真实世界的复杂AnimaWeave文件  
3. **边界用例集** - 测试解析器的边界条件
4. **错误用例集** - 各种语法和语义错误的示例
5. **性能用例集** - 大规模文件和复杂图结构

让我们从这些测试用例开始，逐步实现对应的功能！ 