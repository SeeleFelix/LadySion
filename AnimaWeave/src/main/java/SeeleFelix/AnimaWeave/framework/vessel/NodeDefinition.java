package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;
import java.util.Map;

/**
 * 节点定义 定义节点的输入输出端口规格（不包含执行逻辑）
 *
 * <p>在新架构中： - NodeDefinition 只定义节点的"接口规格"（输入输出端口） - NodeInstance 负责实际的执行逻辑
 */
public record NodeDefinition(
    String nodeType, // 节点类型（如 "Add", "Multiply"）
    String displayName, // 显示名称
    String description, // 描述
    List<PortDefinition> inputPorts, // 输入端口定义
    List<PortDefinition> outputPorts // 输出端口定义
    ) {



  /** 获取指定名称的输入端口 */
  public PortDefinition getInputPort(String portName) {
    return inputPorts.stream()
        .filter(port -> port.name().equals(portName))
        .findFirst()
        .orElse(null);
  }

  /** 获取指定名称的输出端口 */
  public PortDefinition getOutputPort(String portName) {
    return outputPorts.stream()
        .filter(port -> port.name().equals(portName))
        .findFirst()
        .orElse(null);
  }

  /** 验证输入语义标签是否符合端口定义 */
  public boolean validateInputs(Map<String, SemanticLabel> inputs) {
    return inputPorts.stream()
        .allMatch(
            port -> {
              SemanticLabel input = inputs.get(port.name());
              if (port.required() && input == null) {
                return false;
              }
              if (input == null) {
                return true; // 可选端口可以为null
              }
              return port.semanticLabel().isCompatibleWith(input.labelName());
            });
  }

  /** 检查节点是否有必需的输入端口 */
  public boolean hasRequiredInputs() {
    return inputPorts.stream().anyMatch(PortDefinition::required);
  }

  /** 获取所有必需输入端口的名称 */
  public List<String> getRequiredInputPortNames() {
    return inputPorts.stream().filter(PortDefinition::required).map(PortDefinition::name).toList();
  }
}
