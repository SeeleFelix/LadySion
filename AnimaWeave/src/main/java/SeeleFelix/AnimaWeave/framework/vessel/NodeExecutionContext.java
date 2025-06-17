package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Map;

/**
 * 节点执行上下文
 */
public record NodeExecutionContext(
    String nodeId,
    String executionId,
    Map<String, Object> metadata
) {
    
    public static NodeExecutionContext of(String nodeId, String executionId) {
        return new NodeExecutionContext(nodeId, executionId, Map.of());
    }
} 