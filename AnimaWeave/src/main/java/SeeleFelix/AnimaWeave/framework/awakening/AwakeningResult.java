package SeeleFelix.AnimaWeave.framework.awakening;

import lombok.Getter;
import lombok.ToString;

import java.time.Instant;

/**
 * 觉醒结果
 * 表示图执行的结果状态
 */
@Getter
@ToString
public final class AwakeningResult {
    
    private final String graphName;
    private final boolean success;
    private final String message;
    private final Instant timestamp;
    private final String executionId;
    
    private AwakeningResult(String graphName, boolean success, String message, String executionId) {
        this.graphName = graphName;
        this.success = success;
        this.message = message;
        this.executionId = executionId;
        this.timestamp = Instant.now();
    }
    
    /**
     * 创建成功结果
     */
    public static AwakeningResult success(String graphName, String message) {
        return new AwakeningResult(graphName, true, message, null);
    }
    
    /**
     * 创建成功结果，包含执行ID
     */
    public static AwakeningResult success(String graphName, String message, String executionId) {
        return new AwakeningResult(graphName, true, message, executionId);
    }
    
    /**
     * 创建失败结果
     */
    public static AwakeningResult failure(String graphName, String errorMessage) {
        return new AwakeningResult(graphName, false, errorMessage, null);
    }
    
    /**
     * 检查是否失败
     */
    public boolean isFailure() {
        return !success;
    }
    
    /**
     * 获取结果摘要
     */
    public String getSummary() {
        return "Graph '%s' awakening %s: %s".formatted(
            graphName,
            success ? "SUCCEEDED" : "FAILED",
            message
        );
    }
} 