package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;
import java.util.Map;

/**
 * 节点定义
 * 定义节点的输入输出端口和执行器
 */
public record NodeDefinition(
    String nodeType,
    String displayName,
    String description,
    List<PortDefinition> inputPorts,
    List<PortDefinition> outputPorts,
    NodeExecutor executor
) {
    
    /**
     * 创建简单节点定义
     */
    public static NodeDefinition of(String nodeType, String displayName,
                                  List<PortDefinition> inputPorts,
                                  List<PortDefinition> outputPorts,
                                  NodeExecutor executor) {
        return new NodeDefinition(nodeType, displayName, "", inputPorts, outputPorts, executor);
    }
    
    /**
     * 获取指定名称的输入端口
     */
    public PortDefinition getInputPort(String portName) {
        return inputPorts.stream()
                .filter(port -> port.name().equals(portName))
                .findFirst()
                .orElse(null);
    }
    
    /**
     * 获取指定名称的输出端口
     */
    public PortDefinition getOutputPort(String portName) {
        return outputPorts.stream()
                .filter(port -> port.name().equals(portName))
                .findFirst()
                .orElse(null);
    }
    
    /**
     * 验证输入数据是否符合端口定义
     */
    public boolean validateInputs(Map<String, Object> inputs) {
        return inputPorts.stream().allMatch(port -> {
            Object value = inputs.get(port.name());
            if (port.required() && value == null) {
                return false;
            }
            return port.semanticLabel().isTypeCompatible(value);
        });
    }
}



 