package SeeleFelix.AnimaWeave.framework.graph;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import lombok.EqualsAndHashCode;

/**
 * 节点间连接
 * 表示数据连接或控制连接
 */
@Getter
@ToString
@EqualsAndHashCode
@Builder
public class Connection {
    /**
     * 源节点名称
     */
    private final String sourceNodeName;
    
    /**
     * 源端口名称
     */
    private final String sourcePortName;
    
    /**
     * 目标节点名称
     */
    private final String targetNodeName;
    
    /**
     * 目标端口名称
     */
    private final String targetPortName;
} 