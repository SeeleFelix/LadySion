package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.node.NodeFactory;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/** Spring Vessel加载器 专门负责发现和加载Spring容器中的@Component vessel */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpringVesselLoader {

  private final ApplicationContext applicationContext;
  private final VesselsRegistry vesselRegistry;
  private final NodeFactory nodeFactory;

  /**
   * 加载Spring容器中的@Component vessel
   *
   * @return 加载统计信息
   */
  public LoadResult loadSpringVessels() {
    log.info("🔍 Loading @Component vessels from Spring context...");

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

        // 注册vessel到registry
        vesselRegistry.register(vesselId, vessel);

        // 为vessel创建Node
        nodeFactory.createNodeInstancesForVessel(vessel);

        log.info(
            "✅ 加载@Component vessel: {} v{} (bean: {})",
            vesselId,
            vessel.getMetadata().version(),
            beanName);

        successCount++;

      } catch (Exception e) {
        log.error("❌ 加载@Component vessel失败: {} (bean: {})", vesselId, beanName, e);
        failureCount++;
      }
    }

    // 完成vessel注册后，构建索引
    vesselRegistry.finishInitialization();

    var result = new LoadResult(successCount, failureCount, vesselBeans.size());
    log.info("📊 @Component vessel加载完成: {}", result);

    if (vesselBeans.isEmpty()) {
      log.warn("⚠️ Spring容器中未发现任何@Component vessel，请检查包扫描配置");
    }

    return result;
  }

  /** 加载结果统计 */
  public record LoadResult(int successCount, int failureCount, int totalFound) {
    @Override
    public String toString() {
      return "成功 %d, 失败 %d, 总计 %d".formatted(successCount, failureCount, totalFound);
    }
  }
}
