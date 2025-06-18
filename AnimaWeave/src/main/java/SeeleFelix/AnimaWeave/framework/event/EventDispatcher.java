package SeeleFelix.AnimaWeave.framework.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * 简化的事件分发器 - 基于Spring原生事件系统
 * 
 * Spring已经处理了：
 * - 事件路由 (@EventListener自动匹配)
 * - 异步处理 (@Async)
 * - 条件监听 (condition属性)
 * - 事件顺序 (@Order)
 * 
 * 我们只需要一个简单的发布入口
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventDispatcher {
    
    private final ApplicationEventPublisher eventPublisher;
    
    /**
     * 发布事件 - 委托给Spring处理路由
     */
    public void publishEvent(AnimaWeaveEvent event) {
        log.trace("Publishing event: {}", event.getEventType());
        eventPublisher.publishEvent(event);
    }
} 