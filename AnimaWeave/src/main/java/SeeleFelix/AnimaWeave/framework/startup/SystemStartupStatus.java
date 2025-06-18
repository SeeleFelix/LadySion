package SeeleFelix.AnimaWeave.framework.startup;

import java.util.Set;

/**
 * 系统启动状态记录
 * 用于查询当前系统启动进度
 */
public record SystemStartupStatus(
    Set<String> expectedVessels,     // 预期加载的vessel
    Set<String> loadedVessels,       // 已成功加载的vessel  
    Set<String> failedVessels,       // 加载失败的vessel
    boolean systemReady              // 系统是否就绪
) {
    
    /**
     * 获取加载进度百分比
     */
    public double getLoadingProgress() {
        if (expectedVessels.isEmpty()) {
            return 100.0;
        }
        return (double) loadedVessels.size() / expectedVessels.size() * 100.0;
    }
    
    /**
     * 获取待加载的vessel
     */
    public Set<String> getPendingVessels() {
        var pending = Set.copyOf(expectedVessels);
        pending.removeAll(loadedVessels);
        pending.removeAll(failedVessels);
        return pending;
    }
    
    /**
     * 检查是否有失败的vessel
     */
    public boolean hasFailures() {
        return !failedVessels.isEmpty();
    }
    
    /**
     * 获取状态摘要
     */
    public String getStatusSummary() {
        return "System Status: %s | Loaded: %d/%d | Failed: %d | Progress: %.1f%%".formatted(
            systemReady ? "READY" : "LOADING",
            loadedVessels.size(),
            expectedVessels.size(),
            failedVessels.size(),
            getLoadingProgress()
        );
    }
} 