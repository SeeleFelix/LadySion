package SeeleFelix.AnimaWeave.framework.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import java.time.Instant;
import java.util.UUID;

/**
 * AnimaWeave事件系统基类
 * 继承Spring的ApplicationEvent，利用Spring原生事件机制
 * 使用lombok简化getter方法
 */
@Getter
public abstract class AnimaWeaveEvent extends ApplicationEvent {
    
    private final String eventId;
    private final Instant eventTimestamp;
    private final String sourceIdentifier;
    
    protected AnimaWeaveEvent(Object source, String sourceIdentifier) {
        super(source);
        this.eventId = UUID.randomUUID().toString();
        this.eventTimestamp = Instant.now();
        this.sourceIdentifier = sourceIdentifier;
    }
    
    /**
     * 获取事件的类型标识
     */
    public String getEventType() {
        return this.getClass().getSimpleName();
    }
} 