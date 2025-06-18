package SeeleFelix.AnimaWeave.framework.graph;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.util.Map;

/**
 * 节点定义
 * 定义节点的类型、端口等信息
 */
@Getter
@ToString
@EqualsAndHashCode
@Builder
public class NodeDefinition {
    /**
     * 节点名称/类型
     */
    private final String name;
    
    /**
     * 执行模式：Concurrent 或 Sequential
     */
    private final String mode;
    
    /**
     * 输入端口：端口名 -> 端口类型
     */
    private final Map<String, String> inputPorts;
    
    /**
     * 输出端口：端口名 -> 端口类型
     */
    private final Map<String, String> outputPorts;
} 