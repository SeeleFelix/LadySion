package SeeleFelix.AnimaWeave.framework.graph;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 图定义
 * 包含节点和连接的定义
 */
public record GraphDefinition(
    String graphId,
    String name,
    Map<String, GraphNode> nodes,
    List<GraphConnection> connections
) {
    
    /**
     * 获取节点
     */
    public GraphNode getNode(String nodeId) {
        return nodes.get(nodeId);
    }
    
    /**
     * 获取所有节点ID
     */
    public Set<String> getNodeIds() {
        return nodes.keySet();
    }
    
    /**
     * 获取连接
     */
    public List<GraphConnection> getConnections() {
        return connections;
    }
    
    /**
     * 获取指向特定节点的连接
     */
    public List<GraphConnection> getConnectionsTo(String nodeId) {
        return connections.stream()
                .filter(conn -> conn.toNodeId().equals(nodeId))
                .collect(Collectors.toList());
    }
    
    /**
     * 获取从特定节点出发的连接
     */
    public List<GraphConnection> getConnectionsFrom(String nodeId) {
        return connections.stream()
                .filter(conn -> conn.fromNodeId().equals(nodeId))
                .collect(Collectors.toList());
    }
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