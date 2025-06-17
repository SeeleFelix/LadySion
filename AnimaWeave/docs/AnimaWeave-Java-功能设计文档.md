# AnimaWeave Java版本 功能设计文档

## 📋 文档概述

本文档基于AnimaWeave项目的完整开发历史，为Java/Spring Boot版本制定详细的功能规格和实现方案。

### 📚 历史研究依据

- **Deno/TypeScript版本** (`anima-weave/`) - 完整实现，32个数学定义验证
- **Rust版本** (`AnimaWeave-back/`) - Actor模型、事件驱动设计
- **数学理论基础** - 控制流与数据流分离的32个形式化定义
- **实施策略文档** - Lady Sion项目的核心理解和简化方案

## 🎯 项目定位与目标

### 核心定位

**AnimaWeave** 是一个图灵完备的节点图DSL框架，支持：
- **双流系统**：数据流 + 控制流分离
- **子图封装**：递归式能力构建的核心创新
- **语义标签系统**：比传统类型系统更灵活的数据兼容性机制
- **可扩展容器**：动态发现和加载节点实现

### 差异化竞争优势

| 框架 | 核心能力 | 局限性 |
|------|----------|--------|
| **LangChain/LangGraph** | AI工作流编排 | 缺少子图封装能力 |
| **Microsoft Semantic Kernel** | AI应用框架 | 不是DSL，无法自定义语法 |
| **ComfyUI** | 节点式UI工具 | 专门针对图像生成，不通用 |
| **AnimaWeave** | **子图封装为节点的递归构建** | **首创能力** |

## 🏗️ 系统架构设计

### 三层处理架构

```
🔤 DSL语法层    (用户界面)
    ↓ 解析 + AST构建
🔍 DSL检查层    (编译时验证)
    ↓ 验证通过 + 图构建  
☕ Java执行层   (运行时执行)
```

### 核心组件结构

```
com.seelefelix.animaweave
├── parser/             # DSL解析器
│   ├── AnimaWeaveDSLLexer.java      # ANTLR生成
│   ├── AnimaWeaveDSLParser.java     # ANTLR生成
│   └── ASTBuilder.java              # AST构建器
├── semantic/           # 语义标签系统
│   ├── SemanticLabel.java           # 语义标签基类
│   ├── SemanticRegistry.java        # 语义标签注册表
│   └── CompatibilityGraph.java      # 兼容性关系图
├── graph/              # 图结构模型
│   ├── WeaveGraph.java              # 图定义
│   ├── WeaveNode.java               # 节点定义
│   ├── WeaveConnection.java         # 连接定义
│   └── Port.java                    # 端口定义
├── vessel/             # 容器系统
│   ├── AnimaVessel.java             # 容器接口
│   ├── VesselRegistry.java          # 容器注册表
│   └── VesselManager.java           # 容器管理器
├── execution/          # 执行引擎
│   ├── GraphExecutor.java           # 图执行器
│   ├── NodeExecutor.java            # 节点执行器
│   └── ExecutionContext.java        # 执行上下文
└── validation/         # 静态验证
    ├── GraphValidator.java          # 图结构验证
    ├── TypeCompatibilityValidator.java  # 类型兼容性验证
    └── DAGValidator.java            # DAG循环检测
```

## 📐 数学理论基础 (32个定义)

AnimaWeave基于严格的数学形式化定义，确保理论完备性：

### 🏗️ 基础数据结构 (定义1-4)

| 定义 | 概念 | Java实现 | 说明 |
|------|------|----------|------|
| **定义1** | 语义标签集合 ℒ | `SemanticRegistry` | 管理所有可用的语义标签类型 |
| **定义2** | 控制信号类型 𝒞 | `ControlSignal.class` | 专门的控制流信号类型 |
| **定义3** | 端口定义 | `Port.class` | 端口的类型和方向定义 |
| **定义4** | 兼容性关系 Γ | `CompatibilityGraph` | 语义标签间的兼容性关系图 |

### 🔗 节点与连接 (定义5-8)

| 定义 | 概念 | Java实现 | 说明 |
|------|------|----------|------|
| **定义5** | 节点七元组 | `WeaveNode` | 节点的完整数学表示 |
| **定义6** | 节点计算函数 φ | `NodeExecutor.execute()` | 节点的计算逻辑实现 |
| **定义7** | 数据连接集合 𝒟 | `DataConnection` | 数据流连接的集合 |
| **定义8** | 控制连接集合 ℰ | `ControlConnection` | 控制流连接的集合 |

### 📊 图结构与执行 (定义9-32)

涵盖图结构定义、执行语义、状态转换、子图封装等完整的32个数学定义。

## 🔤 DSL语法设计

### 语法结构概览

AnimaWeave DSL支持两种文件类型：

- **`.anima`** - 节点和类型定义文件
- **`.graph.anima`** - 图实例文件

### 核心语法元素

#### 1. 语义类型声明

```animaweave
// 基础类型定义
String {
    // String与其他类型兼容
}

Int {
    Double,    // Int可以转换为Double
    String     // Int可以转换为String
}

Prompt {
    String     // Prompt可以转换为String
}
```

#### 2. 节点声明

```animaweave
// 节点定义语法
Add String {           // 节点类型 + 容器名
    in {
        a Int,
        b Int,
        execute Signal mode=AND
    }
    out {
        result Int,
        done Signal
    }
}
```

#### 3. 图实例定义

```animaweave
graph Calculator {
    nodes {
        input1 basic.Input,
        input2 basic.Input,
        adder math.Add,
        output basic.Output
    }
    
    data {
        input1.value -> adder.a;
        input2.value -> adder.b;
        adder.result -> output.value;
    }
    
    control {
        input1.ready => adder.execute;
        input2.ready => adder.execute;
        adder.done => output.display;
    }
}
```

#### 4. 子图封装语法

```animaweave
subgraph AdditionFlow {
    // 子图内部定义
    nodes { ... }
    data { ... }
    control { ... }
    
    // 边界端口自动推算
    // 系统会识别未连接的端口作为边界
}

// 封装后作为节点使用
nodes {
    calculator AdditionFlow
}
```

## 🏺 容器系统设计

### 容器接口定义

```java
public interface AnimaVessel {
    String getName();
    String getVersion();
    String getDescription();
    
    // 支持的语义标签类型
    List<Class<? extends SemanticLabel>> getSupportedLabels();
    
    // 支持的节点类型
    List<Class<? extends Node>> getSupportedNodes();
    
    // 创建节点实例
    Node createNode(String nodeType);
    
    // 创建语义标签实例
    SemanticLabel createLabel(String labelType, Object value);
}
```

### 基础容器实现

#### BasicVessel 基础容器

提供最基础的数据类型和操作节点：

**语义标签类型**：
- `Signal` - 控制信号
- `Int` - 整数
- `Bool` - 布尔值
- `String` - 字符串
- `UUID` - 唯一标识符
- `Prompt` - 提示对象

**节点类型**：
- `Start` - 图执行起始节点
- `GetTimestamp` - 获取时间戳
- `IsEven` - 判断奇偶数
- `FormatNumber` - 数字格式化
- `CreatePrompt` - 创建提示对象
- `StringFormatter` - 字符串格式化

#### MathVessel 数学容器

**节点类型**：
- `Add` - 加法运算
- `Subtract` - 减法运算
- `Multiply` - 乘法运算
- `Divide` - 除法运算
- `Compare` - 数值比较

#### LLMVessel AI容器

**节点类型**：
- `OpenRouterChat` - AI对话节点
- `PromptTemplate` - 提示模板
- `ResponseParser` - 响应解析

### 容器发现与加载

```java
@Service
public class VesselManager {
    
    // 自动发现容器
    public void discoverVessels() {
        // 1. 扫描classpath中的容器实现
        // 2. 读取容器注解和配置
        // 3. 自动注册到VesselRegistry
    }
    
    // 生成容器定义文件
    public void generateAnimaFiles() {
        // 为每个容器生成对应的.anima文件
        // 包含节点定义和语义标签定义
    }
}
```

## 🔍 静态验证系统

### 验证检查项

#### 1. 语法验证
- ANTLR语法解析
- AST结构完整性检查

#### 2. 语义验证
- 语义标签兼容性检查
- 端口类型匹配验证
- 节点定义完整性检查

#### 3. 图结构验证
- 连接有效性约束 (定义11)
- 边界端口自动推算 (定义12)
- DAG循环检测 (定义13)

#### 4. 子图封装验证
- 边界端口完整性
- 内部连通性检查
- 封装条件满足性

### 验证器实现

```java
@Component
public class GraphValidator {
    
    public ValidationResult validate(WeaveGraph graph) {
        var result = new ValidationResult();
        
        // 1. 语义标签兼容性检查
        validateSemanticCompatibility(graph, result);
        
        // 2. 连接有效性检查
        validateConnections(graph, result);
        
        // 3. DAG检查
        validateDAG(graph, result);
        
        // 4. 子图封装检查
        validateSubgraphEncapsulation(graph, result);
        
        return result;
    }
}
```

## ⚡ 执行引擎设计

### 执行模型

#### 双流执行系统

```java
public class GraphExecutor {
    
    // 数据流传播
    private void propagateDataFlow(ExecutionContext context) {
        // 根据数据连接传播端口值
    }
    
    // 控制流传播  
    private void propagateControlFlow(ExecutionContext context) {
        // 根据控制连接传播信号
    }
    
    // 节点就绪检测
    private boolean isNodeReady(WeaveNode node, ExecutionContext context) {
        // 检查数据就绪 + 控制激活条件
        return dataReady(node, context) && controlActivated(node, context);
    }
}
```

#### 并发执行支持

利用Java 21的Virtual Threads：

```java
@Service
public class ConcurrentGraphExecutor {
    
    @Autowired
    private TaskExecutor virtualThreadExecutor;
    
    public CompletableFuture<ExecutionResult> executeAsync(WeaveGraph graph) {
        return CompletableFuture.supplyAsync(() -> {
            // 图执行逻辑
            return executeGraph(graph);
        }, virtualThreadExecutor);
    }
}
```

### 执行状态管理

```java
public class ExecutionContext {
    
    // 全局执行状态 (定义17)
    private GlobalExecutionState globalState;
    
    // 数据状态
    private Map<PortRef, SemanticValue> dataState;
    
    // 控制状态  
    private Map<PortRef, ControlSignalState> controlState;
    
    // 节点状态
    private Map<NodeId, NodeExecutionState> nodeState;
}
```

## 🔧 子图封装机制

### 核心创新：递归式能力构建

这是AnimaWeave的最重要特性：

```
基础节点 → 组合为子图 → 封装为新节点 → 构建更复杂子图
```

### 封装过程

#### 1. 边界端口识别

```java
public class SubgraphBoundaryAnalyzer {
    
    public BoundaryPorts analyzeBoundaries(WeaveGraph subgraph) {
        var boundaries = new BoundaryPorts();
        
        // 数据输入边界：没有连接来源的数据输入端口
        boundaries.dataInputs = findUnconnectedDataInputs(subgraph);
        
        // 数据输出边界：没有连接目标的数据输出端口  
        boundaries.dataOutputs = findUnconnectedDataOutputs(subgraph);
        
        // 控制输入边界：没有连接来源的控制输入端口
        boundaries.controlInputs = findUnconnectedControlInputs(subgraph);
        
        // 控制输出边界：没有连接目标的控制输出端口
        boundaries.controlOutputs = findUnconnectedControlOutputs(subgraph);
        
        return boundaries;
    }
}
```

#### 2. 子图到节点的同构映射

```java
public class SubgraphEncapsulator {
    
    public WeaveNode encapsulate(WeaveGraph subgraph, String nodeName) {
        // 1. 分析边界端口
        var boundaries = boundaryAnalyzer.analyzeBoundaries(subgraph);
        
        // 2. 创建节点定义
        var nodeBuilder = WeaveNode.builder()
            .name(nodeName)
            .type("SubgraphNode");
            
        // 3. 映射边界端口为节点端口
        boundaries.dataInputs.forEach(port -> 
            nodeBuilder.addInputPort(port.getName(), port.getSemanticType()));
        boundaries.dataOutputs.forEach(port ->
            nodeBuilder.addOutputPort(port.getName(), port.getSemanticType()));
            
        // 4. 设置执行逻辑为子图执行
        nodeBuilder.setExecutor(new SubgraphExecutor(subgraph));
        
        return nodeBuilder.build();
    }
}
```

### 递归执行

```java
public class SubgraphExecutor implements NodeExecutor {
    
    private final WeaveGraph subgraph;
    
    @Override
    public ExecutionResult execute(Map<String, SemanticValue> inputs) {
        // 1. 将输入映射到子图的边界输入端口
        var context = createSubgraphContext(inputs);
        
        // 2. 执行子图
        var result = graphExecutor.execute(subgraph, context);
        
        // 3. 从边界输出端口提取结果
        return extractOutputs(result);
    }
}
```

## 🧪 测试体系

### 测试分层

#### P1层：基础语法解析测试

```java
@Test
public void testBasicSemanticLabelParsing() {
    String dsl = """
        String {
            Int
        }
        
        AddNode basic {
            in {
                a Int,
                b Int,
                execute Signal mode=AND
            }
            out {
                result Int,
                done Signal
            }
        }
        """;
    
    var ast = parser.parse(dsl);
    assertThat(ast.getSemanticTypes()).hasSize(1);
    assertThat(ast.getNodes()).hasSize(1);
}
```

#### P2层：静态验证测试

```java
@Test
public void testCompatibilityValidation() {
    var graph = WeaveGraph.builder()
        .addNode("input", "basic.Input")
        .addNode("processor", "math.Add")
        .addConnection("input.value", "processor.a")  // String -> Int 需要检查兼容性
        .build();
        
    var result = validator.validate(graph);
    // 根据兼容性定义，验证是否通过
}
```

#### P3层：执行引擎测试

```java
@Test
public void testSubgraphEncapsulation() {
    // 1. 创建一个包含加法的子图
    var additionSubgraph = createAdditionSubgraph();
    
    // 2. 封装为节点
    var calculatorNode = encapsulator.encapsulate(additionSubgraph, "Calculator");
    
    // 3. 在更大的图中使用
    var mainGraph = WeaveGraph.builder()
        .addNode("calc", calculatorNode)
        .build();
        
    // 4. 执行并验证递归执行正确性
    var result = executor.execute(mainGraph);
    assertThat(result.isSuccess()).isTrue();
}
```

## 🎯 实施优先级

### Phase 1: 核心框架 (Must Have)

**时间估计**: 4-6周

1. **DSL解析器** - ANTLR语法实现
2. **语义标签系统** - 基础类型和兼容性
3. **基础容器** - BasicVessel实现  
4. **图执行引擎** - 简单的数据流传播
5. **静态验证** - 基础的类型检查

### Phase 2: 子图封装 (Should Have)

**时间估计**: 3-4周

1. **边界端口分析** - 自动识别算法
2. **子图封装机制** - 核心创新实现
3. **递归执行** - 子图作为节点执行
4. **完整测试套件** - 32个定义的测试覆盖

### Phase 3: 高级特性 (Could Have)

**时间估计**: 2-3周

1. **并发执行** - Virtual Threads支持
2. **容器热加载** - 动态发现新容器
3. **性能优化** - 执行引擎调优
4. **AI容器扩展** - LLM节点实现

### Phase 4: 生产特性 (Won't Have - 本期)

1. **图形化编辑器** - Web UI
2. **分布式执行** - 多节点部署
3. **版本管理** - 图定义版本控制
4. **监控告警** - 运行时监控

## 📚 技术规范

### 代码规范

1. **Java 21** - 使用最新语言特性
2. **Spring Boot 3.3** - 依赖注入和配置管理
3. **ANTLR 4.13** - DSL解析
4. **JUnit 5** - 单元测试
5. **Maven** - 构建工具

### 性能要求

1. **解析性能** - 1000行DSL代码 < 100ms
2. **验证性能** - 100个节点的图 < 50ms
3. **执行性能** - 简单图执行 < 10ms
4. **内存占用** - 单个图实例 < 10MB

### 扩展性设计

1. **容器插件化** - 通过实现接口添加新容器
2. **语义标签扩展** - 支持自定义语义标签类型
3. **执行引擎扩展** - 支持自定义执行策略
4. **验证器扩展** - 支持自定义验证规则

## 🔄 与其他版本的关系

### 版本演进历史

1. **TypeScript/Deno版本** (anima-weave/) - 概念验证，完整32个定义实现
2. **Rust版本** (AnimaWeave-back/) - 性能优化，Actor模型实验
3. **Java版本** (当前) - 生产级实现，企业环境适配

### 技术栈选择理由

| 方面 | TypeScript | Rust | Java |
|------|------------|------|------|
| **开发速度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **性能** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **生态成熟度** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **企业采用度** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **团队熟悉度** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

**Java版本优势**：
- Spring Boot生态成熟
- 企业级特性丰富
- 团队技术栈匹配
- 长期维护保障

## 📖 相关文档

- [AnimaWeave数学形式化定义](../anima-weave/docs/anima-weave-mathematica-definition.md)
- [DSL语法参考](../anima-weave/docs/dsl-syntax-reference.md)
- [实施策略文档](../anima-weave/animaweave-implementation-strategy.md)
- [Lady Sion项目哲学](../docs/philosophy/lady-sion-philosophy.md)

## 🔄 更新记录

- **2024-12-19**: 创建文档，基于完整历史研究
- **待补充**: 实施过程中的技术细节和架构调整 