package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionResult;
import org.springframework.context.event.EventListener;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import java.util.Map;

/**
 * Vessel事件处理器
 * 使用Spring原生事件系统，简化事件处理
 */
@Component 
public class VesselEventHandler {
    
    private final VesselRegistry vesselRegistry;
    private final ApplicationEventPublisher eventPublisher;
    
    public VesselEventHandler(VesselRegistry vesselRegistry, 
                             ApplicationEventPublisher eventPublisher) {
        this.vesselRegistry = vesselRegistry;
        this.eventPublisher = eventPublisher;
    }
    
    /**
     * 处理节点执行请求
     * 直接使用Spring的@EventListener，比我们自己写的EventDispatcher简单多了！
     */
    @EventListener
    public void handleNodeExecution(NodeExecutionRequest request) {
        vesselRegistry.getVessel(request.getVesselName())
            .ifPresentOrElse(vessel -> {
                try {
                    // 找到对应的节点定义
                    NodeDefinition nodeDef = vessel.getSupportedNodes().stream()
                        .filter(node -> node.nodeType().equals(request.getNodeType()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException(
                            "Node type not supported: " + request.getNodeType()));
                    
                    // 创建执行上下文
                    NodeExecutionContext context = NodeExecutionContext.of(
                        request.getNodeId(), 
                        request.getExecutionContextId()
                    );
                    
                    // 执行节点
                    Map<String, Object> outputs = nodeDef.executor().execute(request.getInputs(), context);
                    
                    // 发布执行结果 - 用Spring的事件发布器
                    NodeExecutionResult result = NodeExecutionResult.success(
                        request.getVesselName(),
                        request.getNodeId(),
                        request.getEventId(),
                        request.getExecutionContextId()
                    ).outputs(outputs).build();
                    
                    eventPublisher.publishEvent(result);
                    
                } catch (Exception e) {
                    // 发布失败结果
                    NodeExecutionResult result = NodeExecutionResult.failure(
                        request.getVesselName(),
                        request.getNodeId(), 
                        request.getEventId(),
                        request.getExecutionContextId(),
                        e
                    ).build();
                    
                    eventPublisher.publishEvent(result);
                }
            }, () -> {
                // Vessel不存在的错误处理
                NodeExecutionResult result = NodeExecutionResult.failure(
                    "System",
                    request.getNodeId(),
                    request.getEventId(), 
                    request.getExecutionContextId(),
                    "Vessel not found: " + request.getVesselName()
                ).build();
                
                eventPublisher.publishEvent(result);
            });
    }
} 