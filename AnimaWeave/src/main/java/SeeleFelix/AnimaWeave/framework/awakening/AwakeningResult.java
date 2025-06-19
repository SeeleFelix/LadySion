package SeeleFelix.AnimaWeave.framework.awakening;

import lombok.Getter;
import lombok.ToString;
import SeeleFelix.AnimaWeave.framework.graph.ExecutionContext;

import java.time.Instant;
import java.time.Duration;
import java.util.*;

/**
 * 觉醒结果
 * 表示图执行的结果状态，包含详细的执行信息
 */
@Getter
@ToString
public final class AwakeningResult {
    
    private final String graphName;
    private final boolean success;
    private final String message;
    private final Instant timestamp;
    private final String executionId;
    
    // 新增：执行详细信息
    private final ExecutionSummary executionSummary;
    
    private AwakeningResult(String graphName, boolean success, String message, String executionId, ExecutionSummary executionSummary) {
        this.graphName = graphName;
        this.success = success;
        this.message = message;
        this.executionId = executionId;
        this.executionSummary = executionSummary;
        this.timestamp = Instant.now();
    }
    
    /**
     * 创建成功结果
     */
    public static AwakeningResult success(String graphName, String message) {
        return new AwakeningResult(graphName, true, message, null, ExecutionSummary.empty());
    }
    
    /**
     * 创建成功结果，包含执行ID
     */
    public static AwakeningResult success(String graphName, String message, String executionId) {
        return new AwakeningResult(graphName, true, message, executionId, ExecutionSummary.empty());
    }
    
    /**
     * 创建带执行详情的成功结果
     */
    public static AwakeningResult successWithDetails(String graphName, String message, String executionId, ExecutionSummary executionSummary) {
        return new AwakeningResult(graphName, true, message, executionId, executionSummary);
    }
    
    /**
     * 创建失败结果
     */
    public static AwakeningResult failure(String graphName, String errorMessage) {
        return new AwakeningResult(graphName, false, errorMessage, null, ExecutionSummary.empty());
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
    
    /**
     * 获取详细的执行报告
     */
    public String getDetailedReport() {
        if (executionSummary.isEmpty()) {
            return getSummary();
        }
        
        var report = new StringBuilder();
        report.append(getSummary()).append("\n");
        report.append("📊 Execution Details:\n");
        report.append("   Duration: ").append(executionSummary.getTotalDuration()).append("\n");
        report.append("   Nodes Executed: ").append(executionSummary.getExecutedNodesCount()).append("\n");
        report.append("   Timeline:\n");
        
        executionSummary.getExecutionTimeline().forEach(step -> {
            report.append("     ").append(step.getFormattedStep()).append("\n");
        });
        
        return report.toString();
    }
    
    /**
     * 执行摘要 - 包含详细的执行信息
     */
    @Getter
    @ToString
    public static class ExecutionSummary {
        private final List<ExecutionStep> executionTimeline;
        private final Map<String, Object> finalOutputs;
        private final Instant startTime;
        private final Instant endTime;
        
        public ExecutionSummary(List<ExecutionStep> executionTimeline, Map<String, Object> finalOutputs, Instant startTime, Instant endTime) {
            this.executionTimeline = List.copyOf(executionTimeline);
            this.finalOutputs = Map.copyOf(finalOutputs);
            this.startTime = startTime;
            this.endTime = endTime;
        }
        
        public static ExecutionSummary empty() {
            var now = Instant.now();
            return new ExecutionSummary(List.of(), Map.of(), now, now);
        }
        
        public static ExecutionSummary fromExecutionContext(ExecutionContext context) {
            var timeline = new ArrayList<ExecutionStep>();
            
            // 从执行历史构建时间线
            context.getExecutionHistory().values().stream()
                .sorted(Comparator.comparing(ExecutionContext.NodeExecutionRecord::timestamp))
                .forEach(record -> {
                    timeline.add(new ExecutionStep(
                        record.nodeName(),
                        record.nodeExecutionId(),
                        record.timestamp(),
                        Map.of(record.portName(), record.newValue())
                    ));
                });
            
            return new ExecutionSummary(
                timeline,
                context.getDataBusSnapshot(),
                context.getStartTime(),
                Instant.now()
            );
        }
        
        public boolean isEmpty() {
            return executionTimeline.isEmpty();
        }
        
        public Duration getTotalDuration() {
            return Duration.between(startTime, endTime);
        }
        
        public long getExecutedNodesCount() {
            return executionTimeline.stream()
                .map(ExecutionStep::getNodeName)
                .distinct()
                .count();
        }
    }
    
    /**
     * 执行步骤 - 记录单个节点的执行
     */
    @Getter
    @ToString
    public static class ExecutionStep {
        private final String nodeName;
        private final String executionId;
        private final Instant timestamp;
        private final Map<String, Object> outputs;
        
        public ExecutionStep(String nodeName, String executionId, Instant timestamp, Map<String, Object> outputs) {
            this.nodeName = nodeName;
            this.executionId = executionId;
            this.timestamp = timestamp;
            this.outputs = Map.copyOf(outputs);
        }
        
        public String getFormattedStep() {
            return String.format("[%s] %s -> %s", 
                timestamp.toString().substring(11, 23), // HH:mm:ss.SSS
                nodeName,
                outputs.keySet()
            );
        }
    }
} 