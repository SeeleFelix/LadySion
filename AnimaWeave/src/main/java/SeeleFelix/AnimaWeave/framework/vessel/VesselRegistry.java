package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;
import java.util.Optional;

/**
 * Vessel注册表接口
 * 管理已加载的vessel插件
 */
public interface VesselRegistry {
    
    /**
     * 注册vessel插件
     */
    void register(String vesselName, AnimaVessel vessel);
    
    /**
     * 注销vessel插件
     */
    void unregister(String vesselName);
    
    /**
     * 获取指定的vessel插件
     */
    Optional<AnimaVessel> getVessel(String vesselName);
    
    /**
     * 获取所有已注册的vessel名称
     */
    List<String> getVesselNames();
    
    /**
     * 获取所有已注册的vessel插件
     */
    List<AnimaVessel> getAllVessels();
    
    /**
     * 检查vessel是否已注册
     */
    boolean isRegistered(String vesselName);
    
    /**
     * 获取支持指定节点类型的vessel
     */
    Optional<AnimaVessel> getVesselForNodeType(String nodeType);
    
    /**
     * 获取支持指定语义标签的vessel列表
     */
    List<AnimaVessel> getVesselsForSemanticLabel(String semanticLabel);
} 