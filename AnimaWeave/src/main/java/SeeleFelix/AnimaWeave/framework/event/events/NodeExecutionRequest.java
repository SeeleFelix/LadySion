package SeeleFelix.AnimaWeave.framework.event.events;

import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

import java.util.Map;

/**
 * 节点执行请求事件 - 简化版本
 * 
 * GraphCoordinator发送此事件来请求执行特定节点
 * NodeInstance通过@EventListener(condition)自动匹配
 */
@Getter
@ToString(callSuper = true, of = {"nodeId", "inputsSize"})
@EqualsAndHashCode(callSuper = false, of = {"nodeId", "executionContextId"})
public final class NodeExecutionRequest extends AnimaWeaveEvent {
    
    private final String nodeId;                    // 目标节点ID
    private final Map<String, Object> inputs;      // 节点输入数据
    private final String executionContextId;       // 图执行上下文ID
    
    public NodeExecutionRequest(Object source, String sourceIdentifier,
                               String nodeId, Map<String, Object> inputs, 
                               String executionContextId) {
        super(source, sourceIdentifier);
        this.nodeId = nodeId;
        this.inputs = inputs != null ? Map.copyOf(inputs) : Map.of();
        this.executionContextId = executionContextId;
    }
    
    /**
     * 便捷的静态工厂方法
     */
    public static NodeExecutionRequest of(Object source, String sourceIdentifier,
                                        String nodeId, Map<String, Object> inputs,
                                        String executionContextId) {
        return new NodeExecutionRequest(source, sourceIdentifier, nodeId, inputs, executionContextId);
    }
    
    /**
     * 检查是否有输入数据
     */
    public boolean hasInputs() {
        return !inputs.isEmpty();
    }
    
    /**
     * 获取输入数量
     */
    public int getInputsSize() {
        return inputs.size();
    }
    
    /**
     * 获取执行摘要
     */
    public String getExecutionSummary() {
        return "Request execution of node '%s' with %d inputs: %s".formatted(
            nodeId, inputs.size(), inputs.keySet()
        );
    }
} 