package SeeleFelix.AnimaWeave.framework.graph;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

/**
 * 图执行上下文 - 增强版本，支持详细的执行追踪
 *
 * <p>核心设计： 1. 数据总线：存储所有节点输出 nodeName.portName -> value 2. 执行追踪：记录每次节点执行的详细信息（时间、顺序、状态） 3. 执行顺序：全局序号
 * + 节点级编号 4. 性能监控：执行时间统计和分析
 */
@Slf4j
@Getter
public class ExecutionContext {

  private final String executionId;
  private final GraphDefinition graphDefinition;
  private final Instant startTime;

  // 数据总线：存储所有节点的端口输出 nodeName.portName -> value
  private final ConcurrentMap<String, Object> dataBus = new ConcurrentHashMap<>();

  // 执行历史：按执行顺序记录所有节点执行的详细信息
  private final List<NodeExecutionRecord> executionHistory =
      Collections.synchronizedList(new ArrayList<>());

  // 执行ID生成器：为每次节点执行生成唯一ID
  private final AtomicLong executionIdGenerator = new AtomicLong(1);

  // 全局执行序号生成器：记录整个图中节点的执行顺序
  private final AtomicLong globalSequenceGenerator = new AtomicLong(1);

  // 节点执行计数：记录每个节点被执行的次数（同名节点编号）
  private final ConcurrentMap<String, Integer> nodeExecutionCounts = new ConcurrentHashMap<>();

  // 已执行节点追踪：记录哪些节点已经完成执行
  private final Set<String> executedNodes = ConcurrentHashMap.newKeySet();

  // 正在执行的节点追踪：记录当前正在执行的节点
  private final ConcurrentMap<String, NodeExecutionRecord> runningNodes = new ConcurrentHashMap<>();

  public ExecutionContext(String executionId, GraphDefinition graphDefinition) {
    this.executionId = executionId;
    this.graphDefinition = graphDefinition;
    this.startTime = Instant.now();

    log.debug(
        "Created execution context: {} for graph: {}", executionId, graphDefinition.getName());
  }

  /** 生成新的节点执行ID */
  public String generateNodeExecutionId(String nodeName) {
    var count = nodeExecutionCounts.merge(nodeName, 1, Integer::sum);
    var execId =
        "exec_%s_%s_%d".formatted(executionId, nodeName, executionIdGenerator.getAndIncrement());

    log.trace("Generated execution ID: {} for node: {} (execution #{})", execId, nodeName, count);
    return execId;
  }

  /** 设置节点端口的输出值 - 实现不可变覆盖 */
  public void setNodeOutput(
      String nodeName, String portName, Object value, String nodeExecutionId) {
    var portKey = createPortKey(nodeName, portName);
    var previousValue = dataBus.put(portKey, value);

    log.trace(
        "Node output updated: {} = {} (execution: {})",
        portKey,
        getValuePreview(value),
        nodeExecutionId);

    if (previousValue != null) {
      log.trace(
          "Previous value overwritten: {} -> {}",
          getValuePreview(previousValue),
          getValuePreview(value));
    }
  }

  /** 获取节点端口的当前值 */
  public Object getNodeOutput(String nodeName, String portName) {
    var portKey = createPortKey(nodeName, portName);
    return dataBus.get(portKey);
  }

  /** 检查节点端口是否有值 */
  public boolean hasNodeOutput(String nodeName, String portName) {
    var portKey = createPortKey(nodeName, portName);
    return dataBus.containsKey(portKey);
  }

  /** 检查节点是否已经执行过 */
  public boolean hasNodeBeenExecuted(String nodeName) {
    return executedNodes.contains(nodeName);
  }

  /** 标记节点为已执行 */
  public void markNodeExecuted(String nodeName) {
    executedNodes.add(nodeName);
    log.trace("Marked node as executed: {}", nodeName);
  }

  /** 获取已执行节点的列表 */
  public Set<String> getExecutedNodes() {
    return Set.copyOf(executedNodes);
  }

  /** 开始节点执行 - 记录开始时间和执行信息 */
  public NodeExecutionRecord startNodeExecution(
      String nodeName, String nodeType, Map<String, Object> inputs) {
    var nodeCount = nodeExecutionCounts.merge(nodeName, 1, Integer::sum);
    var globalSequence = globalSequenceGenerator.getAndIncrement();
    var executionId = generateNodeExecutionId(nodeName);

    var record =
        new NodeExecutionRecord(
            executionId,
            globalSequence,
            nodeCount,
            nodeName,
            nodeType,
            inputs,
            Instant.now(),
            null, // endTime will be set when completed
            null, // duration will be calculated when completed
            NodeExecutionStatus.RUNNING,
            null, // outputs will be set when completed
            null // errorMessage will be set if failed
            );

    runningNodes.put(executionId, record);
    executionHistory.add(record);

    log.debug(
        "🚀 节点开始执行: {} (#{}, 第{}次) - 执行ID: {}", nodeName, globalSequence, nodeCount, executionId);

    return record;
  }

  /** 完成节点执行 - 记录结束时间和输出结果 */
  public NodeExecutionRecord completeNodeExecution(
      String executionId, Map<String, Object> outputs) {
    var runningRecord = runningNodes.remove(executionId);
    if (runningRecord == null) {
      log.warn("尝试完成不存在的执行: {}", executionId);
      return null;
    }

    var endTime = Instant.now();
    var duration = Duration.between(runningRecord.startTime(), endTime);

    var completedRecord =
        runningRecord.withCompletion(endTime, duration, NodeExecutionStatus.SUCCESS, outputs, null);

    // 更新执行历史中的记录
    updateExecutionHistory(completedRecord);

    // 标记节点为已执行
    markNodeExecuted(runningRecord.nodeName());

    log.debug(
        "✅ 节点执行完成: {} (#{}, 耗时{}ms) - 执行ID: {}",
        runningRecord.nodeName(),
        runningRecord.globalSequence(),
        duration.toMillis(),
        executionId);

    return completedRecord;
  }

  /** 节点执行失败 - 记录错误信息 */
  public NodeExecutionRecord failNodeExecution(String executionId, String errorMessage) {
    var runningRecord = runningNodes.remove(executionId);
    if (runningRecord == null) {
      log.warn("尝试标记失败的不存在执行: {}", executionId);
      return null;
    }

    var endTime = Instant.now();
    var duration = Duration.between(runningRecord.startTime(), endTime);

    var failedRecord =
        runningRecord.withCompletion(
            endTime, duration, NodeExecutionStatus.FAILED, null, errorMessage);

    // 更新执行历史中的记录
    updateExecutionHistory(failedRecord);

    log.error(
        "❌ 节点执行失败: {} (#{}, 耗时{}ms) - 错误: {}",
        runningRecord.nodeName(),
        runningRecord.globalSequence(),
        duration.toMillis(),
        errorMessage);

    return failedRecord;
  }

  /** 更新执行历史中的记录 */
  private void updateExecutionHistory(NodeExecutionRecord completedRecord) {
    synchronized (executionHistory) {
      for (int i = 0; i < executionHistory.size(); i++) {
        if (executionHistory.get(i).nodeExecutionId().equals(completedRecord.nodeExecutionId())) {
          executionHistory.set(i, completedRecord);
          break;
        }
      }
    }
  }

  /** 获取数据总线的当前状态快照 */
  public Map<String, Object> getDataBusSnapshot() {
    return Map.copyOf(dataBus);
  }

  /** 创建端口键：nodeName.portName */
  private String createPortKey(String nodeName, String portName) {
    return "%s.%s".formatted(nodeName, portName);
  }

  /** 获取值的简化预览（用于日志） */
  private String getValuePreview(Object value) {
    return switch (value) {
      case null -> "null";
      case String s when s.length() > 20 -> "\"" + s.substring(0, 17) + "...\"";
      case String s -> "\"" + s + "\"";
      default -> value.toString();
    };
  }

  /** 获取执行历史摘要 */
  public ExecutionSummary getExecutionSummary() {
    var now = Instant.now();
    var totalDuration = Duration.between(startTime, now);

    var successCount =
        (int)
            executionHistory.stream()
                .filter(record -> record.status == NodeExecutionStatus.SUCCESS)
                .count();

    var failedCount =
        (int)
            executionHistory.stream()
                .filter(record -> record.status == NodeExecutionStatus.FAILED)
                .count();

    var runningCount = runningNodes.size();

    return new ExecutionSummary(
        executionId,
        graphDefinition.getName(),
        startTime,
        now,
        totalDuration,
        executionHistory.size(),
        successCount,
        failedCount,
        runningCount,
        Collections.unmodifiableList(new ArrayList<>(executionHistory)));
  }

  /** 节点执行状态枚举 */
  public enum NodeExecutionStatus {
    RUNNING, // 正在执行
    SUCCESS, // 执行成功
    FAILED // 执行失败
  }

  /** 执行摘要记录 */
  public record ExecutionSummary(
      String executionId,
      String graphName,
      Instant startTime,
      Instant currentTime,
      Duration totalDuration,
      int totalNodes,
      int successNodes,
      int failedNodes,
      int runningNodes,
      List<NodeExecutionRecord> executionHistory) {
    public boolean isCompleted() {
      return runningNodes == 0;
    }

    public double getSuccessRate() {
      if (totalNodes == 0) return 0.0;
      return (double) successNodes / totalNodes;
    }

    public String getStatusSummary() {
      return String.format(
          "总计: %d, 成功: %d, 失败: %d, 运行中: %d", totalNodes, successNodes, failedNodes, runningNodes);
    }
  }

  /** 节点执行记录 - 增强版本，记录完整的执行信息 */
  public static class NodeExecutionRecord {
    private final String nodeExecutionId; // 执行ID
    private final long globalSequence; // 全局执行序号
    private final int nodeSequence; // 节点内执行序号（第几次执行此节点）
    private final String nodeName; // 节点名称
    private final String nodeType; // 节点类型
    private final Map<String, Object> inputs; // 输入数据
    private final Instant startTime; // 开始时间
    private final Instant endTime; // 结束时间（可能为null）
    private final Duration duration; // 执行耗时（可能为null）
    private final NodeExecutionStatus status; // 执行状态
    private final Map<String, Object> outputs; // 输出数据（可能为null）
    private final String errorMessage; // 错误信息（可能为null）

    public NodeExecutionRecord(
        String nodeExecutionId,
        long globalSequence,
        int nodeSequence,
        String nodeName,
        String nodeType,
        Map<String, Object> inputs,
        Instant startTime,
        Instant endTime,
        Duration duration,
        NodeExecutionStatus status,
        Map<String, Object> outputs,
        String errorMessage) {
      this.nodeExecutionId = nodeExecutionId;
      this.globalSequence = globalSequence;
      this.nodeSequence = nodeSequence;
      this.nodeName = nodeName;
      this.nodeType = nodeType;
      this.inputs = inputs != null ? Map.copyOf(inputs) : Map.of();
      this.startTime = startTime;
      this.endTime = endTime;
      this.duration = duration;
      this.status = status;
      this.outputs = outputs != null ? Map.copyOf(outputs) : null;
      this.errorMessage = errorMessage;
    }

    public NodeExecutionRecord withCompletion(
        Instant endTime,
        Duration duration,
        NodeExecutionStatus status,
        Map<String, Object> outputs,
        String errorMessage) {
      return new NodeExecutionRecord(
          this.nodeExecutionId,
          this.globalSequence,
          this.nodeSequence,
          this.nodeName,
          this.nodeType,
          this.inputs,
          this.startTime,
          endTime,
          duration,
          status,
          outputs,
          errorMessage);
    }

    // Getters
    public String nodeExecutionId() {
      return nodeExecutionId;
    }

    public long globalSequence() {
      return globalSequence;
    }

    public int nodeSequence() {
      return nodeSequence;
    }

    public String nodeName() {
      return nodeName;
    }

    public String nodeType() {
      return nodeType;
    }

    public Map<String, Object> inputs() {
      return inputs;
    }

    public Instant startTime() {
      return startTime;
    }

    public Instant endTime() {
      return endTime;
    }

    public Duration duration() {
      return duration;
    }

    public NodeExecutionStatus status() {
      return status;
    }

    public Map<String, Object> outputs() {
      return outputs;
    }

    public String errorMessage() {
      return errorMessage;
    }

    public boolean isCompleted() {
      return status == NodeExecutionStatus.SUCCESS || status == NodeExecutionStatus.FAILED;
    }

    public boolean isSuccess() {
      return status == NodeExecutionStatus.SUCCESS;
    }

    public boolean isRunning() {
      return status == NodeExecutionStatus.RUNNING;
    }

    public String getFormattedDuration() {
      if (duration == null) return "运行中...";
      return String.format("%dms", duration.toMillis());
    }

    public String getDisplayName() {
      return String.format("%s (第%d次)", nodeName, nodeSequence);
    }

    @Override
    public String toString() {
      return String.format(
          "NodeExecution[#%d %s %s %s]",
          globalSequence, getDisplayName(), status, getFormattedDuration());
    }
  }
}
