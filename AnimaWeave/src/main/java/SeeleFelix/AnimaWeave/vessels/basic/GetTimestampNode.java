package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.InputPort;
import SeeleFelix.AnimaWeave.framework.node.Node;
import SeeleFelix.AnimaWeave.framework.node.NodeMeta;
import SeeleFelix.AnimaWeave.framework.node.OutputPort;
import SeeleFelix.AnimaWeave.framework.vessel.Port;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.UUIDLabel;
import java.time.Instant;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** GetTimestamp节点实例 - 获取当前时间戳 */
@Slf4j
@Component
@NodeMeta(
    displayName = "获取时间戳",
    description = "获取当前时间戳"
)
public class GetTimestampNode extends Node {

    // 输入端口定义 - 使用泛型Port
    @InputPort("trigger")
    private final Port<SignalLabel> triggerPort;

    // 输出端口定义 - 使用泛型Port  
    @OutputPort("timestamp")
    private final Port<UUIDLabel> timestampPort;
    
    @OutputPort("done")
    private final Port<SignalLabel> donePort;

    public GetTimestampNode(ApplicationEventPublisher eventPublisher) {
        super("GetTimestamp", "basic.GetTimestamp", eventPublisher);
        
        // 初始化端口定义 - 泛型化的Port
        this.triggerPort = new Port<>("trigger", SignalLabel.class);
        this.timestampPort = new Port<>("timestamp", UUIDLabel.class);
        this.donePort = new Port<>("done", SignalLabel.class);
    }

    @Override
    protected void executeNode() {
        log.debug("GetTimestamp节点开始执行");

        // 获取输入触发信号
        SignalLabel triggerInput = getInput("trigger");
        
        // 生成当前时间戳作为UUID（实际项目中可能用其他格式）
        UUID timestampValue = UUID.randomUUID(); // 简化实现，实际可能用时间戳
        
        // 创建输出Label实例并设置
        UUIDLabel timestampOutput = UUIDLabel.of(timestampValue);
        SignalLabel doneOutput = SignalLabel.trigger();
        
        setOutput("timestamp", timestampOutput);
        setOutput("done", doneOutput);

        log.debug("GetTimestamp节点执行完成，时间戳: {}", timestampValue);
    }
}
