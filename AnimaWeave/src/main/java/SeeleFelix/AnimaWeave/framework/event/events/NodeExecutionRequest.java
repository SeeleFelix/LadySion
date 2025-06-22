package SeeleFelix.AnimaWeave.framework.event.events;

import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.HashMap;
import java.util.Map;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/**
 * 节点执行请求事件 - 简化版本
 *
 * <p>GraphCoordinator发送此事件来请求执行特定节点 NodeInstance通过@EventListener(condition)自动匹配
 */
@Getter
@ToString(
    callSuper = true,
    of = {"nodeId", "nodeType"})
@EqualsAndHashCode(
    callSuper = false,
    of = {"nodeId", "nodeType", "executionContextId"})
public final class NodeExecutionRequest extends AnimaWeaveEvent {

  private final String nodeId; // 目标节点ID
  private final String nodeType; // 节点类型 (如 basic.Start)
  private final Map<String, Object> inputs; // 节点输入数据
  private final String executionContextId; // 图执行上下文ID
  private String nodeExecutionId; // 节点执行ID（由GraphCoordinator设置）

  public NodeExecutionRequest(
      Object source,
      String sourceIdentifier,
      String nodeId,
      String nodeType,
      Map<String, Object> inputs,
      String executionContextId) {
    super(source, sourceIdentifier);
    this.nodeId = nodeId;
    this.nodeType = nodeType;
    this.inputs = inputs != null ? Map.copyOf(inputs) : Map.of();
    this.executionContextId = executionContextId;
  }

  /** 便捷的静态工厂方法 */
  public static NodeExecutionRequest of(
      Object source,
      String sourceIdentifier,
      String nodeId,
      String nodeType,
      Map<String, Object> inputs,
      String executionContextId) {
    return new NodeExecutionRequest(
        source, sourceIdentifier, nodeId, nodeType, inputs, executionContextId);
  }

  /** 新的工厂方法 - 支持SemanticLabel输入 */
  public static NodeExecutionRequest withSemanticLabels(
      Object source,
      String sourceIdentifier,
      String nodeId,
      String nodeType,
      Map<String, SemanticLabel<?>> semanticInputs,
      String executionContextId) {
    // 将SemanticLabel转换为Object以保持兼容性
    Map<String, Object> inputs = new HashMap<>();
    semanticInputs.forEach((key, value) -> inputs.put(key, value));

    return new NodeExecutionRequest(
        source, sourceIdentifier, nodeId, nodeType, inputs, executionContextId);
  }

  /** 检查是否有输入数据 */
  public boolean hasInputs() {
    return !inputs.isEmpty();
  }

  /** 获取输入数量 */
  public int getInputsSize() {
    return inputs.size();
  }

  /** 设置节点执行ID（由GraphCoordinator调用） */
  public void setNodeExecutionId(String nodeExecutionId) {
    this.nodeExecutionId = nodeExecutionId;
  }

  /** 获取执行摘要 */
  public String getExecutionSummary() {
    return "Request execution of node '%s' (type: %s) with %d inputs: %s"
        .formatted(nodeId, nodeType, inputs.size(), inputs.keySet());
  }
}
