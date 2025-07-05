# AnimaWeave Rust 实现进度

## 最新架构图 (2024-12-19更新)

```mermaid
graph TB
    %% 用户输入层
    subgraph "📄 用户输入层"
        WeaveFile["📝 .weave 文件<br/>用户手写图结构定义"]
        AnimaFile["🏭 .anima 文件<br/>Java生成节点类型定义"]
    end

    %% DSL解析层 (未实现)
    subgraph "🔤 DSL解析层 [TODO]"
        WeaveParser["WeaveParser<br/>解析.weave → AST<br/>❌ 待实现"]
        AnimaLoader["AnimaLoader<br/>加载.anima → NodeDef<br/>❌ 待实现"]
        GraphBuilder["GraphBuilder<br/>AST → GraphDefinition<br/>❌ 待实现"]
    end
    
    %% Core数学抽象层 (已完成)
    subgraph "🎯 Core数学抽象层 [✅ 已完成]"
        GraphDef["📊 GraphDefinition<br/>✅ 图结构定义<br/>Node + Port + Connection"]
        SemanticLabels["🏷️ SemanticLabel System<br/>✅ 类型系统 + 自动转换<br/>StringLabel | NumberLabel<br/>PromptLabel | SignalLabel"]
        EventSystem["📡 Event System<br/>✅ 四大事件类型<br/>DataEvent | ControlEvent<br/>NodeExecuteEvent | NodeExecutionEvent"]
        StateSystem["🌍 State System<br/>✅ 全局状态Ω管理<br/>Σ_data + Σ_control + Σ_node"]
    end
    
    %% Vessels实现层 (已完成)
    subgraph "⚗️ Vessels实现层 [✅ 已完成]"
        StringLabelImpl["StringLabel<br/>✅ 基础字符串类型"]
        NumberLabelImpl["NumberLabel<br/>✅ 数值 → String转换"]
        PromptLabelImpl["PromptLabel<br/>✅ 提示 → String转换"]
        SignalLabelImpl["SignalLabel<br/>✅ 信号控制类型"]
    end

    %% Actor运行时层 (部分完成)
    subgraph "🎭 Kameo Actor运行时 [🔄 进行中]"
        CoordActor["🎯 Coordinator [✅ 已完成]<br/>· lookup事件传递机制<br/>· 事件驱动自动调度<br/>· 并发控制 (同名节点防冲突)<br/>· spawn_for_graph() 启动<br/>· ExecutionStatus统计"]
        
        DataBus["🚌 DataBus [❌ 待实现]<br/>· 数据流缓存<br/>· Label自动转换<br/>· 端口数据管理"]
        
        subgraph "NodeActors集群 [❌ 待实现]"
            StartActor["🚀 StartActor<br/>❌ 生成信号+UUID"]
            MathActor["🔢 MathActor<br/>❌ 数学运算"]
            IsEvenActor["❓ IsEvenActor<br/>❌ 判断奇偶"]
            CustomActor["⚡ CustomActor<br/>❌ 用户自定义"]
        end
    end

    %% 事件驱动执行流程 (架构已确定)
    subgraph "📡 事件驱动执行流程 [🔄 架构已确定]"
        EventFlow1["1️⃣ spawn_for_graph()<br/>✅ 启动Coordinator"]
        EventFlow2["2️⃣ 收到ControlEvent/DataEvent<br/>🔄 触发依赖检查"]
        EventFlow3["3️⃣ is_node_ready() 检查<br/>🔄 DataReady ∧ ControlActive"]
        EventFlow4["4️⃣ execute_node_if_ready()<br/>🔄 发送NodeExecuteEvent"]
        EventFlow5["5️⃣ NodeActor执行完成<br/>🔄 发送三种输出事件"]
        EventFlow6["6️⃣ 自动循环检查<br/>🔄 持续至图执行完成"]
    end

    %% 连接关系 - 构建阶段
    WeaveFile -.->|"待实现"| WeaveParser
    AnimaFile -.->|"待实现"| AnimaLoader
    WeaveParser -.->|"待实现"| GraphBuilder
    AnimaLoader -.->|"待实现"| GraphBuilder
    GraphBuilder -.->|"待实现"| GraphDef
    
    %% 已完成的连接
    GraphDef --> CoordActor
    SemanticLabels --> CoordActor
    EventSystem --> CoordActor
    StateSystem --> CoordActor
    
    SemanticLabels --> StringLabelImpl
    SemanticLabels --> NumberLabelImpl  
    SemanticLabels --> PromptLabelImpl
    SemanticLabels --> SignalLabelImpl
    
    %% 待实现的连接
    GraphDef -.->|"待DataBus实现"| DataBus
    SemanticLabels -.->|"待DataBus实现"| DataBus
    
    %% 事件流程
    CoordActor --> EventFlow1
    EventFlow1 --> EventFlow2
    EventFlow2 --> EventFlow3  
    EventFlow3 --> EventFlow4
    EventFlow4 -.->|"待NodeActor实现"| StartActor
    EventFlow4 -.->|"待NodeActor实现"| MathActor
    EventFlow4 -.->|"待NodeActor实现"| IsEvenActor
    EventFlow4 -.->|"待NodeActor实现"| CustomActor
    
    %% 反馈循环 (待实现)
    StartActor -.->|"待实现"| EventFlow5
    MathActor -.->|"待实现"| EventFlow5
    IsEvenActor -.->|"待实现"| EventFlow5
    CustomActor -.->|"待实现"| EventFlow5
    EventFlow5 -.->|"待实现"| EventFlow6
    EventFlow6 -.->|"循环"| EventFlow2
    
    %% 样式定义
    classDef completed fill:#c8e6c9,stroke:#4caf50,stroke-width:2px,color:#1b5e20
    classDef inProgress fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#e65100
    classDef TODO fill:#ffebee,stroke:#f44336,stroke-width:2px,color:#c62828
    classDef system fill:#e3f2fd,stroke:#2196f3,stroke-width:2px,color:#0d47a1
    
    %% 应用样式
    class GraphDef,SemanticLabels,EventSystem,StateSystem,StringLabelImpl,NumberLabelImpl,PromptLabelImpl,SignalLabelImpl,CoordActor,EventFlow1 completed
    class EventFlow2,EventFlow3,EventFlow4,EventFlow5,EventFlow6 inProgress
    class WeaveParser,AnimaLoader,GraphBuilder,DataBus,StartActor,MathActor,IsEvenActor,CustomActor TODO
    class WeaveFile,AnimaFile system
```

## 实现进度

### ✅ Core数学层
- [x] Graph结构 (`graph.rs`)
- [x] Port, Connection, Node定义
- [x] ActivationMode, ConcurrentMode配置
- [x] **语义标签系统trait** (`label.rs`) - 🆕 完成
- [x] 语义标签宏系统 (`semantic_label!`) - 🆕 完成
- [x] 事件系统trait (`event.rs`) - ⚠️ 需重构以支持SemanticLabel
- [x] 全局状态trait (`state.rs`) 
- [x] 执行器trait (`executor.rs`)

### ✅ Vessels实现层 - 完成
- [x] **StringLabel** - 基础字符串类型，作为转换目标
- [x] **NumberLabel** - 数值类型，可转换为StringLabel
- [x] **PromptLabel** - 提示内容类型，可转换为StringLabel  
- [x] **SignalLabel** - 信号控制类型，可转换为StringLabel
- [x] **完整测试覆盖** - 21个测试用例全部通过
- [x] **自动转换系统** - 支持`try_convert_to()`机制

### ✅ Event系统重构 - 🆕 已完成，职责分离设计
- [x] 识别重构需求：旧`SemanticValue` → 新`SemanticLabel`
- [x] **NodeExecuteEvent**: Coordinator → NodeActor 执行指令
- [x] **NodeExecutionEvent**: NodeActor → Coordinator 状态通知
- [x] **NodeOutputEvent**: NodeActor → DataBus 数据输出
- [x] **DataReadyEvent**: DataBus → Coordinator 依赖满足通知
- [x] EventMeta统一元数据系统，完整的职责分离架构

### ✅ Coordinator Actor - 🆕 已完成
- [x] **Kameo Actor框架集成** - 基于Actor模型的协调器
- [x] **lookup机制** - 完全解耦的事件传递，无循环依赖
- [x] **事件驱动调度** - 自动响应ControlEvent/DataEvent/NodeExecutionEvent
- [x] **并发控制** - 同名节点防冲突，running_nodes管理
- [x] **spawn_for_graph()** - 一次性启动模式，自动注册监听
- [x] **ExecutionStatus** - 完整的执行统计和状态管理
- [x] **GetStatusQuery** - 调试用状态查询接口

### ❌ DSL解析层
- [ ] WeaveParser - 解析.weave文件
- [ ] AnimaLoader - 加载.anima文件
- [ ] Graph构建器

### 🔄 Actor运行时 - 部分完成
- [x] **Coordinator** - 核心协调器已完成
- [ ] **DataBus** - 数据流缓存和转换系统
- [ ] **NodeActor基础框架** - 通用节点执行器
- [ ] **StartActor** - 信号生成节点
- [ ] **MathActor** - 数学运算节点
- [ ] **IsEvenActor** - 判断节点

### ❌ 集成测试
- [ ] 端到端执行流程测试
- [ ] 数学定义验证测试
- [ ] 并发控制测试
- [ ] 性能基准测试

## 🎯 关键成就 - 语义标签系统

### 架构设计原则
- **不可变性**: 语义标签创建后不能修改，只能通过转换创建新标签
- **类型安全**: 通过trait保证类型检查和兼容性验证
- **Actor友好**: 支持Send + Sync，可在Actor间安全传递
- **自主转换**: 语义标签知道如何转换到其他兼容类型

### 职责分离
- **SemanticLabel**: 处理自己的数据维护、转换能力和转换接口
- **Container**: 只做封装和简化，不承担转换逻辑
- **Event系统**: 负责路由时的自动转换协调

### 使用场景
1. **静态分析**: 通过代码扫描、正则匹配等方式提供标签转换关系，用于验证图连接合法性
2. **运行时转换**: Event传递时需要转换为目标标签给下一个节点使用

## 当前状态 (2024-12-19更新)
- **Core基础架构**: ✅ 完全实现，包结构编译通过，21个测试用例通过
- **语义标签系统**: ✅ 完整实现并测试验证，支持自动转换
- **事件系统**: ✅ 四大事件类型完整实现，支持SemanticLabel和统一元数据
- **Coordinator**: ✅ 核心协调器完成，事件驱动架构建立，并发控制实现
- **下一步**: 实现DataBus和NodeActor基础框架

## 🚀 下一阶段重点 (基于职责分离架构)
1. **DataBus智能实现** - 数据存储系统 + 依赖检查引擎 + AND/XOR/OR逻辑计算
2. **Graph连接定义** - 手工定义最小图结构（数据连线 + 控制连线）用于测试  
3. **NodeActor基础框架** - 双事件输出（NodeExecutionEvent + NodeOutputEvent）
4. **DataReadyEvent机制** - DataBus → Coordinator 的智能依赖通知
5. **简单双节点验证** - StartActor → MathActor 完整闭环测试 



graph TD
    subgraph "Event System Architecture"
        subgraph "Core Events"
            DE["DataEvent<br/>- source_port: PortRef<br/>- data: Box&lt;dyn SemanticLabel&gt;"]
            CE["ControlEvent<br/>- source_port: PortRef<br/>- signal: SignalLabel"]
            NEE["NodeExecuteEvent<br/>- node_name: String<br/>- node_execute_id: String"]
            NEV["NodeExecutionEvent<br/>- node_name: String<br/>- node_execute_id: String<br/>- status: NodeStatus"]
        end
        
        subgraph "Actor Flow"
            CA["CoordinatorActor"]
            NA["NodeActor"]
            DB["DataBus"]
        end
        
        subgraph "Event Routing"
            DE --> DB
            CE --> CA
            NEE --> NA
            NEV --> CA
        end
        
        subgraph "Supporting Types"
            PR["PortRef<br/>- node_name: String<br/>- port_name: String"]
            SL["SignalLabel<br/>- active: bool"]
            NS["NodeStatus<br/>- Pending<br/>- Running<br/>- Completed<br/>- Failed"]
        end
        
        DE -.-> PR
        CE -.-> PR
        CE -.-> SL
        NEV -.-> NS
    end

    classDef eventClass fill:#e1f5fe
    classDef actorClass fill:#f3e5f5
    classDef typeClass fill:#fff3e0
    
    class DE,CE,NEE,NEV eventClass
    class CA,NA,DB actorClass
    class PR,SL,NS typeClass




graph TB
    %% 用户层
    WeaveFile["📄 .weave 文件<br/>用户定义图结构"]
    AnimaFile["📄 .anima 文件<br/>Vessels生成节点定义"]
    
    %% DSL解析层
    subgraph "🔤 DSL解析层"
        WeaveParser["WeaveParser<br/>解析.weave → AST"]
        AnimaLoader["AnimaLoader<br/>加载.anima → NodeDef"]
        GraphBuilder["GraphBuilder<br/>AST → GraphDefinition"]
    end
    
    %% 核心抽象层
    subgraph "🎯 Core抽象层"
        GraphDef["GraphDefinition<br/>抽象图结构"]
        SemanticLabels["SemanticLabel System<br/>类型系统 + 转换"]
        EventSystem["Event System<br/>DataEvent + ControlEvent + NodeExecuteEvent"]
    end
    
    %% Actor运行时层
    subgraph "🎭 Kameo Actor运行时"
        CoordActor["🎯 CoordinatorActor<br/>· 管理全局状态 Ω<br/>· NodeReady检查<br/>· 控制流调度<br/>· 并发控制<br/>· 统计和状态维护"]
        
        DataBus["🚌 DataBus<br/>· 数据流处理<br/>· Label转换<br/>· 数据传递"]
        
        subgraph "NodeActors集群"
            StartActor["🚀 StartActor<br/>生成信号+UUID"]
            MathActor["🔢 MathActor<br/>数学运算"]
            IsEvenActor["❓ IsEvenActor<br/>判断奇偶"]
            CustomActor["⚡ CustomActor<br/>用户自定义"]
        end
    end
    
    %% 事件流
    subgraph "📡 事件驱动流程"
        NodeExecuteEvent["⚡ NodeExecuteEvent<br/>CoordinatorActor → NodeActor<br/>执行指令"]
        
        DataEvents["📊 DataEvent<br/>value + semantic_label<br/>source_port + target_port"]
        ControlEvents["🎮 ControlEvent<br/>signal + activation_mode<br/>node_id + trigger"]
        
        NodeReady["🎲 NodeReady检查<br/>DataReady ∧ ControlActive"]
        
        ExecuteNode["🔄 执行节点<br/>inputs → process → outputs"]
        
        CompletionNotify["✅ 执行完成通知<br/>NodeActor → CoordinatorActor"]
    end
    
    %% 连接关系 - 构建阶段
    WeaveFile --> WeaveParser
    AnimaFile --> AnimaLoader
    WeaveParser --> GraphBuilder
    AnimaLoader --> GraphBuilder
    GraphBuilder --> GraphDef
    
    GraphDef --> CoordActor
    GraphDef --> DataBus
    SemanticLabels --> DataBus
    EventSystem --> CoordActor
    EventSystem --> DataBus
    
    %% 运行时事件流
    CoordActor --> NodeExecuteEvent
    NodeExecuteEvent --> StartActor
    NodeExecuteEvent --> MathActor
    NodeExecuteEvent --> IsEvenActor
    NodeExecuteEvent --> CustomActor
    
    StartActor --> ExecuteNode
    MathActor --> ExecuteNode
    IsEvenActor --> ExecuteNode
    CustomActor --> ExecuteNode
    
    %% 节点执行完成后的事件分流
    ExecuteNode --> DataEvents
    ExecuteNode --> ControlEvents
    ExecuteNode --> CompletionNotify
    
    %% 事件路由
    DataEvents --> DataBus
    ControlEvents --> CoordActor
    CompletionNotify --> CoordActor
    
    %% DataBus处理数据流
    DataBus --> NodeReady
    
    %% CoordinatorActor处理控制流
    CoordActor --> NodeReady
    
    %% 反馈循环
    NodeReady -.-> CoordActor
    
    %% 样式
    classDef actorStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef eventStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef coreStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    
    class CoordActor,DataBus,StartActor,MathActor,IsEvenActor,CustomActor actorStyle
    class NodeExecuteEvent,DataEvents,ControlEvents,CompletionNotify eventStyle
    class GraphDef,SemanticLabels,EventSystem coreStyle


graph TD
    subgraph "Event System Architecture - Final Implementation"
        subgraph "Core Events (with EventMeta)"
            DE["DataEvent<br/>+ meta: EventMeta<br/>+ source_port: PortRef<br/>+ data: Box&lt;dyn SemanticLabel&gt;"]
            CE["ControlEvent<br/>+ meta: EventMeta<br/>+ source_port: PortRef<br/>+ signal: SignalLabel"]
            NEE["NodeExecuteEvent<br/>+ meta: EventMeta<br/>+ node_name: NodeName<br/>+ node_execute_id: ExecutionId<br/>+ inputs: NodeInputs"]
            NEV["NodeExecutionEvent<br/>+ meta: EventMeta<br/>+ node_name: NodeName<br/>+ node_execute_id: ExecutionId<br/>+ status: NodeStatus"]
        end
        
        subgraph "Actor Flow"
            CA["CoordinatorActor"]
            NA["NodeActor"]
            DB["DataBus"]
        end
        
        subgraph "Event Routing"
            DE --> DB
            CE --> CA
            NEE --> NA
            NEV --> CA
        end
        
        subgraph "System Types (core/src/types.rs)"
            NN["NodeName = String"]
            PN["PortName = String"] 
            EID["ExecutionId = String"]
            NI["NodeInputs = HashMap&lt;PortName, Box&lt;dyn SemanticLabel&gt;&gt;"]
        end
        
        subgraph "Event Types (event/types.rs)"
            PR["PortRef<br/>+ node_name: NodeName<br/>+ port_name: PortName"]
            EM["EventMeta<br/>+ event_id: String<br/>+ timestamp: SystemTime<br/>+ source: Option&lt;String&gt;"]
            NS["NodeStatus<br/>- Pending | Running<br/>- Completed | Failed(String)"]
        end
        
        subgraph "Core Labels"
            SL["SignalLabel<br/>+ active: bool"]
            SML["SemanticLabel trait"]
        end
        
        NEE -.-> NI
        DE -.-> PR
        CE -.-> PR
        CE -.-> SL
        NEV -.-> NS
        All_Events -.-> EM
    end

    classDef eventClass fill:#e1f5fe
    classDef actorClass fill:#f3e5f5  
    classDef typeClass fill:#fff3e0
    classDef coreClass fill:#e8f5e8
    
    class DE,CE,NEE,NEV eventClass
    class CA,NA,DB actorClass
    class NN,PN,EID,NI,PR,EM,NS typeClass
    class SL,SML coreClass


graph TB
    subgraph "NodeA 执行完成后的完整事件流"
        NodeA["⚡ NodeActor<br/>执行业务逻辑<br/>inputs → process → outputs"]
        
        DataEvent["📦 DataEvent<br/>数据输出事件<br/>端口数据结果"]
        StateEvent["📊 NodeExecutionEvent<br/>状态通知事件<br/>执行完成/失败"]
        ControlEvent["🎛️ ControlEvent<br/>控制信号事件<br/>Signal激活/停止"]
        
        NodeA -->|"产生数据输出"| DataEvent
        NodeA -->|"报告执行状态"| StateEvent
        NodeA -->|"发出控制信号"| ControlEvent
    end
    
    subgraph "三种事件的不同去向"
        DataBus["🚌 DataBus<br/>数据仓库<br/>缓存端口数据"]
        Coordinator["🎯 Coordinator<br/>状态管理器<br/>NodeReady检查"]
        Coordinator2["🎯 Coordinator<br/>控制流管理<br/>处理Signal"]
        
        DataEvent -->|"存储到"| DataBus
        StateEvent -->|"通知状态"| Coordinator
        ControlEvent -->|"更新控制流"| Coordinator2
    end
    
    subgraph "Coordinator 的主动查询"
        Coordinator3["🎯 Coordinator<br/>收到事件后主动检查"]
        DataBus2["🚌 DataBus<br/>被动响应查询"]
        
        Coordinator3 -->|"查询NodeB输入数据<br/>DataReady(NodeB,Ω)?"| DataBus2
        Coordinator3 -->|"检查NodeB控制状态<br/>ControlActive(NodeB,Ω)?"| Coordinator3
        DataBus2 -->|"返回缓存数据状态"| Coordinator3
        
        Coordinator3 -->|"如果Ready<br/>发送NodeExecuteEvent"| NextNode["⚡ NodeB"]
    end
    
    Coordinator -.-> Coordinator3
    Coordinator2 -.-> Coordinator3
    DataBus -.-> DataBus2

    classDef node fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef event fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef bus fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class NodeA,NextNode node
    class DataEvent,StateEvent,ControlEvent event
    class Coordinator,Coordinator2,Coordinator3 actor
    class DataBus,DataBus2 bus

## 职责分离架构图 (2024-12-19)

```mermaid
graph TD
    subgraph "完整的事件驱动闭环 - 职责分离设计"
        NodeExec["🔄 NodeActor执行<br/>inputs → process → outputs"]
        
        subgraph "双事件输出"
            ExecutionEvent["📊 NodeExecutionEvent<br/>→ Coordinator<br/>- node_name<br/>- execution_id<br/>- status: Completed/Failed"]
            NodeOutputEvent["📦 NodeOutputEvent<br/>→ DataBus<br/>- node_name<br/>- execution_id<br/>- outputs: Map<port,value>"]
        end
        
        NodeExec --> ExecutionEvent
        NodeExec --> NodeOutputEvent
        
        subgraph "Coordinator职责 - 控制层"
            CoordReceiveExec["🎯 Coordinator收到NodeExecutionEvent<br/>- 更新全局状态<br/>- 并发控制 (移除running_nodes)<br/>- 执行统计<br/>- Debug信息"]
            
            CoordReceiveReady["🎯 Coordinator收到DataReadyEvent<br/>- 并发验证 (同名节点防冲突)<br/>- 权限检查<br/>- 执行调度"]
            
            SendExecute["📤 发送NodeExecuteEvent<br/>→ 具体NodeActor<br/>包含所有准备好的输入"]
        end
        
        ExecutionEvent --> CoordReceiveExec
        
        subgraph "DataBus职责 - 数据层"
            DataBusReceive["🚌 DataBus收到NodeOutputEvent<br/>- 保存节点输出数据<br/>- port → value 映射"]
            
            DependencyCheck["🔍 依赖检查<br/>基于Graph定义:<br/>- 数据连线: 所有required输入有值?<br/>- 控制连线: AND/XOR/OR逻辑满足?"]
            
            SendReady["📤 发送DataReadyEvent<br/>→ Coordinator<br/>- target_node_name<br/>- prepared_inputs<br/>- trigger_reason"]
        end
        
        NodeOutputEvent --> DataBusReceive
        DataBusReceive --> DependencyCheck
        DependencyCheck -->|"节点Ready"| SendReady
        SendReady --> CoordReceiveReady
        CoordReceiveReady --> SendExecute
        SendExecute -.->|"循环"| NodeExec
    end
    
    subgraph "控制逻辑类型"
        AndLogic["🔀 AND逻辑<br/>所有控制输入都为true"]
        XorLogic["⚡ XOR逻辑<br/>恰好一个控制输入为true"]
        OrLogic["🌊 OR逻辑<br/>至少一个控制输入为true"]
        
        DependencyCheck -.-> AndLogic
        DependencyCheck -.-> XorLogic
        DependencyCheck -.-> OrLogic
    end
    
    subgraph "数据存储"
        DataStore["🗄️ DataBus内部存储<br/>node_a.port_1 → value_1<br/>node_a.port_2 → value_2<br/>node_b.signal → true<br/>..."]
        GraphDef["📊 Graph定义<br/>连接关系:<br/>node_a.out → node_b.in<br/>control_logic: AND/XOR/OR"]
        
        DataBusReceive --> DataStore
        DependencyCheck --> DataStore
        DependencyCheck --> GraphDef
    end
    
    classDef nodeStyle fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef coordStyle fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef busStyle fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef eventStyle fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef logicStyle fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef storeStyle fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    
    class NodeExec,SendExecute nodeStyle
    class CoordReceiveExec,CoordReceiveReady coordStyle
    class DataBusReceive,DependencyCheck,SendReady busStyle
    class ExecutionEvent,NodeOutputEvent eventStyle
    class AndLogic,XorLogic,OrLogic logicStyle
    class DataStore,GraphDef storeStyle
```