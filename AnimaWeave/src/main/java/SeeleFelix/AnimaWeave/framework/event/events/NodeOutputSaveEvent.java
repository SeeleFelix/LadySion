package SeeleFelix.AnimaWeave.framework.event.events;

import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;
import java.util.Map;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/**
 * 节点输出保存事件 - 统一的节点完成事件
 *
 * <p>所有节点执行完成后都发送这个相同的事件类型 GraphCoordinator监听此事件来： 1. 更新数据总线 2. 决定下一个执行的节点
 */
@Getter
@ToString(
    callSuper = true,
    of = {"nodeName", "nodeExecutionId", "outputsSize"})
@EqualsAndHashCode(
    callSuper = false,
    of = {"nodeName", "nodeExecutionId", "graphExecutionId"})
public final class NodeOutputSaveEvent extends AnimaWeaveEvent {

  private final String nodeName; // 节点实例名称（图中唯一）
  private final String nodeExecutionId; // 节点执行ID（每次执行唯一）
  private final Map<String, Object> outputs; // 节点的所有输出端口数据
  private final String graphExecutionId; // 图执行上下文ID

  public NodeOutputSaveEvent(
      Object source,
      String sourceIdentifier,
      String nodeName,
      String nodeExecutionId,
      Map<String, Object> outputs,
      String graphExecutionId) {
    super(source, sourceIdentifier);
    this.nodeName = nodeName;
    this.nodeExecutionId = nodeExecutionId;
    this.outputs = outputs != null ? Map.copyOf(outputs) : Map.of();
    this.graphExecutionId = graphExecutionId;
  }

  /** 便捷的静态工厂方法 */
  public static NodeOutputSaveEvent of(
      Object source,
      String sourceIdentifier,
      String nodeName,
      String nodeExecutionId,
      Map<String, Object> outputs,
      String graphExecutionId) {
    return new NodeOutputSaveEvent(
        source, sourceIdentifier, nodeName, nodeExecutionId, outputs, graphExecutionId);
  }

  /** 检查是否有输出数据 */
  public boolean hasOutputs() {
    return !outputs.isEmpty();
  }

  /** 获取输出端口数量 */
  public int getOutputsSize() {
    return outputs.size();
  }

  /** 检查是否包含特定输出端口 */
  public boolean hasOutput(String portName) {
    return outputs.containsKey(portName);
  }

  /** 获取特定端口的输出值 */
  public Object getOutput(String portName) {
    return outputs.get(portName);
  }

  /** 获取执行摘要信息 */
  public String getExecutionSummary() {
    return "Node '%s' (exec: %s) completed with %d outputs: %s"
        .formatted(nodeName, nodeExecutionId, outputs.size(), outputs.keySet());
  }
}
