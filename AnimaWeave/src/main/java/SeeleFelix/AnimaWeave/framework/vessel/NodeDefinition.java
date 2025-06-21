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

  /** 创建简单节点定义 */
  public static NodeDefinition of(
      String nodeType,
      String displayName,
      List<PortDefinition> inputPorts,
      List<PortDefinition> outputPorts) {
    return new NodeDefinition(nodeType, displayName, "", inputPorts, outputPorts);
  }

  /** 创建带描述的节点定义 */
  public static NodeDefinition withDescription(
      String nodeType,
      String displayName,
      String description,
      List<PortDefinition> inputPorts,
      List<PortDefinition> outputPorts) {
    return new NodeDefinition(nodeType, displayName, description, inputPorts, outputPorts);
  }

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

  /** 验证输入数据是否符合端口定义 */
  public boolean validateInputs(Map<String, Object> inputs) {
    return inputPorts.stream()
        .allMatch(
            port -> {
              Object value = inputs.get(port.name());
              if (port.required() && value == null) {
                return false;
              }
              return port.semanticLabel().isTypeCompatible(value);
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
