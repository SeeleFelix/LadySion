package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;

/**
 * Vessel上下文接口
 * 为vessel插件提供框架服务的访问入口
 */
public interface VesselContext {
    
    /**
     * 获取事件调度器
     */
    EventDispatcher getEventDispatcher();
    
    /**
     * 获取vessel注册表
     */
    VesselRegistry getVesselRegistry();
    
    /**
     * 获取配置属性
     */
    String getProperty(String key);
    
    /**
     * 获取配置属性，带默认值
     */
    String getProperty(String key, String defaultValue);
    
    /**
     * 记录日志
     */
    void log(String level, String message);
    
    /**
     * 记录日志（默认INFO级别）
     */
    default void log(String message) {
        log("INFO", message);
    }
    
    /**
     * 获取vessel的工作目录
     */
    String getWorkingDirectory();
    
    /**
     * 获取vessel的临时目录
     */
    String getTempDirectory();
} 