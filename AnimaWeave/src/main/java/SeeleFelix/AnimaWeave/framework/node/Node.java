package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import SeeleFelix.AnimaWeave.framework.event.events.NodeOutputSaveEvent;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;

import java.util.Map;

/**
 * 节点实例基类 - 简化的事件驱动版本
 * 
 * 每个图中的节点都是此类的一个实例，具有：
 * 1. 唯一的节点名称 (在图中唯一)
 * 2. 监听针对自己的执行请求
 * 3. 执行完成后发送统一的保存事件
 * 4. 不直接访问数据总线
 */
@Slf4j
@Getter
@RequiredArgsConstructor
public abstract class Node {
    
    private final String nodeName;  // 图中的唯一节点名称
    private final String nodeType;  // 节点类型（如Add, Multiply等）
    private final ApplicationEventPublisher eventPublisher;
    
    /**
     * 监听针对自己类型的执行请求 - 使用Spring条件监听
     * 一个nodeType实例可以处理图中多个相同类型的节点
     */
    @EventListener(condition = "#request.nodeType == this.nodeType")
    @Async("virtualThreadExecutor")
    public void handleExecution(NodeExecutionRequest request) {
        log.debug("Node type {} (instance: {}) received execution request for nodeId: {} with {} inputs", 
                 nodeType, nodeName, request.getNodeId(), request.getInputs().size());
        
        try {
            // 执行节点特定的计算逻辑
            var outputs = executeNode(request.getInputs());
            
            // 生成节点执行ID (使用图中的实际nodeId)
            var nodeExecutionId = request.getNodeId() + "_exec_" + System.nanoTime();
            
            // 发送统一的保存事件 (使用图中的实际nodeId)
            var saveEvent = NodeOutputSaveEvent.of(
                this,
                request.getNodeId(),  // 使用图中的nodeId
                request.getNodeId(),  // 使用图中的nodeId
                nodeExecutionId,
                outputs,
                request.getExecutionContextId()
            );
            
            eventPublisher.publishEvent(saveEvent);
            
            log.debug("Node type {} completed execution for nodeId: {}, published save event with {} outputs", 
                     nodeType, request.getNodeId(), outputs.size());
            
        } catch (Exception e) {
            log.error("Node type {} execution failed for nodeId: {}", nodeType, request.getNodeId(), e);
            
            // 生成错误执行ID
            var errorExecutionId = request.getNodeId() + "_exec_error_" + System.nanoTime();
            
            // 发送错误事件
            var errorEvent = NodeOutputSaveEvent.of(
                this,
                request.getNodeId(),  // 使用图中的nodeId
                request.getNodeId(),  // 使用图中的nodeId
                errorExecutionId,
                Map.of("error", e.getMessage()),
                request.getExecutionContextId()
            );
            
            eventPublisher.publishEvent(errorEvent);
        }
    }
    
    /**
     * 子类实现的具体节点逻辑
     * 
     * @param inputs 预收集的输入数据 (portName -> value)
     * @return 输出数据 (portName -> value)
     */
    protected abstract Map<String, Object> executeNode(Map<String, Object> inputs);
} 