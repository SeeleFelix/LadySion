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
    List<Port> inputPorts, // 输入端口
    List<Port> outputPorts // 输出端口
    ) {



  /** 获取指定名称的输入端口 */
  public Port getInputPort(String portName) {
    return inputPorts.stream()
        .filter(port -> port.name().equals(portName))
        .findFirst()
        .orElse(null);
  }

  /** 获取指定名称的输出端口 */
  public Port getOutputPort(String portName) {
    return outputPorts.stream()
        .filter(port -> port.name().equals(portName))
        .findFirst()
        .orElse(null);
  }

  /** 验证输入端口值是否符合端口定义 */
  public boolean validateInputs(Map<String, PortValue> inputs) {
    return inputPorts.stream()
        .allMatch(
            port -> {
              PortValue input = inputs.get(port.name());
              if (port.required() && (input == null || !input.hasValue())) {
                return false;
              }
              if (input == null) {
                return true; // 可选端口可以为null
              }
              return port.semanticLabel().isCompatibleWith(input.semanticLabel());
            });
  }

  /** 检查节点是否有必需的输入端口 */
  public boolean hasRequiredInputs() {
    return inputPorts.stream().anyMatch(Port::required);
  }

  /** 获取所有必需输入端口的名称 */
  public List<String> getRequiredInputPortNames() {
    return inputPorts.stream().filter(Port::required).map(Port::name).toList();
  }
}
