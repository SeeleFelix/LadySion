package SeeleFelix.AnimaWeave.framework.event.events;

import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;

import java.util.Map;

/**
 * 数据流事件
 * 在节点之间传递数据时发送的事件
 */
public class DataFlowEvent extends AnimaWeaveEvent {
    
    private final String fromNodeId;
    private final String toNodeId;
    private final String portName;
    private final Object data;
    private final String semanticLabel;  // 数据的语义标签
    private final String executionContextId;
    
    public DataFlowEvent(Object source, String sourceIdentifier, String fromNodeId, String toNodeId,
                        String portName, Object data, String semanticLabel, String executionContextId) {
        super(source, sourceIdentifier);
        this.fromNodeId = fromNodeId;
        this.toNodeId = toNodeId;
        this.portName = portName;
        this.data = data;
        this.semanticLabel = semanticLabel;
        this.executionContextId = executionContextId;
    }
    
    public String getFromNodeId() {
        return fromNodeId;
    }
    
    public String getToNodeId() {
        return toNodeId;
    }
    
    public String getPortName() {
        return portName;
    }
    
    public Object getData() {
        return data;
    }
    
    public String getSemanticLabel() {
        return semanticLabel;
    }
    
    public String getExecutionContextId() {
        return executionContextId;
    }
    
    @Override
    public String toString() {
        return String.format("DataFlowEvent{from='%s', to='%s', port='%s', label='%s', contextId='%s'}", 
                           fromNodeId, toNodeId, portName, semanticLabel, executionContextId);
    }
} 