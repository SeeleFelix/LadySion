package SeeleFelix.AnimaWeave.framework.graph;

import java.util.Map;

/**
 * 图执行结果
 */
public record GraphExecutionResult(
    String executionId,
    boolean success,
    String message,
    Map<String, Object> outputs
) {
    
    /**
     * 创建成功结果
     */
    public static GraphExecutionResult success(String executionId, Map<String, Object> outputs) {
        return new GraphExecutionResult(executionId, true, "Execution completed successfully", outputs);
    }
    
    /**
     * 创建失败结果
     */
    public static GraphExecutionResult failure(String executionId, String errorMessage) {
        return new GraphExecutionResult(executionId, false, errorMessage, Map.of());
    }
    
    /**
     * 检查是否成功
     */
    public boolean isSuccess() {
        return success;
    }
    
    /**
     * 检查是否失败
     */
    public boolean isFailure() {
        return !success;
    }
} 