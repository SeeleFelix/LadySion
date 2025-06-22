package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.event.events.NodeOutputSaveEvent;
import SeeleFelix.AnimaWeave.framework.vessel.Port;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;

/**
 * 节点基类 - 使用注解标识端口和元数据
 * 
 * 子类通过@NodeMeta注解定义元数据
 * 子类通过@InputPort和@OutputPort注解标识端口字段
 * 字段类型必须是Port<? extends SemanticLabel<?>>
 * 
 * 新的设计：
 * - Port字段定义端口规格（名称、类型、是否必需等）
 * - 运行时框架将SemanticLabel实例注入到对应的输入字段
 * - 节点执行后，框架从输出字段收集SemanticLabel实例
 */
@Slf4j
@Getter
@RequiredArgsConstructor
public abstract class Node {

    private final String nodeName; // 节点实例名称
    private final String nodeType; // 节点类型（如basic.Start等）
    private final ApplicationEventPublisher eventPublisher;

    // 缓存字段
    private String cachedDisplayName;
    private String cachedDescription;
    private List<Port<?>> cachedInputPorts;
    private List<Port<?>> cachedOutputPorts;
    
    // 运行时数据存储
    private final Map<String, SemanticLabel<?>> currentInputs = new HashMap<>();
    private final Map<String, SemanticLabel<?>> currentOutputs = new HashMap<>();

    /** 获取显示名称 - 通过@NodeMeta注解获取并缓存 */
    public String getDisplayName() {
        if (cachedDisplayName == null) {
            NodeMeta nodeMeta = this.getClass().getAnnotation(NodeMeta.class);
            if (nodeMeta != null) {
                cachedDisplayName = nodeMeta.displayName();
            } else {
                log.warn("Node {} 没有@NodeMeta注解，使用默认显示名称", this.getClass().getSimpleName());
                cachedDisplayName = this.getClass().getSimpleName();
            }
        }
        return cachedDisplayName;
    }

    /** 获取描述 - 通过@NodeMeta注解获取并缓存 */
    public String getDescription() {
        if (cachedDescription == null) {
            NodeMeta nodeMeta = this.getClass().getAnnotation(NodeMeta.class);
            if (nodeMeta != null) {
                cachedDescription = nodeMeta.description();
            } else {
                log.warn("Node {} 没有@NodeMeta注解，使用默认描述", this.getClass().getSimpleName());
                cachedDescription = "No description available";
            }
        }
        return cachedDescription;
    }

    /** 获取输入端口列表 - 通过反射从@InputPort注解获取并缓存 */
    public List<Port<?>> getInputPorts() {
        if (cachedInputPorts == null) {
            cachedInputPorts = new ArrayList<>();
            
            for (Field field : this.getClass().getDeclaredFields()) {
                InputPort annotation = field.getAnnotation(InputPort.class);
                if (annotation != null) {
                    // 从字段的Port中获取端口定义
                    try {
                        field.setAccessible(true);
                        Port<?> port = (Port<?>) field.get(this);
                        if (port != null) {
                            cachedInputPorts.add(port);
                        } else {
                            log.warn("InputPort字段 {} 为null，无法获取Port定义", field.getName());
                        }
                    } catch (Exception e) {
                        log.error("获取InputPort字段 {} 失败", field.getName(), e);
                    }
                }
            }
        }
        
        return cachedInputPorts;
    }

    /** 获取输出端口列表 - 通过反射从@OutputPort注解获取并缓存 */
    public List<Port<?>> getOutputPorts() {
        if (cachedOutputPorts == null) {
            cachedOutputPorts = new ArrayList<>();
            
            for (Field field : this.getClass().getDeclaredFields()) {
                OutputPort annotation = field.getAnnotation(OutputPort.class);
                if (annotation != null) {
                    // 从字段的Port中获取端口定义
                    try {
                        field.setAccessible(true);
                        Port<?> port = (Port<?>) field.get(this);
                        if (port != null) {
                            cachedOutputPorts.add(port);
                        } else {
                            log.warn("OutputPort字段 {} 为null，无法获取Port定义", field.getName());
                        }
                    } catch (Exception e) {
                        log.error("获取OutputPort字段 {} 失败", field.getName(), e);
                    }
                }
            }
        }
        
        return cachedOutputPorts;
    }

    /** 
     * 设置输入Label - 框架调用
     * @param portName 端口名称
     * @param label 输入的Label实例
     */
    public void setInput(String portName, SemanticLabel<?> label) {
        currentInputs.put(portName, label);
    }

    /** 
     * 获取输入Label - 节点内部使用
     * @param portName 端口名称
     * @return 输入的Label实例
     */
    @SuppressWarnings("unchecked")
    protected <T extends SemanticLabel<?>> T getInput(String portName) {
        return (T) currentInputs.get(portName);
    }

    /** 
     * 设置输出Label - 节点内部使用
     * @param portName 端口名称
     * @param label 输出的Label实例
     */
    protected void setOutput(String portName, SemanticLabel<?> label) {
        currentOutputs.put(portName, label);
    }

    /** 
     * 获取输出Label - 框架调用
     * @param portName 端口名称
     * @return 输出的Label实例
     */
    public SemanticLabel<?> getOutput(String portName) {
        return currentOutputs.get(portName);
    }

    /** 
     * 获取所有当前输出 - 框架调用
     * @return 所有输出Label的映射
     */
    public Map<String, SemanticLabel<?>> getAllOutputs() {
        return new HashMap<>(currentOutputs);
    }

    /** 执行节点逻辑的模板方法 */
    public void executeWithTemplate(
            String nodeId,
            Map<String, SemanticLabel<?>> inputs,
            String executionContextId,
            String nodeExecutionId) {
        log.debug("Node type {} 开始执行: nodeId={}, inputCount={}", nodeType, nodeId, inputs.size());

        try {
            // 清理之前的状态
            currentInputs.clear();
            currentOutputs.clear();
            
            // 注入输入数据
            currentInputs.putAll(inputs);
            
            // 执行具体的业务逻辑
            executeNode();
            
            // 收集输出数据
            Map<String, SemanticLabel<?>> outputs = getAllOutputs();

            // 使用传入的执行ID
            var finalExecutionId =
                    nodeExecutionId != null ? nodeExecutionId : generateExecutionId(nodeId);

            // 发送成功事件
            var saveEvent = createSuccessEvent(nodeId, finalExecutionId, outputs, executionContextId);
            eventPublisher.publishEvent(saveEvent);

            log.debug(
                    "Node type {} 执行成功: nodeId={}, executionId={}, outputCount={}",
                    nodeType,
                    nodeId,
                    finalExecutionId,
                    outputs.size());

        } catch (Exception e) {
            log.error("Node type {} 执行失败: nodeId={}", nodeType, nodeId, e);

            // 使用传入的执行ID或生成错误执行ID
            var errorExecutionId =
                    nodeExecutionId != null ? nodeExecutionId : generateErrorExecutionId(nodeId);

            // 发送错误事件
            var errorEvent =
                    createErrorEvent(nodeId, errorExecutionId, e.getMessage(), executionContextId);
            eventPublisher.publishEvent(errorEvent);
        }
    }

    /**
     * 子类实现的具体节点逻辑
     * 输入数据通过getInput()方法获取
     * 输出数据通过setOutput()方法设置
     */
    protected abstract void executeNode();

    private String generateExecutionId(String nodeId) {
        return nodeId + "_" + System.currentTimeMillis();
    }

    private String generateErrorExecutionId(String nodeId) {
        return nodeId + "_error_" + System.currentTimeMillis();
    }

    private NodeOutputSaveEvent createSuccessEvent(
            String nodeId, String executionId, Map<String, SemanticLabel<?>> outputs, String executionContextId) {
        // 将SemanticLabel转换为Object以匹配事件接口
        Map<String, Object> objectOutputs = new HashMap<>();
        outputs.forEach((key, value) -> objectOutputs.put(key, value));
        
        return NodeOutputSaveEvent.of(
                this, // source
                nodeType, // sourceIdentifier  
                nodeId, // nodeName
                executionId, // nodeExecutionId
                objectOutputs, // outputs
                executionContextId // graphExecutionId
        );
    }

    private NodeOutputSaveEvent createErrorEvent(
            String nodeId, String errorExecutionId, String errorMessage, String executionContextId) {
        Map<String, Object> errorOutputs = Map.of("error", errorMessage);
        
        return NodeOutputSaveEvent.of(
                this, // source
                nodeType, // sourceIdentifier
                nodeId, // nodeName  
                errorExecutionId, // nodeExecutionId
                errorOutputs, // outputs
                executionContextId // graphExecutionId
        );
    }
}
