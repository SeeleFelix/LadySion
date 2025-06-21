package SeeleFelix.AnimaWeave.framework.awakening;

import SeeleFelix.AnimaWeave.framework.graph.ExecutionContext;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import lombok.Getter;
import lombok.ToString;

/** 觉醒结果 - 完整的图执行跟踪信息 记录图执行过程中的所有详细信息，用于调试和分析 */
@Getter
@ToString
public final class AwakeningResult {

  private final String graphName;
  private final String executionId;
  private final boolean success;
  private final String message;
  private final Instant timestamp;

  // 完整的执行跟踪信息
  private final ExecutionTrace executionTrace;

  private AwakeningResult(
      String graphName,
      String executionId,
      boolean success,
      String message,
      ExecutionTrace executionTrace) {
    this.graphName = graphName;
    this.executionId = executionId;
    this.success = success;
    this.message = message;
    this.executionTrace = executionTrace;
    this.timestamp = Instant.now();
  }

  /** 创建成功结果 */
  public static AwakeningResult success(
      String graphName, String executionId, ExecutionTrace executionTrace) {
    return new AwakeningResult(
        graphName, executionId, true, "Graph execution completed successfully", executionTrace);
  }

  /** 创建失败结果 */
  public static AwakeningResult failure(
      String graphName, String executionId, String errorMessage, ExecutionTrace executionTrace) {
    return new AwakeningResult(graphName, executionId, false, errorMessage, executionTrace);
  }

  /** 创建简单的成功结果（用于向后兼容） */
  public static AwakeningResult success(String graphName, String message) {
    return new AwakeningResult(graphName, null, true, message, ExecutionTrace.empty());
  }

  /** 创建简单的失败结果（用于向后兼容） */
  public static AwakeningResult failure(String graphName, String errorMessage) {
    return new AwakeningResult(graphName, null, false, errorMessage, ExecutionTrace.empty());
  }

  /** 检查是否失败 */
  public boolean isFailure() {
    return !success;
  }

  /** 获取基本摘要 */
  public String getSummary() {
    return "Graph '%s' awakening %s: %s"
        .formatted(graphName, success ? "SUCCEEDED" : "FAILED", message);
  }

  /** 执行跟踪信息 - 完整记录图执行过程 */
  @Getter
  @ToString
  public static class ExecutionTrace {
    private final Instant startTime;
    private final Instant endTime;
    private final List<NodeExecution> nodeExecutions;
    private final Map<String, Object> finalDataBus;
    private final List<String> debugLogs;
    private final Map<String, String> executionMetadata;

    public ExecutionTrace(
        Instant startTime,
        Instant endTime,
        List<NodeExecution> nodeExecutions,
        Map<String, Object> finalDataBus,
        List<String> debugLogs,
        Map<String, String> executionMetadata) {
      this.startTime = startTime;
      this.endTime = endTime;
      this.nodeExecutions = List.copyOf(nodeExecutions);
      this.finalDataBus = Map.copyOf(finalDataBus);
      this.debugLogs = List.copyOf(debugLogs);
      this.executionMetadata = Map.copyOf(executionMetadata);
    }

    public static ExecutionTrace empty() {
      var now = Instant.now();
      return new ExecutionTrace(now, now, List.of(), Map.of(), List.of(), Map.of());
    }

    public static ExecutionTrace fromExecutionContext(ExecutionContext context) {
      var nodeExecutions = new ArrayList<NodeExecution>();
      var debugLogs = new ArrayList<String>();

      // 构建节点执行记录
      context.getExecutionSummary().executionHistory().stream()
          .sorted(Comparator.comparing(ExecutionContext.NodeExecutionRecord::startTime))
          .forEach(
              record -> {
                var nodeExecution =
                    new NodeExecution(
                        record.nodeName(), // 使用nodeName作为nodeId
                        record.nodeName(),
                        record.nodeType(),
                        record.startTime(),
                        record.endTime(),
                        record.isSuccess() ? ExecutionStatus.SUCCESS : ExecutionStatus.FAILED,
                        record.outputs() != null ? record.outputs() : Map.of(),
                        record.errorMessage());
                nodeExecutions.add(nodeExecution);

                // 添加调试日志
                long durationMs = record.duration() != null ? record.duration().toMillis() : 0;
                debugLogs.add(
                    String.format(
                        "[%s] Node %s (%s) %s in %dms",
                        record.startTime().toString().substring(11, 23),
                        record.nodeName(),
                        record.nodeType(),
                        record.isSuccess() ? "succeeded" : "failed",
                        durationMs));
              });

      // 构建元数据
      var metadata = new HashMap<String, String>();
      metadata.put("totalNodes", String.valueOf(nodeExecutions.size()));
      metadata.put(
          "successfulNodes",
          String.valueOf(
              nodeExecutions.stream()
                  .mapToLong(ne -> ne.status == ExecutionStatus.SUCCESS ? 1 : 0)
                  .sum()));
      metadata.put(
          "failedNodes",
          String.valueOf(
              nodeExecutions.stream()
                  .mapToLong(ne -> ne.status == ExecutionStatus.FAILED ? 1 : 0)
                  .sum()));

      return new ExecutionTrace(
          context.getStartTime(),
          context.getExecutionSummary().currentTime(),
          nodeExecutions,
          context.getDataBusSnapshot(),
          debugLogs,
          metadata);
    }

    public boolean isEmpty() {
      return nodeExecutions.isEmpty();
    }

    public Duration getTotalDuration() {
      return Duration.between(startTime, endTime);
    }

    public long getExecutedNodesCount() {
      return nodeExecutions.size();
    }

    public long getSuccessfulNodesCount() {
      return nodeExecutions.stream()
          .mapToLong(ne -> ne.status == ExecutionStatus.SUCCESS ? 1 : 0)
          .sum();
    }

    public long getFailedNodesCount() {
      return nodeExecutions.stream()
          .mapToLong(ne -> ne.status == ExecutionStatus.FAILED ? 1 : 0)
          .sum();
    }

    public List<NodeExecution> getFailedExecutions() {
      return nodeExecutions.stream().filter(ne -> ne.status == ExecutionStatus.FAILED).toList();
    }

    /** 获取执行时间线（按时间排序的执行记录） */
    public List<NodeExecution> getExecutionTimeline() {
      return nodeExecutions.stream()
          .sorted(Comparator.comparing(NodeExecution::getStartTime))
          .toList();
    }
  }

  /** 节点执行记录 - 单个节点的完整执行信息 */
  @Getter
  @ToString
  public static class NodeExecution {
    private final String nodeId;
    private final String nodeName;
    private final String nodeType;
    private final Instant startTime;
    private final Instant endTime;
    private final ExecutionStatus status;
    private final Map<String, Object> outputs;
    private final String errorMessage;

    public NodeExecution(
        String nodeId,
        String nodeName,
        String nodeType,
        Instant startTime,
        Instant endTime,
        ExecutionStatus status,
        Map<String, Object> outputs,
        String errorMessage) {
      this.nodeId = nodeId;
      this.nodeName = nodeName;
      this.nodeType = nodeType;
      this.startTime = startTime;
      this.endTime = endTime;
      this.status = status;
      this.outputs = Map.copyOf(outputs);
      this.errorMessage = errorMessage;
    }

    public Duration getExecutionDuration() {
      return Duration.between(startTime, endTime);
    }

    public boolean isSuccess() {
      return status == ExecutionStatus.SUCCESS;
    }

    public boolean isFailure() {
      return status == ExecutionStatus.FAILED;
    }

    /** 获取格式化的执行信息 */
    public String getFormattedExecution() {
      var duration = getExecutionDuration().toMillis();
      if (isSuccess()) {
        return String.format(
            "[%s] ✅ %s (%s) completed in %dms → %s",
            startTime.toString().substring(11, 23), nodeId, nodeType, duration, outputs.keySet());
      } else {
        return String.format(
            "[%s] ❌ %s (%s) failed after %dms: %s",
            startTime.toString().substring(11, 23),
            nodeId,
            nodeType,
            duration,
            errorMessage != null ? errorMessage : "Unknown error");
      }
    }
  }

  /** 执行状态枚举 */
  public enum ExecutionStatus {
    SUCCESS,
    FAILED,
    SKIPPED,
    TIMEOUT
  }
}
