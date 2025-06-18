package SeeleFelix.AnimaWeave.framework.startup;

import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

import java.util.Set;

/**
 * 系统启动失败事件
 * 当关键vessel加载失败，导致系统无法启动时发出
 */
@Getter
@ToString(callSuper = true, of = {"failedVesselsCount", "reason"})
@EqualsAndHashCode(callSuper = false, of = {"failedVessels", "reason"})
public final class SystemStartupFailureEvent extends AnimaWeaveEvent {
    
    private final Set<String> failedVessels;
    private final String reason;
    
    public SystemStartupFailureEvent(Object source, String sourceIdentifier,
                                   Set<String> failedVessels, String reason) {
        super(source, sourceIdentifier);
        this.failedVessels = Set.copyOf(failedVessels);
        this.reason = reason;
    }
    
    /**
     * 便捷的静态工厂方法
     */
    public static SystemStartupFailureEvent of(Object source, String sourceIdentifier,
                                             Set<String> failedVessels, String reason) {
        return new SystemStartupFailureEvent(source, sourceIdentifier, failedVessels, reason);
    }
    
    /**
     * 获取失败的vessel数量
     */
    public int getFailedVesselsCount() {
        return failedVessels.size();
    }
    
    /**
     * 检查特定vessel是否失败
     */
    public boolean isVesselFailed(String vesselName) {
        return failedVessels.contains(vesselName);
    }
} 