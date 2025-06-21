package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;
import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** 
 * Vessel上下文
 * 为vessel插件提供框架服务的数据容器
 * 
 * <p>简化版本：移除接口抽象，直接作为数据类使用
 */
@Getter
public class VesselsContext {

  private static final Logger logger = LoggerFactory.getLogger(VesselsContext.class);

  private final EventDispatcher eventDispatcher;
  private final VesselsRegistry vesselRegistry;
  private final String vesselName;
  private final String workingDirectory;
  private final String tempDirectory;

  public VesselsContext(
      EventDispatcher eventDispatcher,
      VesselsRegistry vesselRegistry,
      String vesselName,
      String baseDirectory) {
    this.eventDispatcher = eventDispatcher;
    this.vesselRegistry = vesselRegistry;
    this.vesselName = vesselName;
    this.workingDirectory = Paths.get(baseDirectory, vesselName).toString();
    this.tempDirectory =
        Paths.get(System.getProperty("java.io.tmpdir"), "animaweave", vesselName).toString();

    // 确保目录存在
    createDirectoriesIfNeeded();
  }

  /** 获取配置属性 */
  public String getProperty(String key) {
    return System.getProperty(key);
  }

  /** 获取配置属性，带默认值 */
  public String getProperty(String key, String defaultValue) {
    return System.getProperty(key, defaultValue);
  }

  /** 记录日志 */
  public void log(String level, String message) {
    switch (level.toUpperCase()) {
      case "DEBUG" -> logger.debug("[{}] {}", vesselName, message);
      case "INFO" -> logger.info("[{}] {}", vesselName, message);
      case "WARN" -> logger.warn("[{}] {}", vesselName, message);
      case "ERROR" -> logger.error("[{}] {}", vesselName, message);
      default -> logger.info("[{}] {}", vesselName, message);
    }
  }

  /** 记录日志（默认INFO级别） */
  public void log(String message) {
    log("INFO", message);
  }

  /** 确保目录存在 */
  private void createDirectoriesIfNeeded() {
    try {
      var workingPath = Paths.get(workingDirectory);
      var tempPath = Paths.get(tempDirectory);

      if (!workingPath.toFile().exists()) {
        workingPath.toFile().mkdirs();
        logger.debug("Created working directory: {}", workingDirectory);
      }

      if (!tempPath.toFile().exists()) {
        tempPath.toFile().mkdirs();
        logger.debug("Created temp directory: {}", tempDirectory);
      }
    } catch (Exception e) {
      logger.warn("Failed to create directories for vessel: {}", vesselName, e);
    }
  }
}

