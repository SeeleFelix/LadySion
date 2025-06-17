package SeeleFelix.AnimaWeave.framework.graph;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 图执行上下文
 * 管理图执行过程中的状态和数据流
 */
public class ExecutionContext {
    
    private final String executionId;
    private final GraphDefinition graphDefinition;
    private final ConcurrentMap<String, Object> dataFlow = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Object> outputs = new ConcurrentHashMap<>();
    
    public ExecutionContext(String executionId, GraphDefinition graphDefinition) {
        this.executionId = executionId;
        this.graphDefinition = graphDefinition;
    }
    
    public String getExecutionId() {
        return executionId;
    }
    
    public GraphDefinition getGraphDefinition() {
        return graphDefinition;
    }
    
    public void updateDataFlow(String connectionId, Object value) {
        dataFlow.put(connectionId, value);
    }
    
    public Object getDataFlow(String connectionId) {
        return dataFlow.get(connectionId);
    }
    
    public void setOutput(String key, Object value) {
        outputs.put(key, value);
    }
    
    public Map<String, Object> getOutputs() {
        return Map.copyOf(outputs);
    }
} 