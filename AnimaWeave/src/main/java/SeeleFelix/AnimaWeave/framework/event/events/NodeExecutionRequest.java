package SeeleFelix.AnimaWeave.framework.event.events;

import lombok.Getter;
import lombok.ToString;
import lombok.experimental.Accessors;
import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;

import java.util.Map;

/**
 * 节点执行请求事件
 * 框架发送给vessel插件，请求执行特定节点
 * 使用lombok实现零样板代码的现代化事件类
 */
@Getter
@ToString(callSuper = true, of = {"nodeId", "nodeType", "vesselName", "executionContextId"})
@Accessors(fluent = true)
public class NodeExecutionRequest extends AnimaWeaveEvent {
    
    private final String nodeId;
    private final String nodeType;
    private final String vesselName;
    private final Map<String, Object> inputs;
    private final Map<String, String> inputLabels;  // 输入端口的语义标签
    private final String executionContextId;
    
    public NodeExecutionRequest(Object source, String sourceIdentifier, String nodeId, String nodeType, 
                               String vesselName, Map<String, Object> inputs,
                               Map<String, String> inputLabels, String executionContextId) {
        super(source, sourceIdentifier);
        this.nodeId = nodeId;
        this.nodeType = nodeType;
        this.vesselName = vesselName;
        this.inputs = Map.copyOf(inputs);
        this.inputLabels = Map.copyOf(inputLabels);
        this.executionContextId = executionContextId;
    }
} 