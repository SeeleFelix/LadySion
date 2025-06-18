package SeeleFelix.AnimaWeave.framework.startup;

import SeeleFelix.AnimaWeave.framework.event.events.VesselLoadedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 系统启动协调器
 * 
 * 职责：
 * 1. 监听vessel加载事件
 * 2. 跟踪系统启动进度
 * 3. 在所有vessel加载完成后发送SystemReady事件
 * 4. 处理vessel加载失败的情况
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SystemStartupCoordinator {
    
    private final ApplicationEventPublisher eventPublisher;
    
    // 预期的vessel列表 - 可以从配置文件读取
    private final Set<String> expectedVessels = Set.of(
        "MathVessel",
        "OpenRouterVessel", 
        "BasicVessel"
    );
    
    // 已成功加载的vessel
    private final Set<String> loadedVessels = new HashSet<>();
    
    // 加载失败的vessel
    private final Set<String> failedVessels = new HashSet<>();
    
    // 系统就绪标志
    private final AtomicBoolean systemReady = new AtomicBoolean(false);
    
    /**
     * 监听vessel加载事件
     */
    @EventListener
    public void onVesselLoaded(VesselLoadedEvent event) {
        var vesselName = event.vesselName();
        
        if (event.successful()) {
            synchronized (this) {
                loadedVessels.add(vesselName);
                log.info("Vessel loaded successfully: {} ({})", 
                        vesselName, event.metadata().version());
                
                // 检查是否所有vessel都加载完成
                checkSystemReadiness();
            }
        } else {
            synchronized (this) {
                failedVessels.add(vesselName);
                log.error("Failed to load vessel: {} - {}", vesselName, event.errorMessage());
                
                // 检查是否需要停止启动过程
                checkStartupFailure();
            }
        }
    }
    
    /**
     * 检查系统是否就绪
     */
    private void checkSystemReadiness() {
        if (loadedVessels.containsAll(expectedVessels)) {
            if (systemReady.compareAndSet(false, true)) {
                log.info("🎉 All vessels loaded successfully! System is ready.");
                log.info("Loaded vessels: {}", loadedVessels);
                
                // 发送系统就绪事件
                var readyEvent = SystemReadyEvent.of(
                    this,
                    "SystemStartupCoordinator",
                    loadedVessels,
                    System.currentTimeMillis()
                );
                
                eventPublisher.publishEvent(readyEvent);
            }
        } else {
            var remaining = new HashSet<>(expectedVessels);
            remaining.removeAll(loadedVessels);
            log.debug("Waiting for vessels: {}", remaining);
        }
    }
    
    /**
     * 检查启动失败情况
     */
    private void checkStartupFailure() {
        // 如果任何关键vessel加载失败，可能需要停止系统
        if (!failedVessels.isEmpty()) {
            log.warn("⚠️ Some vessels failed to load: {}", failedVessels);
            
            // 可以根据策略决定是否继续：
            // 1. 严格模式：任何失败都停止启动
            // 2. 宽松模式：只要有基础vessel就继续
            // 这里先用宽松模式
            
            var criticalVessels = Set.of("BasicVessel"); // 关键vessel
            var failedCritical = new HashSet<>(failedVessels);
            failedCritical.retainAll(criticalVessels);
            
            if (!failedCritical.isEmpty()) {
                log.error("💥 Critical vessels failed to load: {}. System startup aborted.", failedCritical);
                
                var failureEvent = SystemStartupFailureEvent.of(
                    this,
                    "SystemStartupCoordinator",
                    failedVessels,
                    "Critical vessels failed to load"
                );
                
                eventPublisher.publishEvent(failureEvent);
            }
        }
    }
    
    /**
     * 获取系统状态
     */
    public SystemStartupStatus getStartupStatus() {
        return new SystemStartupStatus(
            expectedVessels,
            Set.copyOf(loadedVessels),
            Set.copyOf(failedVessels),
            systemReady.get()
        );
    }
    
    /**
     * 手动触发系统就绪检查（用于测试）
     */
    public void forceCheckReadiness() {
        checkSystemReadiness();
    }
} 