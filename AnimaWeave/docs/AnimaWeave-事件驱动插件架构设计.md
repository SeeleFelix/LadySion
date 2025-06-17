# AnimaWeave 事件驱动插件架构设计

## 📋 架构概述

基于**事件驱动**和**插件系统**的AnimaWeave Java实现，实现framework与vessel插件的完全分离。

### 🎯 设计原则

1. **框架最小化**：framework只负责核心调度，不包含任何具体功能
2. **插件完全分离**：所有节点、语义标签都在vessel插件中
3. **事件驱动通信**：framework与插件通过事件通信，无直接依赖
4. **插件热加载**：支持运行时加载、卸载、更新插件
5. **basic也是插件**：连基础数据类型都作为插件提供

## 🏗️ 总体架构

```
AnimaWeave Framework (最小核心)
├── 事件调度器 (EventDispatcher)
├── 插件管理器 (VesselManager) 
├── 图执行协调器 (GraphCoordinator)
└── DSL解析器 (ParserCore)

Vessel Plugins (独立插件)
├── animaweave-vessel-basic.jar     # 基础数据类型插件
├── animaweave-vessel-math.jar      # 数学运算插件  
├── animaweave-vessel-llm.jar       # AI模型插件
├── animaweave-vessel-io.jar        # 输入输出插件
└── animaweave-vessel-xxx.jar       # 其他自定义插件
```

## 🎪 Framework核心设计

### 核心组件职责

```java
// Framework核心 - 只负责调度和协调
com.seelefelix.animaweave.framework
├── event/                   # 事件系统
│   ├── EventDispatcher.java         # 事件调度器
│   ├── EventBus.java                # 事件总线
│   └── events/                      # 事件定义
├── vessel/                  # 插件管理
│   ├── VesselManager.java           # 插件管理器
│   ├── VesselRegistry.java          # 插件注册表
│   └── VesselLoader.java            # 插件加载器
├── graph/                   # 图协调
│   ├── GraphCoordinator.java        # 图执行协调器
│   ├── ExecutionContext.java        # 执行上下文
│   └── StateManager.java            # 状态管理器
└── parser/                  # DSL解析
    ├── DSLParser.java               # DSL解析器
    └── GraphBuilder.java            # 图构建器
```

### 事件系统设计

#### 核心事件类型

```java
// 基础事件接口
public interface AnimaWeaveEvent {
    String getEventId();
    long getTimestamp();
    String getSourceVessel();
}

// 节点执行事件
public class NodeExecutionRequest implements AnimaWeaveEvent {
    private final String nodeId;
    private final String nodeType; 
    private final String vesselName;
    private final Map<String, Object> inputs;
    // ...
}

public class NodeExecutionResult implements AnimaWeaveEvent {
    private final String nodeId;
    private final Map<String, Object> outputs;
    private final ExecutionStatus status;
    // ...
}

// 数据流事件
public class DataFlowEvent implements AnimaWeaveEvent {
    private final String fromPort;
    private final String toPort;
    private final Object value;
    private final String semanticLabel;
    // ...
}

// 控制流事件
public class ControlFlowEvent implements AnimaWeaveEvent {
    private final String fromNode;
    private final String toNode;
    private final ControlSignal signal;
    // ...
}

// 插件生命周期事件
public class VesselLoadedEvent implements AnimaWeaveEvent {
    private final String vesselName;
    private final String vesselVersion;
    private final List<String> supportedNodes;
    // ...
}
```

#### 事件调度器

```java
@Component
public class EventDispatcher {
    
    private final ApplicationEventPublisher eventPublisher;
    private final ExecutorService eventExecutor;
    
    // 发布事件
    public void dispatch(AnimaWeaveEvent event) {
        // 异步事件分发
        eventExecutor.submit(() -> {
            eventPublisher.publishEvent(event);
        });
    }
    
    // 同步等待事件结果
    public <T> T dispatchAndWait(AnimaWeaveEvent event, Class<T> resultType) {
        // 实现同步等待机制
    }
}
```

## 🔌 Vessel插件接口设计

### 插件核心接口

```java
// 插件基础接口
public interface AnimaVessel {
    
    // 插件元数据
    VesselMetadata getMetadata();
    
    // 支持的语义标签
    List<SemanticLabelDefinition> getSupportedLabels();
    
    // 支持的节点类型
    List<NodeDefinition> getSupportedNodes();
    
    // 插件初始化
    void initialize(VesselContext context);
    
    // 插件关闭
    void shutdown();
}

// 插件元数据
public class VesselMetadata {
    private final String name;
    private final String version;
    private final String description;
    private final List<String> dependencies;  // 依赖的其他插件
    private final String author;
    private final String license;
    // ...
}

// 语义标签定义
public class SemanticLabelDefinition {
    private final String labelName;
    private final Class<?> javaType;
    private final List<String> compatibleLabels;
    private final Function<Object, Object> converter;
    // ...
}

// 节点定义
public class NodeDefinition {
    private final String nodeType;
    private final List<PortDefinition> inputPorts;
    private final List<PortDefinition> outputPorts;
    private final NodeExecutor executor;
    // ...
}
```

### 插件事件处理

```java
// 插件需要实现的事件监听器
public interface VesselEventHandler {
    
    // 处理节点执行请求
    @EventListener
    void handleNodeExecution(NodeExecutionRequest request);
    
    // 处理语义标签转换请求
    @EventListener
    void handleLabelConversion(LabelConversionRequest request);
    
    // 处理插件查询请求
    @EventListener
    void handleVesselQuery(VesselQueryRequest request);
}
```

## 🏺 基础插件实现示例

### animaweave-vessel-basic插件

```java
// 基础插件实现
@Component
@VesselPlugin(name = "basic", version = "1.0.0")
public class BasicVessel implements AnimaVessel, VesselEventHandler {
    
    @Override
    public VesselMetadata getMetadata() {
        return VesselMetadata.builder()
            .name("basic")
            .version("1.0.0")
            .description("提供基础数据类型和操作节点")
            .author("SeeleFelix")
            .build();
    }
    
    @Override
    public List<SemanticLabelDefinition> getSupportedLabels() {
        return List.of(
            SemanticLabelDefinition.builder()
                .labelName("Int")
                .javaType(Integer.class)
                .build(),
            SemanticLabelDefinition.builder()
                .labelName("String")
                .javaType(String.class)
                .compatibleLabels(List.of("Int"))  // String可以转换为Int
                .converter(this::stringToInt)
                .build(),
            SemanticLabelDefinition.builder()
                .labelName("Signal")
                .javaType(Boolean.class)
                .build()
        );
    }
    
    @Override 
    public List<NodeDefinition> getSupportedNodes() {
        return List.of(
            NodeDefinition.builder()
                .nodeType("Start")
                .outputPorts(List.of(
                    PortDefinition.of("signal", "Signal"),
                    PortDefinition.of("execution_id", "String")
                ))
                .executor(this::executeStart)
                .build(),
            NodeDefinition.builder()
                .nodeType("GetTimestamp")
                .inputPorts(List.of(
                    PortDefinition.of("trigger", "Signal")
                ))
                .outputPorts(List.of(
                    PortDefinition.of("timestamp", "Int"),
                    PortDefinition.of("done", "Signal")
                ))
                .executor(this::executeGetTimestamp)
                .build()
        );
    }
    
    // 事件处理
    @EventListener
    public void handleNodeExecution(NodeExecutionRequest request) {
        if (!"basic".equals(request.getVesselName())) {
            return; // 不是给我的事件
        }
        
        try {
            var result = executeNode(request.getNodeType(), request.getInputs());
            eventDispatcher.dispatch(NodeExecutionResult.success(
                request.getNodeId(), result));
        } catch (Exception e) {
            eventDispatcher.dispatch(NodeExecutionResult.failure(
                request.getNodeId(), e));
        }
    }
    
    // 节点执行逻辑
    private Map<String, Object> executeStart(Map<String, Object> inputs) {
        return Map.of(
            "signal", true,
            "execution_id", UUID.randomUUID().toString()
        );
    }
    
    private Map<String, Object> executeGetTimestamp(Map<String, Object> inputs) {
        return Map.of(
            "timestamp", System.currentTimeMillis(),
            "done", true
        );
    }
    
    // 语义标签转换
    private Object stringToInt(Object value) {
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            throw new SemanticConversionException("Cannot convert '" + value + "' to Int");
        }
    }
}
```

### 插件配置文件

```yaml
# basic插件的vessel.yml
vessel:
  name: basic
  version: 1.0.0
  description: "Basic data types and operations"
  author: SeeleFelix
  license: MIT
  
  dependencies: []  # 无依赖
  
  semantic-labels:
    - name: Int
      java-type: java.lang.Integer
    - name: String  
      java-type: java.lang.String
      compatible-with: [Int]
    - name: Signal
      java-type: java.lang.Boolean
      
  nodes:
    - type: Start
      inputs: []
      outputs:
        - name: signal
          semantic-label: Signal
        - name: execution_id
          semantic-label: String
    - type: GetTimestamp
      inputs:
        - name: trigger
          semantic-label: Signal
      outputs:
        - name: timestamp
          semantic-label: Int
        - name: done
          semantic-label: Signal
```

## 🔄 图执行流程

### 事件驱动的执行模型

```java
@Service
public class GraphCoordinator {
    
    @Autowired
    private EventDispatcher eventDispatcher;
    
    @Autowired
    private StateManager stateManager;
    
    // 执行图
    public CompletableFuture<ExecutionResult> executeGraph(WeaveGraph graph) {
        var context = createExecutionContext(graph);
        
        // 1. 初始化执行状态
        stateManager.initializeExecution(context);
        
        // 2. 找到起始节点并触发
        var startNodes = graph.findStartNodes();
        startNodes.forEach(node -> {
            eventDispatcher.dispatch(new NodeExecutionRequest(
                node.getId(), node.getType(), node.getVessel(), Map.of()));
        });
        
        // 3. 返回Future，等待图执行完成
        return context.getCompletionFuture();
    }
    
    // 处理节点执行完成事件
    @EventListener
    public void handleNodeExecutionComplete(NodeExecutionResult result) {
        var context = stateManager.getExecutionContext(result.getExecutionId());
        
        if (result.isSuccess()) {
            // 1. 更新节点状态
            stateManager.markNodeCompleted(result.getNodeId(), result.getOutputs());
            
            // 2. 传播数据流
            propagateDataFlow(context, result);
            
            // 3. 传播控制流
            propagateControlFlow(context, result);
            
            // 4. 检查图是否执行完成
            if (stateManager.isGraphCompleted(context)) {
                context.complete(ExecutionResult.success(stateManager.getFinalOutputs(context)));
            }
        } else {
            context.complete(ExecutionResult.failure(result.getException()));
        }
    }
    
    private void propagateDataFlow(ExecutionContext context, NodeExecutionResult result) {
        var graph = context.getGraph();
        var connections = graph.getDataConnectionsFrom(result.getNodeId());
        
        connections.forEach(conn -> {
            var value = result.getOutputs().get(conn.getFromPort());
            if (value != null) {
                eventDispatcher.dispatch(new DataFlowEvent(
                    conn.getFromPort(), conn.getToPort(), value, conn.getSemanticLabel()));
            }
        });
    }
    
    private void propagateControlFlow(ExecutionContext context, NodeExecutionResult result) {
        // 类似数据流传播，但传播控制信号
    }
}
```

## 🔧 插件管理系统

### 插件加载器

```java
@Service
public class VesselManager {
    
    private final Map<String, VesselInstance> loadedVessels = new ConcurrentHashMap<>();
    private final VesselLoader vesselLoader;
    
    // 扫描并加载所有插件
    @PostConstruct
    public void discoverAndLoadVessels() {
        // 1. 扫描classpath中的vessel jar包
        var vesselJars = scanVesselJars();
        
        // 2. 解析依赖关系
        var dependencyGraph = buildDependencyGraph(vesselJars);
        
        // 3. 按依赖顺序加载插件
        var loadOrder = topologicalSort(dependencyGraph);
        loadOrder.forEach(this::loadVessel);
    }
    
    public void loadVessel(String vesselPath) {
        try {
            // 1. 加载jar包
            var vesselJar = vesselLoader.loadJar(vesselPath);
            
            // 2. 读取vessel.yml配置
            var metadata = vesselLoader.loadMetadata(vesselJar);
            
            // 3. 实例化vessel类
            var vesselInstance = vesselLoader.instantiate(vesselJar, metadata);
            
            // 4. 初始化vessel
            vesselInstance.initialize(createVesselContext(metadata));
            
            // 5. 注册到系统
            loadedVessels.put(metadata.getName(), vesselInstance);
            
            // 6. 发布vessel加载事件
            eventDispatcher.dispatch(new VesselLoadedEvent(metadata));
            
            log.info("Vessel loaded: {} v{}", metadata.getName(), metadata.getVersion());
            
        } catch (Exception e) {
            log.error("Failed to load vessel: {}", vesselPath, e);
        }
    }
    
    public void unloadVessel(String vesselName) {
        var vessel = loadedVessels.remove(vesselName);
        if (vessel != null) {
            vessel.shutdown();
            eventDispatcher.dispatch(new VesselUnloadedEvent(vesselName));
        }
    }
    
    // 热加载插件
    public void reloadVessel(String vesselName) {
        var currentVessel = loadedVessels.get(vesselName);
        if (currentVessel != null) {
            var vesselPath = currentVessel.getSourcePath();
            unloadVessel(vesselName);
            loadVessel(vesselPath);
        }
    }
}
```

### 插件隔离

```java
// 每个插件有独立的类加载器，实现隔离
public class VesselClassLoader extends URLClassLoader {
    
    private final String vesselName;
    private final Set<String> sharedPackages;
    
    public VesselClassLoader(String vesselName, URL[] urls, ClassLoader parent) {
        super(urls, parent);
        this.vesselName = vesselName;
        this.sharedPackages = Set.of(
            "com.seelefelix.animaweave.framework.event",  // 共享事件接口
            "com.seelefelix.animaweave.framework.vessel"  // 共享插件接口
        );
    }
    
    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        // 共享包从父类加载器加载，确保接口一致性
        if (sharedPackages.stream().anyMatch(name::startsWith)) {
            return getParent().loadClass(name);
        }
        
        // 其他类优先从当前插件加载，实现隔离
        try {
            return findClass(name);
        } catch (ClassNotFoundException e) {
            return super.loadClass(name, resolve);
        }
    }
}
```

## 🎯 插件开发指南

### 创建新插件

#### 1. 项目结构

```
animaweave-vessel-myvessel/
├── pom.xml
├── src/main/java/
│   └── com/mycompany/animaweave/
│       ├── MyVessel.java
│       ├── nodes/
│       │   ├── MyNode1.java
│       │   └── MyNode2.java
│       └── labels/
│           ├── MyLabel1.java
│           └── MyLabel2.java
└── src/main/resources/
    └── vessel.yml
```

#### 2. Maven依赖

```xml
<dependencies>
    <!-- 只依赖framework接口，不依赖具体实现 -->
    <dependency>
        <groupId>com.seelefelix</groupId>
        <artifactId>animaweave-framework-api</artifactId>
        <version>1.0.0</version>
        <scope>provided</scope>  <!-- 运行时由framework提供 -->
    </dependency>
</dependencies>
```

#### 3. 插件实现

```java
@VesselPlugin(name = "myvessel", version = "1.0.0")
public class MyVessel implements AnimaVessel, VesselEventHandler {
    
    // 插件主类只需要实现接口
    // 所有具体逻辑都在独立的类中
    
    @EventListener
    public void handleNodeExecution(NodeExecutionRequest request) {
        // 处理节点执行
    }
}
```

## 📊 性能与监控

### 事件监控

```java
@Component
public class EventMonitor {
    
    private final MeterRegistry meterRegistry;
    
    @EventListener
    public void monitorEvent(AnimaWeaveEvent event) {
        // 记录事件指标
        meterRegistry.counter("animaweave.events", 
            "type", event.getClass().getSimpleName(),
            "vessel", event.getSourceVessel())
            .increment();
    }
    
    // 监控插件性能
    @EventListener
    public void monitorNodeExecution(NodeExecutionResult result) {
        meterRegistry.timer("animaweave.node.execution",
            "vessel", result.getVesselName(),
            "node", result.getNodeType(),
            "status", result.getStatus().toString())
            .record(result.getExecutionTime(), TimeUnit.MILLISECONDS);
    }
}
```

## 🔧 配置管理

### Framework配置

```yaml
# application.yml
animaweave:
  framework:
    # 事件系统配置
    event:
      async: true
      thread-pool-size: 10
      queue-capacity: 1000
    
    # 插件管理配置  
    vessel:
      auto-discovery: true
      scan-paths: 
        - "classpath*:vessels/"
        - "/opt/animaweave/vessels/"
      hot-reload: true
      isolation-level: STRONG  # NONE, WEAK, STRONG
      
    # 执行引擎配置
    execution:
      max-concurrent-graphs: 100
      timeout-seconds: 300
      enable-virtual-threads: true
```

## 🎯 实施计划

### Phase 1: 事件驱动框架核心 (2-3周)

1. **事件系统** - EventDispatcher, EventBus
2. **插件接口** - AnimaVessel, VesselEventHandler  
3. **插件加载器** - VesselManager, VesselLoader
4. **基础图协调** - GraphCoordinator

### Phase 2: 基础插件实现 (2-3周)

1. **basic插件** - 基础数据类型和节点
2. **math插件** - 数学运算节点
3. **io插件** - 输入输出节点
4. **插件热加载** - 运行时加载/卸载

### Phase 3: 高级特性 (2-3周)

1. **插件依赖管理** - 复杂依赖关系处理
2. **插件隔离** - 安全的类加载隔离
3. **性能监控** - 事件和插件性能监控
4. **配置管理** - 灵活的配置系统

## 🔄 总结

这个事件驱动+插件架构的优势：

1. **完全解耦**：framework与vessel插件零依赖
2. **高度灵活**：插件可以独立开发、测试、部署
3. **易于扩展**：添加新功能只需要新插件
4. **热更新**：支持运行时插件更新
5. **性能监控**：完整的事件监控体系

每个vessel都是一个独立的jar包，可以单独分发和更新，这样整个系统就变得非常灵活和可维护！ 