package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;
import SeeleFelix.AnimaWeave.framework.event.events.VesselLoadedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Vessel注册表实现
 * 线程安全的vessel插件注册表
 * 使用lombok和Java 21现代化实现
 * 
 * 增强版本：统一处理vessel注册和事件发布
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VesselRegistryImpl implements VesselRegistry {
    
    private final ConcurrentMap<String, AnimaVessel> vessels = new ConcurrentHashMap<>();
    private final EventDispatcher eventDispatcher;
    
    @Override
    public void register(String vesselName, AnimaVessel vessel) {
        if (vesselName == null || vessel == null) {
            throw new IllegalArgumentException("Vessel name and vessel cannot be null");
        }
        
        var existing = vessels.put(vesselName, vessel);
        if (existing != null) {
            log.info("Replacing existing vessel: {} with {}", vesselName, vessel.getMetadata().version());
            shutdownVesselSafely(existing, "replaced vessel: " + vesselName);
        } else {
            log.info("Registered new vessel: {} v{}", vesselName, vessel.getMetadata().version());
        }
        
        // 统一发布VesselLoadedEvent - 所有vessel注册都通过这里发布事件
        publishVesselLoadedEvent(vesselName, vessel);
    }
    
    @Override
    public void unregister(String vesselName) {
        var vessel = vessels.remove(vesselName);
        if (vessel != null) {
            log.info("Unregistered vessel: {}", vesselName);
            shutdownVesselSafely(vessel, "unregistered vessel: " + vesselName);
        } else {
            log.warn("Attempted to unregister non-existent vessel: {}", vesselName);
        }
    }
    
    @Override
    public Optional<AnimaVessel> getVessel(String vesselName) {
        return Optional.ofNullable(vessels.get(vesselName));
    }
    
    @Override
    public List<String> getVesselNames() {
        return List.copyOf(vessels.keySet());
    }
    
    @Override
    public List<AnimaVessel> getAllVessels() {
        return List.copyOf(vessels.values());
    }
    
    @Override
    public boolean isRegistered(String vesselName) {
        return vessels.containsKey(vesselName);
    }
    
    /**
     * 获取所有支持的节点类型 - 用于调试和文档生成
     */
    public List<String> getAllSupportedNodeTypes() {
        return vessels.values().stream()
                .flatMap(vessel -> vessel.getSupportedNodes().stream())
                .map(node -> node.nodeType())
                .distinct()
                .sorted()
                .toList();
    }
    
    /**
     * 安全关闭vessel - 使用Java 21的现代化异常处理
     */
    private void shutdownVesselSafely(AnimaVessel vessel, String context) {
        try {
            vessel.shutdown();
            log.debug("Successfully shut down {}", context);
        } catch (Exception e) {
            log.warn("Failed to shutdown {}: {}", context, e.getMessage());
        }
    }
    
    /**
     * 发布vessel加载事件
     * 统一事件发布逻辑，避免各处重复代码
     */
    private void publishVesselLoadedEvent(String vesselName, AnimaVessel vessel) {
        try {
            var event = VesselLoadedEvent.success(
                this,
                "VesselRegistry", 
                vesselName,
                vessel.getMetadata()
            );
            eventDispatcher.publishEvent(event);
            log.debug("📡 Published VesselLoadedEvent for: {}", vesselName);
        } catch (Exception e) {
            log.error("❌ Failed to publish VesselLoadedEvent for vessel: {}", vesselName, e);
            
            // 发布失败事件
            try {
                var failureEvent = VesselLoadedEvent.failure(
                    this,
                    "VesselRegistry",
                    vesselName,
                    "Failed to publish success event: " + e.getMessage()
                );
                eventDispatcher.publishEvent(failureEvent);
            } catch (Exception publishException) {
                log.error("❌ Failed to publish failure event for vessel: {}", vesselName, publishException);
            }
        }
    }
} 