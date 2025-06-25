package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import SeeleFelix.AnimaWeave.framework.event.events.NodeOutputSaveEvent;
import SeeleFelix.AnimaWeave.framework.node.AnimaNode;
import SeeleFelix.AnimaWeave.framework.node.NodeExecutor;
import SeeleFelix.AnimaWeave.framework.node.Port;
import SeeleFelix.AnimaWeave.vessels.basic.labels.BoolLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.NumberLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * IsEven节点执行器 - 判断数字是否为偶数，事件驱动
 */
@Slf4j
@AnimaNode(
    vessel = "basic",
    node = "iseven",
    description = "判断一个数字是否为偶数"
)
@RequiredArgsConstructor
public class IsEvenNodeExecutor implements NodeExecutor {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<Port<?>> getInputPorts() {
        return List.of(
            Port.input("number", NumberLabel.class, "要判断的数字")
        );
    }

    @Override
    public List<Port<?>> getOutputPorts() {
        return List.of(
            Port.output("result", BoolLabel.class, "是否为偶数的结果"),
            Port.output("done", SignalLabel.class, "执行完成信号")
        );
    }

    @EventListener(condition = "#request.nodeType == 'basic.iseven'")
    @Async("virtualThreadExecutor")
    @Override
    public void handleExecution(NodeExecutionRequest request) {
        log.debug("IsEven节点开始执行: {}", request.getNodeId());

        try {
            // 从请求中获取输入
            NumberLabel numberInput = (NumberLabel) request.getInputs().get("number");
            
            if (numberInput == null || numberInput.getValue() == null) {
                throw new IllegalArgumentException("输入数字不能为null");
            }

            BigDecimal numberValue = numberInput.getValue();
            
            // 判断是否为偶数
            boolean resultValue = numberValue.remainder(BigDecimal.valueOf(2))
                                            .compareTo(BigDecimal.ZERO) == 0;

            // 创建输出
            Map<String, Object> outputs = new HashMap<>();
            outputs.put("result", BoolLabel.of(resultValue));
            outputs.put("done", SignalLabel.trigger());

            // 发布输出事件
            NodeOutputSaveEvent outputEvent = NodeOutputSaveEvent.of(
                this,
                "IsEvenNodeExecutor",
                request.getNodeId(),
                request.getNodeExecutionId(),
                outputs,
                request.getExecutionContextId()
            );

            eventPublisher.publishEvent(outputEvent);
            log.debug("IsEven节点执行完成: {}, 数字: {}, 结果: {}", 
                request.getNodeId(), numberValue, resultValue);

        } catch (Exception e) {
            log.error("IsEven节点执行失败: {}", request.getNodeId(), e);
            
            // 发布错误事件
            NodeOutputSaveEvent errorEvent = NodeOutputSaveEvent.of(
                this,
                "IsEvenNodeExecutor",
                request.getNodeId(),
                request.getNodeExecutionId(),
                Map.of("error", e.getMessage()),
                request.getExecutionContextId()
            );
            eventPublisher.publishEvent(errorEvent);
        }
    }
} 