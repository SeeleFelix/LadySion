package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.event.events.NodeOutputSaveEvent;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Map;

/**
 * 节点实例基类 - 重构版本
 * 
 * 每个节点类型都是此类的一个实例，具有：
 * 1. 节点类型标识
 * 2. 业务逻辑执行
 * 3. 事件发布封装
 * 
 * 事件监听现在由NodeEventRouter统一处理，避免SpEL问题
 */
@Slf4j
@Getter
@RequiredArgsConstructor
public abstract class Node {
    
    private final String nodeName;  // 节点名称（用于标识）
    private final String nodeType;  // 节点类型（如basic.Start等）
    private final ApplicationEventPublisher eventPublisher;
    
    /**
     * 执行节点逻辑的模板方法
     * 由NodeEventRouter调用，封装了所有样板代码
     */
    public void executeWithTemplate(String nodeId, Map<String, Object> inputs, String executionContextId, String nodeExecutionId) {
        log.debug("Node type {} 开始执行: nodeId={}, inputCount={}", 
                 nodeType, nodeId, inputs.size());
        
        try {
            // 执行具体的业务逻辑
            var outputs = executeNode(inputs);
            
            // 使用传入的执行ID
            var finalExecutionId = nodeExecutionId != null ? nodeExecutionId : generateExecutionId(nodeId);
            
            // 发送成功事件
            var saveEvent = createSuccessEvent(nodeId, finalExecutionId, outputs, executionContextId);
            eventPublisher.publishEvent(saveEvent);
            
            log.debug("Node type {} 执行成功: nodeId={}, executionId={}, outputCount={}", 
                     nodeType, nodeId, finalExecutionId, outputs.size());
            
        } catch (Exception e) {
            log.error("Node type {} 执行失败: nodeId={}", nodeType, nodeId, e);
            
            // 使用传入的执行ID或生成错误执行ID
            var errorExecutionId = nodeExecutionId != null ? nodeExecutionId : generateErrorExecutionId(nodeId);
            
            // 发送错误事件
            var errorEvent = createErrorEvent(nodeId, errorExecutionId, e.getMessage(), executionContextId);
            eventPublisher.publishEvent(errorEvent);
        }
    }
    
    /**
     * 子类实现的具体节点逻辑 - 纯业务逻辑，无样板代码
     * 
     * @param inputs 预收集的输入数据 (portName -> value)
     * @return 输出数据 (portName -> value)
     */
    protected abstract Map<String, Object> executeNode(Map<String, Object> inputs);
    
    /**
     * 生成节点执行ID
     */
    private String generateExecutionId(String nodeId) {
        return nodeId + "_exec_" + System.nanoTime();
    }
    
    /**
     * 生成错误执行ID
     */
    private String generateErrorExecutionId(String nodeId) {
        return nodeId + "_exec_error_" + System.nanoTime();
    }
    
    /**
     * 创建成功事件
     */
    private NodeOutputSaveEvent createSuccessEvent(
            String nodeId, 
            String executionId, 
            Map<String, Object> outputs, 
            String executionContextId) {
        
        return NodeOutputSaveEvent.of(
                this,
                nodeId,
                nodeId,
                executionId,
                outputs,
                executionContextId
        );
    }
    
    /**
     * 创建错误事件
     */
    private NodeOutputSaveEvent createErrorEvent(
            String nodeId,
            String errorExecutionId,
            String errorMessage,
            String executionContextId) {
        
        return NodeOutputSaveEvent.of(
                this,
                nodeId,
                nodeId,
                errorExecutionId,
                Map.of("error", errorMessage),
                executionContextId
        );
    }
} 