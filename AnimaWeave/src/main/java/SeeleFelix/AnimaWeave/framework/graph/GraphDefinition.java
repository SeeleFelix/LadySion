package SeeleFelix.AnimaWeave.framework.graph;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import lombok.EqualsAndHashCode;

/**
 * 图定义
 * 包含完整的图结构信息
 */
@Getter
@ToString
@EqualsAndHashCode
@Builder
public class GraphDefinition {
    /**
     * 图名称
     */
    private final String name;
    
    /**
     * 导入的依赖
     */
    @Builder.Default
    private final List<String> imports = List.of();
    
    /**
     * 节点定义：节点类型 -> 节点定义
     */
    @Builder.Default
    private final Map<String, NodeDefinition> nodeDefinitions = Map.of();
    
    /**
     * 节点实例：实例名 -> 节点类型
     */
    @Builder.Default
    private final Map<String, String> nodeInstances = Map.of();
    
    /**
     * 数据连接
     */
    @Builder.Default
    private final List<Connection> dataConnections = List.of();
    
    /**
     * 控制连接
     */
    @Builder.Default
    private final List<Connection> controlConnections = List.of();
}

/**
 * 图节点定义
 */
record GraphNode(
    String nodeId,
    String nodeType,
    Map<String, Object> properties
) {
    
    public static GraphNode of(String nodeId, String nodeType) {
        return new GraphNode(nodeId, nodeType, Map.of());
    }
}

/**
 * 图连接定义
 */
record GraphConnection(
    String fromNodeId,
    String fromPort,
    String toNodeId,
    String toPort
) {
    
    public String getConnectionId() {
        return String.format("%s:%s->%s:%s", fromNodeId, fromPort, toNodeId, toPort);
    }
} 