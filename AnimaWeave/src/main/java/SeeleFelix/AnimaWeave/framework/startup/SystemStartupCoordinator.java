package SeeleFelix.AnimaWeave.framework.startup;

import SeeleFelix.AnimaWeave.framework.event.events.VesselLoadedEvent;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 系统启动协调器
 *
 * <p>职责： 1. 监听vessel加载事件 2. 跟踪系统启动进度 3. 在发现vessel后合理时间内判断系统就绪 4. 处理vessel加载失败的情况
 *
 * <p>设计理念：不硬编码vessel列表，而是动态发现和管理
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SystemStartupCoordinator {

  private final ApplicationEventPublisher eventPublisher;

  // 已发现的vessel（第一次加载事件时记录）
  private final Set<String> discoveredVessels = new HashSet<>();

  // 已成功加载的vessel
  private final Set<String> loadedVessels = new HashSet<>();

  // 加载失败的vessel
  private final Set<String> failedVessels = new HashSet<>();

  // 系统就绪标志
  private final AtomicBoolean systemReady = new AtomicBoolean(false);

  // 启动完成检查延迟（毫秒）- 在最后一个vessel加载后等待
  private static final long STARTUP_COMPLETION_DELAY = 500L;

  // 最后一次vessel加载时间
  private volatile long lastVesselLoadTime = 0L;

  /** 监听vessel加载事件 */
  @EventListener
  public void onVesselLoaded(VesselLoadedEvent event) {
    var vesselName = event.vesselName();

    synchronized (this) {
      // 记录发现的vessel
      discoveredVessels.add(vesselName);

      if (event.successful()) {
        loadedVessels.add(vesselName);
        log.info("Vessel loaded successfully: {} ({})", vesselName, event.metadata().version());
      } else {
        failedVessels.add(vesselName);
        log.error("Failed to load vessel: {} - {}", vesselName, event.errorMessage());
      }

      // 更新最后加载时间
      lastVesselLoadTime = System.currentTimeMillis();

      // 延迟检查系统就绪（给其他vessel加载留时间）
      scheduleReadinessCheck();
    }
  }

  /** 安排就绪性检查 */
  private void scheduleReadinessCheck() {
    // 使用简单的延迟检查机制
    new Thread(
            () -> {
              try {
                Thread.sleep(STARTUP_COMPLETION_DELAY);
                checkSystemReadiness();
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              }
            })
        .start();
  }

  /** 检查系统是否就绪 */
  private void checkSystemReadiness() {
    synchronized (this) {
      // 如果已经就绪，不重复处理
      if (systemReady.get()) {
        return;
      }

      // 检查是否已经过了足够的等待时间
      long timeSinceLastLoad = System.currentTimeMillis() - lastVesselLoadTime;
      if (timeSinceLastLoad < STARTUP_COMPLETION_DELAY) {
        // 还没到时间，可能还有vessel在加载
        return;
      }

      // 判断系统就绪条件：
      // 1. 至少有一个vessel成功加载
      // 2. 没有关键vessel加载失败
      boolean hasBasicVessel =
          loadedVessels.stream().anyMatch(name -> name.toLowerCase().contains("basic"));

      if (!loadedVessels.isEmpty() && hasBasicVessel) {
        if (systemReady.compareAndSet(false, true)) {
          log.info(
              "🎉 System startup completed! Discovered {} vessels, {} loaded successfully.",
              discoveredVessels.size(),
              loadedVessels.size());
          log.info("Loaded vessels: {}", loadedVessels);

          if (!failedVessels.isEmpty()) {
            log.warn("Some vessels failed to load: {}", failedVessels);
          }

          // 发送系统就绪事件
          var readyEvent =
              SystemReadyEvent.of(
                  this, "SystemStartupCoordinator", loadedVessels, System.currentTimeMillis());

          eventPublisher.publishEvent(readyEvent);
        }
      } else {
        log.warn(
            "⚠️ System not ready: loadedVessels={}, hasBasic={}", loadedVessels, hasBasicVessel);

        // 如果没有基础vessel，可能需要报告启动失败
        if (!hasBasicVessel && !discoveredVessels.isEmpty()) {
          log.error("💥 No basic vessel loaded. System startup may have failed.");

          var failureEvent =
              SystemStartupFailureEvent.of(
                  this, "SystemStartupCoordinator", failedVessels, "No basic vessel available");

          eventPublisher.publishEvent(failureEvent);
        }
      }
    }
  }

  /** 获取系统状态 */
  public SystemStartupStatus getStartupStatus() {
    return new SystemStartupStatus(
        Set.copyOf(discoveredVessels),
        Set.copyOf(loadedVessels),
        Set.copyOf(failedVessels),
        systemReady.get());
  }

  /** 手动触发系统就绪检查（用于测试） */
  public void forceCheckReadiness() {
    checkSystemReadiness();
  }

  /** 立即标记系统就绪（用于测试环境） */
  public void forceSystemReady() {
    if (systemReady.compareAndSet(false, true)) {
      log.info("🧪 System forced to ready state for testing");

      var readyEvent =
          SystemReadyEvent.of(
              this,
              "SystemStartupCoordinator",
              loadedVessels.isEmpty() ? Set.of("test") : loadedVessels,
              System.currentTimeMillis());

      eventPublisher.publishEvent(readyEvent);
    }
  }
}
