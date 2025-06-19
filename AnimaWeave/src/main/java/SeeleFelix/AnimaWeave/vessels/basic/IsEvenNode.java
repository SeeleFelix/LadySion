package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.Node;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * IsEven节点实例
 * 判断一个数字是否为偶数
 */
@Slf4j
@Component
public class IsEvenNode extends Node {
    
    public IsEvenNode(ApplicationEventPublisher eventPublisher) {
        super("IsEven", "basic.IsEven", eventPublisher);
    }
    
    @Override
    protected Map<String, Object> executeNode(Map<String, Object> inputs) {
        log.debug("IsEven节点开始执行");
        
        // 获取输入
        var number = (Integer) inputs.get("number");
        var trigger = (Boolean) inputs.get("trigger");
        
        if (!Boolean.TRUE.equals(trigger)) {
            log.debug("IsEven节点未被触发");
            return Map.of(
                "result", false,
                "done", false
            );
        }
        
        // 判断是否为偶数
        var isEven = number != null && number % 2 == 0;
        
        Map<String, Object> outputs = Map.of(
            "result", isEven,
            "done", true
        );
        
        log.debug("IsEven节点执行完成，数字: {}, 是否偶数: {}", number, isEven);
        return outputs;
    }
} 