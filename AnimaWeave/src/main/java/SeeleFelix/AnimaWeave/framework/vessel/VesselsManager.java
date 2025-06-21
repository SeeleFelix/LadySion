package SeeleFelix.AnimaWeave.framework.vessel;

import jakarta.annotation.PostConstruct;
import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** 
 * Vessel插件管理器 - 统一协调器
 * 负责协调SpringVesselLoader和JarVesselLoader
 * 提供统一的vessel管理接口
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VesselsManager {

  private final SpringVesselLoader springVesselLoader;
  private final JarVesselLoader jarVesselLoader;
  private final VesselsRegistry vesselRegistry;

  /** Spring启动时自动加载所有vessel - 统一协调入口 */
  @PostConstruct
  public void loadAllVessels() {
    log.info("🚀 VesselManager initializing - loading all vessels...");

    // 首先加载Spring @Component vessel
    var springResult = springVesselLoader.loadSpringVessels();
    log.info("Spring vessel加载结果: {}", springResult);

    // 然后加载JAR文件vessel
    jarVesselLoader.loadJarVessels()
        .whenComplete((jarResult, throwable) -> {
          if (throwable != null) {
            log.error("❌ Failed to load JAR vessels during initialization", throwable);
          } else {
            log.info("JAR vessel加载结果: {}", jarResult);
            log.info("✅ VesselManager initialization completed");
            log.info("📊 Total vessels in registry: {}", vesselRegistry.getVesselNames().size());
          }
        });
  }

  /** 
   * 卸载vessel插件 
   * 自动判断是Spring vessel还是JAR vessel
   */
  public CompletableFuture<Void> unloadVessel(String vesselName) {
    log.info("Unloading vessel: {}", vesselName);
    
    // 尝试从JAR loader卸载，如果不是JAR vessel，则只从registry中移除
    return jarVesselLoader.unloadVessel(vesselName);
  }

  /** 重新加载JAR vessel插件 */
  public CompletableFuture<Void> reloadVessel(String vesselName, Path jarPath) {
    return jarVesselLoader.reloadVessel(vesselName, jarPath);
  }

  /** 关闭所有vessel插件 */
  public CompletableFuture<Void> shutdown() {
    log.info("Shutting down all vessels");
    return jarVesselLoader.shutdown();
  }

}
