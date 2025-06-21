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
    List<PortTemplate> inputPorts, // 输入端口模板
    List<PortTemplate> outputPorts // 输出端口模板
    ) {



  /** 获取指定名称的输入端口模板 */
  public PortTemplate getInputPort(String portName) {
    return inputPorts.stream()
        .filter(port -> port.name().equals(portName))
        .findFirst()
        .orElse(null);
  }

  /** 获取指定名称的输出端口模板 */
  public PortTemplate getOutputPort(String portName) {
    return outputPorts.stream()
        .filter(port -> port.name().equals(portName))
        .findFirst()
        .orElse(null);
  }

  /** 验证输入端口是否符合端口模板定义 */
  public boolean validateInputs(Map<String, Port> inputs) {
    return inputPorts.stream()
        .allMatch(
            port -> {
              Port input = inputs.get(port.name());
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
    return inputPorts.stream().anyMatch(PortTemplate::required);
  }

  /** 获取所有必需输入端口的名称 */
  public List<String> getRequiredInputPortNames() {
    return inputPorts.stream().filter(PortTemplate::required).map(PortTemplate::name).toList();
  }
}
