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
import java.util.HashSet;
import java.util.HashMap;

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
        
        // 标记节点为已执行
        context.markNodeExecuted(event.getNodeName());
        
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
            var nodeType = context.getGraphDefinition().getNodeInstances().get(nodeId);
        
            var request = NodeExecutionRequest.of(
                this,
                "GraphCoordinator", 
                nodeId,
                nodeType,
                inputs,
                context.getExecutionId()
            );
            
            log.debug("Triggering node: {} (type: {}) with {} inputs", nodeId, nodeType, inputs.size());
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
            var nodeType = context.getGraphDefinition().getNodeInstances().get(nodeId);
            
            var request = NodeExecutionRequest.of(
                this,
                "GraphCoordinator",
                nodeId,
                nodeType,
                Map.of(), // 初始节点没有输入
                context.getExecutionId()
            );
            
            log.debug("Triggering initial node: {} (type: {})", nodeId, nodeType);
            eventPublisher.publishEvent(request);
        }
    }
    
    /**
     * 寻找准备好执行的节点
     */
    private Set<String> findReadyNodes(ExecutionContext context, String completedNodeName) {
        var graphDef = context.getGraphDefinition();
        var readyNodes = new HashSet<String>();
        
        // 获取所有从完成节点出发的连接
        var outgoingDataConnections = graphDef.getDataConnections().stream()
            .filter(conn -> conn.getSourceNodeName().equals(completedNodeName))
            .toList();
            
        var outgoingControlConnections = graphDef.getControlConnections().stream()
            .filter(conn -> conn.getSourceNodeName().equals(completedNodeName))
            .toList();
        
        // 收集所有可能被触发的目标节点
        var candidateNodes = new HashSet<String>();
        outgoingDataConnections.forEach(conn -> candidateNodes.add(conn.getTargetNodeName()));
        outgoingControlConnections.forEach(conn -> candidateNodes.add(conn.getTargetNodeName()));
        
        // 对每个候选节点，检查其所有依赖是否都已满足
        for (String nodeId : candidateNodes) {
            if (isNodeReadyToExecute(context, nodeId)) {
                readyNodes.add(nodeId);
                log.debug("Node {} is ready to execute after {} completion", nodeId, completedNodeName);
            } else {
                log.trace("Node {} not ready yet, waiting for more dependencies", nodeId);
            }
        }
        
        log.debug("Found {} ready nodes after {} completion: {}", readyNodes.size(), completedNodeName, readyNodes);
        return readyNodes;
    }
    
    /**
     * 检查节点是否准备好执行（所有依赖都已满足）
     */
    private boolean isNodeReadyToExecute(ExecutionContext context, String nodeId) {
        var graphDef = context.getGraphDefinition();
        
        // 获取该节点的所有输入连接
        var incomingDataConnections = graphDef.getDataConnections().stream()
            .filter(conn -> conn.getTargetNodeName().equals(nodeId))
            .toList();
            
        var incomingControlConnections = graphDef.getControlConnections().stream()
            .filter(conn -> conn.getTargetNodeName().equals(nodeId))
            .toList();
        
        // 检查所有数据依赖是否都已满足
        for (var connection : incomingDataConnections) {
            String sourceNode = connection.getSourceNodeName();
            String sourcePort = connection.getSourcePortName();
            
            if (!context.hasNodeOutput(sourceNode, sourcePort)) {
                log.trace("Node {} waiting for data: {}.{}", nodeId, sourceNode, sourcePort);
                return false;
            }
        }
        
        // 检查所有控制依赖是否都已满足
        for (var connection : incomingControlConnections) {
            String sourceNode = connection.getSourceNodeName();
            String sourcePort = connection.getSourcePortName();
            
            if (!context.hasNodeOutput(sourceNode, sourcePort)) {
                log.trace("Node {} waiting for control signal: {}.{}", nodeId, sourceNode, sourcePort);
                return false;
            }
        }
        
        // 检查该节点是否已经执行过（避免重复执行）
        if (context.hasNodeBeenExecuted(nodeId)) {
            log.trace("Node {} already executed, skipping", nodeId);
            return false;
        }
        
        return true;
    }

    /**
     * 收集节点的输入数据
     */
    private Map<String, Object> collectNodeInputs(ExecutionContext context, String nodeId) {
        var graphDef = context.getGraphDefinition();
        var inputs = new HashMap<String, Object>();
        
        // 收集数据输入
        var incomingDataConnections = graphDef.getDataConnections().stream()
            .filter(conn -> conn.getTargetNodeName().equals(nodeId))
            .toList();
            
        for (var connection : incomingDataConnections) {
            String sourceNode = connection.getSourceNodeName();
            String sourcePort = connection.getSourcePortName();
            String targetPort = connection.getTargetPortName();
            
            Object value = context.getNodeOutput(sourceNode, sourcePort);
            if (value != null) {
                inputs.put(targetPort, value);
                log.trace("Collected data input for {}.{} from {}.{}: {}", 
                         nodeId, targetPort, sourceNode, sourcePort, value);
            }
        }
        
        // 收集控制输入（通常是Signal类型）
        var incomingControlConnections = graphDef.getControlConnections().stream()
            .filter(conn -> conn.getTargetNodeName().equals(nodeId))
            .toList();
            
        for (var connection : incomingControlConnections) {
            String sourceNode = connection.getSourceNodeName();
            String sourcePort = connection.getSourcePortName();
            String targetPort = connection.getTargetPortName();
            
            Object value = context.getNodeOutput(sourceNode, sourcePort);
            if (value != null) {
                inputs.put(targetPort, value);
                log.trace("Collected control input for {}.{} from {}.{}: {}", 
                         nodeId, targetPort, sourceNode, sourcePort, value);
            }
        }
        
        log.debug("Collected {} inputs for node {}: {}", inputs.size(), nodeId, inputs.keySet());
        return inputs;
    }
    
    /**
     * 寻找没有依赖的初始节点
     */
    private Set<String> findNodesWithoutDependencies(GraphDefinition graphDef) {
        var allNodes = graphDef.getNodeInstances().keySet();
        var nodesWithInputs = new HashSet<String>();
        
        // 找出所有有数据输入连接的节点
        for (var connection : graphDef.getDataConnections()) {
            nodesWithInputs.add(connection.getTargetNodeName());
        }
        
        // 找出所有有控制输入连接的节点
        for (var connection : graphDef.getControlConnections()) {
            nodesWithInputs.add(connection.getTargetNodeName());
        }
        
        // 初始节点 = 所有节点 - 有输入的节点
        var initialNodes = new HashSet<>(allNodes);
        initialNodes.removeAll(nodesWithInputs);
        
        log.debug("Found {} initial nodes: {}", initialNodes.size(), initialNodes);
        return initialNodes;
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