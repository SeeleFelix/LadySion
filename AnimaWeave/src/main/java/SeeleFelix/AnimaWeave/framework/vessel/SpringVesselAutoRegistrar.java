package SeeleFelix.AnimaWeave.framework.vessel;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/**
 * Spring容器Vessel自动注册器
 *
 * <p>专门负责发现和注册Spring容器中的@Component vessel 职责单一：只处理Spring bean形式的vessel
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpringVesselAutoRegistrar {

  private final VesselRegistry vesselRegistry;
  private final ApplicationContext applicationContext;

  /** Spring启动时自动注册所有@Component vessel */
  @PostConstruct
  public void registerSpringVessels() {
    log.info("🔍 Auto-discovering @Component vessels from Spring context...");

    Map<String, AnimaVessel> vesselBeans = applicationContext.getBeansOfType(AnimaVessel.class);
    log.info("发现 {} 个@Component vessel", vesselBeans.size());

    int successCount = 0;
    int failureCount = 0;

    for (Map.Entry<String, AnimaVessel> entry : vesselBeans.entrySet()) {
      String beanName = entry.getKey();
      AnimaVessel vessel = entry.getValue();
      String vesselId = vessel.getMetadata().name();

      try {
        // 检查是否已经注册过 (避免重复注册)
        if (vesselRegistry.getVessel(vesselId).isPresent()) {
          log.debug("⏭️ Vessel已存在，跳过: {} (bean: {})", vesselId, beanName);
          continue;
        }

        // 初始化vessel
        // @Component vessel通过Spring依赖注入获取依赖，不需要VesselContext
        vessel.initialize(null); // context可以为null

        // 注册vessel到registry (VesselRegistry会自动发布VesselLoadedEvent)
        vesselRegistry.register(vesselId, vessel);
        log.info(
            "✅ 自动注册@Component vessel: {} v{} (bean: {})",
            vesselId,
            vessel.getMetadata().version(),
            beanName);

        successCount++;

      } catch (Exception e) {
        log.error("❌ 注册@Component vessel失败: {} (bean: {})", vesselId, beanName, e);
        failureCount++;
      }
    }

    log.info("📊 @Component vessel注册完成: 成功 {}, 失败 {}", successCount, failureCount);

    if (vesselBeans.isEmpty()) {
      log.warn("⚠️ Spring容器中未发现任何@Component vessel，请检查包扫描配置");
    }
  }

  /** 获取注册统计信息 */
  public VesselRegistrationStats getRegistrationStats() {
    var vesselNames = vesselRegistry.getVesselNames();
    return new VesselRegistrationStats(vesselNames.size(), vesselNames);
  }

  /** Vessel注册统计信息 */
  public record VesselRegistrationStats(int totalCount, java.util.List<String> vesselNames) {
    @Override
    public String toString() {
      return "VesselRegistrationStats{total=%d, vessels=%s}".formatted(totalCount, vesselNames);
    }
  }
}
