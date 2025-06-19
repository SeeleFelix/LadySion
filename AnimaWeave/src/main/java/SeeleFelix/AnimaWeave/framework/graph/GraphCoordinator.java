package SeeleFelix.AnimaWeave.framework.graph;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import SeeleFelix.AnimaWeave.framework.event.events.NodeOutputSaveEvent;
import SeeleFelix.AnimaWeave.framework.startup.SystemReadyEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 图执行协调器 - 简化的事件驱动版本
 * 
 * 职责：
 * 1. 等待系统就绪
 * 2. 监听节点完成事件 (NodeOutputSaveEvent)
 * 3. 更新数据总线
 * 4. 触发下一批可执行的节点
 * 5. 判断图执行完成
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GraphCoordinator {
    
    private final ApplicationEventPublisher eventPublisher;
    
    // 执行上下文管理 - 简化版本
    private final ConcurrentMap<String, ExecutionContext> executionContexts = new ConcurrentHashMap<>();
    
    // 系统就绪状态
    private final AtomicBoolean systemReady = new AtomicBoolean(false);
                
    /**
     * 监听系统就绪事件
     */
    @EventListener
    public void onSystemReady(SystemReadyEvent event) {
        systemReady.set(true);
        log.info("🚀 System is ready! Graph execution is now available.");
        log.info("Available vessels: {}", event.getLoadedVessels());
    }
    
    /**
     * 启动图执行
     */
    public String startGraphExecution(GraphDefinition graphDef) {
        if (!systemReady.get()) {
            throw new IllegalStateException("System is not ready yet. Please wait for all vessels to load.");
        }
        
        var executionId = "graph_exec_" + System.nanoTime();
        var context = new ExecutionContext(executionId, graphDef);
        executionContexts.put(executionId, context);
        
        log.info("Starting graph execution: {} for graph: {}", executionId, graphDef.getName());
        
        // 触发初始节点（没有依赖的节点）
        triggerInitialNodes(context);
        
        return executionId;
    }
    
    /**
     * 监听节点输出保存事件 - 这是核心的事件驱动逻辑
     */
    @EventListener
    @Async("virtualThreadExecutor")
    public void onNodeComplete(NodeOutputSaveEvent event) {
        log.debug("Node completed: {} (execution: {})", event.getNodeName(), event.getNodeExecutionId());
        
        var context = executionContexts.get(event.getGraphExecutionId());
        if (context == null) {
            log.warn("No execution context found for: {}", event.getGraphExecutionId());
            return;
        }
        
        // 更新数据总线
        updateDataBus(context, event);
        
        // 触发下一批可执行的节点
        triggerNextNodes(context, event.getNodeName());
        
        // 检查是否完成
        checkGraphCompletion(context);
    }
    
    /**
     * 更新数据总线
     */
    private void updateDataBus(ExecutionContext context, NodeOutputSaveEvent event) {
        // 将节点的所有输出端口保存到数据总线
        event.getOutputs().forEach((portName, value) -> {
            context.setNodeOutput(event.getNodeName(), portName, value, event.getNodeExecutionId());
        });
        
        log.trace("Updated data bus for node: {} with {} outputs", 
                 event.getNodeName(), event.getOutputs().size());
    }
    
    /**
     * 触发下一批可执行的节点
     */
    private void triggerNextNodes(ExecutionContext context, String completedNodeName) {
        var readyNodes = findReadyNodes(context, completedNodeName);
        
        for (String nodeId : readyNodes) {
            var inputs = collectNodeInputs(context, nodeId);
        
            var request = NodeExecutionRequest.of(
                this,
                "GraphCoordinator", 
                nodeId,
                inputs,
                context.getExecutionId()
            );
            
            log.debug("Triggering node: {} with {} inputs", nodeId, inputs.size());
            eventPublisher.publishEvent(request);
        }
    }
    
    /**
     * 触发初始节点（没有输入依赖的节点）
     */
    private void triggerInitialNodes(ExecutionContext context) {
        var graphDef = context.getGraphDefinition();
        var initialNodes = findNodesWithoutDependencies(graphDef);
        
        for (String nodeId : initialNodes) {
            var request = NodeExecutionRequest.of(
                this,
                "GraphCoordinator",
                nodeId,
                Map.of(), // 初始节点没有输入
                context.getExecutionId()
            );
            
            log.debug("Triggering initial node: {}", nodeId);
            eventPublisher.publishEvent(request);
        }
    }
    
    /**
     * 寻找准备好执行的节点
     */
    private Set<String> findReadyNodes(ExecutionContext context, String completedNodeName) {
        // TODO: 实现基于图定义的依赖分析
        // 现在先返回空集合，避免编译错误
        return Set.of();
    }
    
    /**
     * 收集节点的输入数据
     */
    private Map<String, Object> collectNodeInputs(ExecutionContext context, String nodeId) {
        // TODO: 根据图定义收集节点的输入
        // 现在先返回空Map，避免编译错误
        return Map.of();
    }
    
    /**
     * 寻找没有依赖的初始节点
     */
    private Set<String> findNodesWithoutDependencies(GraphDefinition graphDef) {
        // TODO: 实现图分析逻辑
        // 现在先返回空集合，避免编译错误
        return Set.of();
    }
    
    /**
     * 检查图执行是否完成
     */
    private void checkGraphCompletion(ExecutionContext context) {
        // TODO: 实现完成检查逻辑
        log.trace("Checking graph completion for: {}", context.getExecutionId());
    }
    
    /**
     * 获取活跃的执行上下文数量
     */
    public int getActiveExecutionCount() {
        return executionContexts.size();
    }
    
    /**
     * 停止图执行
     */
    public boolean stopExecution(String executionId) {
        var context = executionContexts.remove(executionId);
        if (context != null) {
            log.info("Stopped graph execution: {}", executionId);
                return true;
        }
        return false;
    }
    
    /**
     * 检查系统是否就绪
     */
    public boolean isSystemReady() {
        return systemReady.get();
    }
} 