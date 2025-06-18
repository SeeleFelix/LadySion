package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.NodeInstance;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * GetTimestamp节点实例
 * 获取当前时间戳
 */
@Slf4j
@Component
public class GetTimestampNodeInstance extends NodeInstance {
    
    public GetTimestampNodeInstance(ApplicationEventPublisher eventPublisher) {
        super("GetTimestamp", "GetTimestamp", eventPublisher);
    }
    
    @Override
    protected Map<String, Object> executeNode(Map<String, Object> inputs) {
        log.debug("GetTimestamp节点开始执行");
        
        // 获取触发信号
        var trigger = (Boolean) inputs.get("trigger");
        
        if (!Boolean.TRUE.equals(trigger)) {
            log.debug("GetTimestamp节点未被触发");
            return Map.of(
                "timestamp", 0,
                "done", false
            );
        }
        
        // 获取当前时间戳
        var timestamp = (int) (System.currentTimeMillis() / 1000);
        
        Map<String, Object> outputs = Map.of(
            "timestamp", timestamp,
            "done", true
        );
        
        log.debug("GetTimestamp节点执行完成，时间戳: {}", timestamp);
        return outputs;
    }
} 