package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import SeeleFelix.AnimaWeave.framework.event.events.NodeOutputSaveEvent;
import SeeleFelix.AnimaWeave.framework.node.AnimaNode;
import SeeleFelix.AnimaWeave.framework.node.NodeExecutor;
import SeeleFelix.AnimaWeave.framework.node.Port;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.UUIDLabel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Start节点执行器 - 图执行的起始点，事件驱动
 */
@Slf4j
@AnimaNode(
    vessel = "basic",
    node = "start", 
    description = "图执行的起始点，生成执行ID和信号"
)
@RequiredArgsConstructor
public class StartNodeExecutor implements NodeExecutor {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<Port<?>> getInputPorts() {
        // Start节点没有输入端口
        return List.of();
    }

    @Override
    public List<Port<?>> getOutputPorts() {
        return List.of(
            Port.output("signal", SignalLabel.class, "启动信号"),
            Port.output("execution_id", UUIDLabel.class, "执行ID")
        );
    }

    @EventListener(condition = "#request.nodeType == 'basic.start'")
    @Async("virtualThreadExecutor")
    @Override
    public void handleExecution(NodeExecutionRequest request) {
        log.debug("Start节点开始执行: {}", request.getNodeId());

        try {
            // 创建输出
            Map<String, Object> outputs = new HashMap<>();
            outputs.put("signal", SignalLabel.trigger());
            outputs.put("execution_id", UUIDLabel.random());

            // 发布输出事件
            NodeOutputSaveEvent outputEvent = NodeOutputSaveEvent.of(
                this,
                "StartNodeExecutor",
                request.getNodeId(),
                request.getNodeExecutionId(),
                outputs,
                request.getExecutionContextId()
            );

            eventPublisher.publishEvent(outputEvent);
            log.debug("Start节点执行完成: {}", request.getNodeId());

        } catch (Exception e) {
            log.error("Start节点执行失败: {}", request.getNodeId(), e);
            
            // 发布错误事件
            NodeOutputSaveEvent errorEvent = NodeOutputSaveEvent.of(
                this,
                "StartNodeExecutor",
                request.getNodeId(),
                request.getNodeExecutionId(),
                Map.of("error", e.getMessage()),
                request.getExecutionContextId()
            );
            eventPublisher.publishEvent(errorEvent);
        }
    }
} 