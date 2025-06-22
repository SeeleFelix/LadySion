package SeeleFelix.AnimaWeave.framework.vessel;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Vessel插件管理器 - 负责Spring vessel的加载和管理 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VesselsManager {

  private final SpringVesselLoader springVesselLoader;
  private final VesselsRegistry vesselRegistry;

  /** Spring启动时自动加载所有vessel */
  @PostConstruct
  public void loadAllVessels() {
    log.info("🚀 VesselManager initializing - loading Spring vessels...");

    // 加载Spring @Component vessel
    var springResult = springVesselLoader.loadSpringVessels();
    log.info("Spring vessel加载结果: {}", springResult);
    
    // 完成初始化
    vesselRegistry.finishInitialization();
    
    log.info("✅ VesselManager initialization completed");
    log.info("📊 Total vessels in registry: {}", vesselRegistry.getVesselNames().size());
  }
}
