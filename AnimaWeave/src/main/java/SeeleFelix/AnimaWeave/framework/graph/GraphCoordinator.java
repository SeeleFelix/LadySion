package SeeleFelix.AnimaWeave.framework.graph;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;
import SeeleFelix.AnimaWeave.framework.event.events.*;
import SeeleFelix.AnimaWeave.framework.vessel.VesselRegistry;
import SeeleFelix.AnimaWeave.framework.vessel.AnimaVessel;
import SeeleFelix.AnimaWeave.framework.vessel.NodeDefinition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

/**
 * 图执行协调器
 * 负责协调整个图的执行，管理节点间的数据流和控制流
 * 使用Java 21 + Spring 6.1 + lombok现代化实现
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GraphCoordinator {
    
    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(30);
    
    private final EventDispatcher eventDispatcher;
    private final VesselRegistry vesselRegistry;
    
    // 执行上下文管理 - 使用Java 21增强的ConcurrentHashMap
    private final ConcurrentMap<String, ExecutionContext> executionContexts = new ConcurrentHashMap<>();
    
    /**
     * 执行单个节点 - 使用现代化的异步模式
     */
    public CompletableFuture<NodeExecutionResult> executeNode(String nodeId, String nodeType,
                                                              Map<String, Object> inputs,
                                                              String executionContextId) {
        log.debug("Executing node: {} of type: {}", nodeId, nodeType);
        
        // 使用Optional链式处理
        return vesselRegistry.getVesselForNodeType(nodeType)
            .map(vessel -> {
                var vesselName = vessel.getMetadata().name();
                
                // 创建节点执行请求
                var request = new NodeExecutionRequest(
                    this,
                    "GraphCoordinator",
                    nodeId,
                    nodeType,
                    vesselName,
                    inputs,
                    extractInputLabels(vessel, nodeType, inputs),
                    executionContextId
                );
                
                // 发送请求并等待响应
                return eventDispatcher.dispatch(request, NodeExecutionResult.class);
            })
            .orElseGet(() -> {
                var future = new CompletableFuture<NodeExecutionResult>();
                var errorMessage = """
                    No vessel found for node type: %s
                    
                    Available node types: %s
                    """.formatted(
                        nodeType,
                        vesselRegistry.getAllSupportedNodeTypes()
                    );
                future.completeExceptionally(new IllegalArgumentException(errorMessage));
                return future;
            });
    }
    
    /**
     * 执行完整的图 - 使用Virtual Threads并行执行
     */
    @Async("graphExecutionThreadPool")
    public CompletableFuture<GraphExecutionResult> executeGraph(GraphDefinition graphDef) {
        var executionId = UUID.randomUUID().toString();
        log.info("Starting graph execution: {}", executionId);
        
        var context = new ExecutionContext(executionId, graphDef);
        executionContexts.put(executionId, context);
        
        return CompletableFuture
            .supplyAsync(() -> executeGraphInternal(context))
            .exceptionally(throwable -> {
                log.error("Graph execution failed: {}", executionId, throwable);
                executionContexts.remove(executionId);
                return new GraphExecutionResult(executionId, false, throwable.getMessage(), Map.of());
            });
    }
    
    /**
     * 内部图执行方法 - 使用Java 21的现代化并发
     */
    private GraphExecutionResult executeGraphInternal(ExecutionContext context) {
        try {
            // 拓扑排序确定执行顺序
            var executionOrder = topologicalSort(context.getGraphDefinition());
            
            // 使用CompletableFuture链式执行节点
            var result = executeNodesSequentially(context, executionOrder);
            
            log.info("Graph execution completed: {}", context.getExecutionId());
            return result;
            
        } catch (Exception e) {
            log.error("Failed to execute graph: {}", context.getExecutionId(), e);
            throw new RuntimeException("Graph execution failed", e);
        } finally {
            executionContexts.remove(context.getExecutionId());
        }
    }
    
    /**
     * 顺序执行节点 - 使用函数式编程风格
     */
    private GraphExecutionResult executeNodesSequentially(ExecutionContext context, List<String> executionOrder) {
        return executionOrder.stream()
            .reduce(
                CompletableFuture.completedFuture(context),
                (futureContext, nodeId) -> futureContext.thenCompose(ctx -> executeNodeAndUpdate(ctx, nodeId)),
                (f1, f2) -> f2  // combiner不会被使用，因为这是顺序执行
            )
            .thenApply(ctx -> new GraphExecutionResult(
                ctx.getExecutionId(), 
                true, 
                "Completed successfully", 
                ctx.getOutputs()
            ))
            .join();
    }
    
    /**
     * 执行节点并更新上下文
     */
    private CompletableFuture<ExecutionContext> executeNodeAndUpdate(ExecutionContext context, String nodeId) {
        var node = context.getGraphDefinition().getNode(nodeId);
        var nodeInputs = collectNodeInputs(context, nodeId);
        
        return executeNode(nodeId, node.nodeType(), nodeInputs, context.getExecutionId())
            .thenApply(result -> {
                if (result.isFailure()) {
                    throw new RuntimeException("Node execution failed: " + result.getErrorMessage());
                }
                
                updateContextWithNodeResult(context, nodeId, result);
                return context;
            });
    }
    
    /**
     * 监听节点执行结果事件 - 使用现代化的事件处理
     */
    @EventListener
    public void handleNodeExecutionResult(NodeExecutionResult result) {
        log.trace("Received node execution result: {}", result);
        eventDispatcher.handleResponse(result, result.getRequestId());
    }
    
    /**
     * 监听数据流事件 - 使用switch表达式
     */
    @EventListener
    public void handleDataFlowEvent(DataFlowEvent event) {
        var action = switch (event.getEventType()) {
            case "DataFlowEvent" -> {
                log.trace("Data flow: {} -> {}", event.getFromNodeId(), event.getToNodeId());
                yield "processed";
            }
            default -> {
                log.warn("Unknown data flow event type: {}", event.getEventType());
                yield "ignored";
            }
        };
        
        // 更新执行上下文中的数据流
        Optional.ofNullable(executionContexts.get(event.getExecutionContextId()))
            .ifPresent(context -> context.updateDataFlow(event.getConnectionId(), event.getValue()));
    }
    
    /**
     * 提取输入端口的语义标签 - 使用现代化的流式API
     */
    private Map<String, String> extractInputLabels(AnimaVessel vessel, String nodeType, Map<String, Object> inputs) {
        return vessel.getSupportedNodes().stream()
                .filter(node -> node.nodeType().equals(nodeType))
                .findFirst()
                .map(NodeDefinition::inputPorts)
                .orElse(List.of())
                .stream()
                .filter(port -> inputs.containsKey(port.name()))
                .collect(Collectors.toMap(
                    port -> port.name(),
                    port -> port.semanticLabel().labelName()
                ));
    }
    
    /**
     * 收集节点的输入数据 - 使用现代化的数据收集
     */
    private Map<String, Object> collectNodeInputs(ExecutionContext context, String nodeId) {
        var graphDef = context.getGraphDefinition();
        
        return graphDef.getConnections().stream()
            .filter(connection -> connection.toNodeId().equals(nodeId))
            .collect(Collectors.toMap(
                connection -> connection.toPortName(),
                connection -> context.getNodeOutput(connection.fromNodeId(), connection.fromPortName()),
                (existing, replacement) -> replacement  // 如果有重复键，使用新值
            ));
    }
    
    /**
     * 更新上下文与节点结果
     */
    private void updateContextWithNodeResult(ExecutionContext context, String nodeId, NodeExecutionResult result) {
        result.getOutputs().forEach((portName, value) -> 
            context.setNodeOutput(nodeId, portName, value)
        );
    }
    
    /**
     * 拓扑排序 - 使用现代化的图算法
     */
    private List<String> topologicalSort(GraphDefinition graphDef) {
        var result = new ArrayList<String>();
        var visited = new HashSet<String>();
        var visiting = new HashSet<String>();
        
        // 使用并行流处理图节点
        graphDef.getNodes().keySet().parallelStream()
            .filter(nodeId -> !visited.contains(nodeId))
            .forEach(nodeId -> topologicalSortDFS(nodeId, graphDef, visited, visiting, result));
        
        Collections.reverse(result);
        return result;
    }
    
    /**
     * 拓扑排序的DFS实现
     */
    private synchronized void topologicalSortDFS(String nodeId, GraphDefinition graphDef, 
                                  Set<String> visited, Set<String> visiting, List<String> result) {
        if (visiting.contains(nodeId)) {
            throw new IllegalArgumentException("Circular dependency detected in graph");
        }
        
        if (visited.contains(nodeId)) {
            return;
        }
        
        visiting.add(nodeId);
        
        // 访问所有依赖节点
        graphDef.getConnections().stream()
            .filter(conn -> conn.fromNodeId().equals(nodeId))
            .map(conn -> conn.toNodeId())
            .distinct()
            .forEach(dependentNode -> topologicalSortDFS(dependentNode, graphDef, visited, visiting, result));
        
        visiting.remove(nodeId);
        visited.add(nodeId);
        result.add(nodeId);
    }
    
    /**
     * 获取活跃的执行上下文数量 - 监控用
     */
    public int getActiveExecutionCount() {
        return executionContexts.size();
    }
    
    /**
     * 取消图执行
     */
    public boolean cancelExecution(String executionId) {
        return Optional.ofNullable(executionContexts.remove(executionId))
            .map(context -> {
                log.info("Cancelled graph execution: {}", executionId);
                return true;
            })
            .orElse(false);
    }
} 