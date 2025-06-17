package SeeleFelix.AnimaWeave.framework.vessel;

/**
 * Vessel插件状态枚举
 */
public enum VesselStatus {
    
    /**
     * 已加载但未初始化
     */
    LOADED,
    
    /**
     * 正在初始化
     */
    INITIALIZING,
    
    /**
     * 运行中
     */
    RUNNING,
    
    /**
     * 正在关闭
     */
    SHUTTING_DOWN,
    
    /**
     * 已停止
     */
    STOPPED,
    
    /**
     * 错误状态
     */
    ERROR;
    
    /**
     * 是否为活跃状态
     */
    public boolean isActive() {
        return this == RUNNING;
    }
    
    /**
     * 是否为终止状态
     */
    public boolean isTerminal() {
        return this == STOPPED || this == ERROR;
    }
    
    /**
     * 是否为过渡状态
     */
    public boolean isTransitional() {
        return this == INITIALIZING || this == SHUTTING_DOWN;
    }
} 