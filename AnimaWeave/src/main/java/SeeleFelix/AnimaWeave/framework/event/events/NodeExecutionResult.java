package SeeleFelix.AnimaWeave.framework.event.events;

import lombok.Getter;
import lombok.ToString;
import lombok.experimental.Accessors;
import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

/**
 * 节点执行结果事件
 * vessel插件返回给框架的节点执行结果
 * 使用lombok + 静态工厂方法的实用现代化方案
 */
@Getter
@ToString(callSuper = true, of = {"nodeId", "vesselName", "successful", "originalRequestId"})
@Accessors(fluent = true)
public class NodeExecutionResult extends AnimaWeaveEvent {
    
    private final String nodeId;
    private final String nodeType;
    private final String vesselName;
    private final String originalRequestId;  // 对应的请求事件ID
    private final boolean successful;
    private final Map<String, Object> outputs;
    private final String errorMessage;
    private final Throwable exception;
    private final Duration executionTime;
    private final String executionContextId;
    
    // 私有主构造函数
    private NodeExecutionResult(Object source, String sourceIdentifier, String nodeId, String nodeType,
                              String vesselName, String originalRequestId, boolean successful,
                              Map<String, Object> outputs, String errorMessage, Throwable exception,
                              Duration executionTime, String executionContextId) {
        super(source, sourceIdentifier);
        this.nodeId = nodeId;
        this.nodeType = nodeType;
        this.vesselName = vesselName;
        this.originalRequestId = originalRequestId;
        this.successful = successful;
        this.outputs = outputs != null ? Map.copyOf(outputs) : Map.of();
        this.errorMessage = errorMessage;
        this.exception = exception;
        this.executionTime = executionTime;
        this.executionContextId = executionContextId;
    }
    
    // Builder风格的静态工厂方法 - 成功执行
    public static NodeExecutionResult success(Object source, String sourceIdentifier, 
                                            String nodeId, String nodeType, String vesselName, 
                                            String originalRequestId, Map<String, Object> outputs,
                                            Duration executionTime, String executionContextId) {
        return new NodeExecutionResult(source, sourceIdentifier, nodeId, nodeType, vesselName,
                originalRequestId, true, outputs, null, null, executionTime, executionContextId);
    }
    
    // Builder风格的静态工厂方法 - 执行失败
    public static NodeExecutionResult failure(Object source, String sourceIdentifier,
                                            String nodeId, String nodeType, String vesselName,
                                            String originalRequestId, String errorMessage,
                                            Throwable exception, Duration executionTime, 
                                            String executionContextId) {
        return new NodeExecutionResult(source, sourceIdentifier, nodeId, nodeType, vesselName,
                originalRequestId, false, null, errorMessage, exception, executionTime, executionContextId);
    }
    
    // 便捷方法 - 使用Java 21的现代化写法
    public boolean isFailure() {
        return !successful;
    }
    
    public Optional<Throwable> exception() {
        return Optional.ofNullable(exception);
    }
    
    public String getRequestId() {
        return originalRequestId;
    }
    
    // 流式API便捷方法
    public boolean hasError() {
        return errorMessage != null || exception != null;
    }
    
    public boolean hasOutputs() {
        return outputs != null && !outputs.isEmpty();
    }
} 