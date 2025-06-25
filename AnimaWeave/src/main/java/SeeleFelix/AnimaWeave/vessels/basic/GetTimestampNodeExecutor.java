package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import SeeleFelix.AnimaWeave.framework.event.events.NodeOutputSaveEvent;
import SeeleFelix.AnimaWeave.framework.node.AnimaNode;
import SeeleFelix.AnimaWeave.framework.node.NodeExecutor;
import SeeleFelix.AnimaWeave.framework.node.Port;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.TimestampLabel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * GetTimestamp节点执行器 - 获取当前时间戳，事件驱动
 */
@Slf4j
@AnimaNode(
    vessel = "basic",
    node = "gettimestamp",
    description = "获取当前时间戳"
)
@RequiredArgsConstructor
public class GetTimestampNodeExecutor implements NodeExecutor {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<Port<?>> getInputPorts() {
        // GetTimestamp节点没有输入端口
        return List.of();
    }

    @Override
    public List<Port<?>> getOutputPorts() {
        return List.of(
            Port.output("timestamp", TimestampLabel.class, "当前时间戳"),
            Port.output("done", SignalLabel.class, "执行完成信号")
        );
    }

    @EventListener(condition = "#request.nodeType == 'basic.gettimestamp'")
    @Async("virtualThreadExecutor")
    @Override
    public void handleExecution(NodeExecutionRequest request) {
        log.debug("GetTimestamp节点开始执行: {}", request.getNodeId());

        try {
            // 创建输出 - 使用实际的时间戳
            Map<String, Object> outputs = new HashMap<>();
            outputs.put("timestamp", SemanticLabel.withValue(TimestampLabel.class, Instant.now()));
            outputs.put("done", SignalLabel.trigger());

            // 发布输出事件
            NodeOutputSaveEvent outputEvent = NodeOutputSaveEvent.of(
                this,
                "GetTimestampNodeExecutor",
                request.getNodeId(),
                request.getNodeExecutionId(),
                outputs,
                request.getExecutionContextId()
            );

            eventPublisher.publishEvent(outputEvent);
            log.debug("GetTimestamp节点执行完成: {}", request.getNodeId());

        } catch (Exception e) {
            log.error("GetTimestamp节点执行失败: {}", request.getNodeId(), e);
            
            // 发布错误事件
            NodeOutputSaveEvent errorEvent = NodeOutputSaveEvent.of(
                this,
                "GetTimestampNodeExecutor",
                request.getNodeId(),
                request.getNodeExecutionId(),
                Map.of("error", e.getMessage()),
                request.getExecutionContextId()
            );
            eventPublisher.publishEvent(errorEvent);
        }
    }
} 