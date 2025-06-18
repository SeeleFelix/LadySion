package SeeleFelix.AnimaWeave.framework.awakening;

import SeeleFelix.AnimaWeave.framework.graph.GraphCoordinator;
import SeeleFelix.AnimaWeave.framework.graph.GraphDefinition;
import SeeleFelix.AnimaWeave.framework.startup.SystemStartupCoordinator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Awakening - 图执行的觉醒入口
 * 
 * 这是Lady Sion的觉醒时刻，所有图的执行都从这里开始
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class Awakening {
    
    private final GraphCoordinator graphCoordinator;
    private final SystemStartupCoordinator startupCoordinator;
    
    /**
     * 觉醒：执行图定义
     * 
     * @param graphDefinition 图定义
     * @return 执行结果的Future
     */
    public CompletableFuture<AwakeningResult> awaken(GraphDefinition graphDefinition) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("🌅 Awakening begins for graph: {}", graphDefinition.name());
                
                // 检查系统是否就绪
                if (!graphCoordinator.isSystemReady()) {
                    return AwakeningResult.failure(
                        graphDefinition.name(),
                        "System is not ready. Please wait for vessel loading to complete."
                    );
                }
                
                // 开始图执行
                graphCoordinator.startGraphExecution(graphDefinition);
                
                log.info("✨ Graph awakening initiated: {}", graphDefinition.name());
                
                return AwakeningResult.success(
                    graphDefinition.name(),
                    "Graph execution started successfully"
                );
                
            } catch (Exception e) {
                log.error("💥 Awakening failed for graph: {}", graphDefinition.name(), e);
                return AwakeningResult.failure(
                    graphDefinition.name(),
                    "Awakening failed: " + e.getMessage()
                );
            }
        });
    }
    
    /**
     * 等待系统就绪
     * 
     * @param timeoutSeconds 超时时间（秒）
     * @return 是否就绪
     */
    public boolean waitForSystemReady(long timeoutSeconds) {
        log.info("⏳ Waiting for system to be ready (timeout: {}s)...", timeoutSeconds);
        
        long startTime = System.currentTimeMillis();
        long timeoutMs = timeoutSeconds * 1000;
        
        while (!graphCoordinator.isSystemReady()) {
            if (System.currentTimeMillis() - startTime > timeoutMs) {
                log.warn("⏰ System readiness timeout after {}s", timeoutSeconds);
                return false;
            }
            
            try {
                Thread.sleep(100); // 每100ms检查一次
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        
        log.info("✅ System is ready!");
        return true;
    }
    
    /**
     * 获取系统启动状态
     */
    public String getSystemStatus() {
        var status = startupCoordinator.getStartupStatus();
        return status.getStatusSummary();
    }
    
    /**
     * 检查系统是否就绪
     */
    public boolean isSystemReady() {
        return graphCoordinator.isSystemReady();
    }
} 