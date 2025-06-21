package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Vessel上下文实现 为vessel插件提供框架服务 */
public class VesselContextImpl implements VesselContext {

  private static final Logger logger = LoggerFactory.getLogger(VesselContextImpl.class);

  private final EventDispatcher eventDispatcher;
  private final VesselRegistry vesselRegistry;
  private final String vesselName;
  private final String workingDirectory;
  private final String tempDirectory;

  public VesselContextImpl(
      EventDispatcher eventDispatcher,
      VesselRegistry vesselRegistry,
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

  @Override
  public EventDispatcher getEventDispatcher() {
    return eventDispatcher;
  }

  @Override
  public VesselRegistry getVesselRegistry() {
    return vesselRegistry;
  }

  @Override
  public String getProperty(String key) {
    return System.getProperty(key);
  }

  @Override
  public String getProperty(String key, String defaultValue) {
    return System.getProperty(key, defaultValue);
  }

  @Override
  public void log(String level, String message) {
    String logMessage = String.format("[%s] %s", vesselName, message);

    switch (level.toUpperCase(java.util.Locale.ROOT)) {
      case "TRACE" -> logger.trace(logMessage);
      case "DEBUG" -> logger.debug(logMessage);
      case "INFO", "INFORMATION" -> logger.info(logMessage);
      case "WARN", "WARNING" -> logger.warn(logMessage);
      case "ERROR" -> logger.error(logMessage);
      default -> logger.info(logMessage);
    }
  }

  @Override
  public String getWorkingDirectory() {
    return workingDirectory;
  }

  @Override
  public String getTempDirectory() {
    return tempDirectory;
  }

  /** 创建必要的目录 */
  private void createDirectoriesIfNeeded() {
    try {
      Path workDir = Paths.get(workingDirectory);
      Path tempDir = Paths.get(tempDirectory);

      if (!workDir.toFile().exists()) {
        boolean workDirCreated = workDir.toFile().mkdirs();
        if (!workDirCreated) {
          logger.warn("Failed to create working directory: {}", workingDirectory);
        }
      }

      if (!tempDir.toFile().exists()) {
        boolean tempDirCreated = tempDir.toFile().mkdirs();
        if (!tempDirCreated) {
          logger.warn("Failed to create temp directory: {}", tempDirectory);
        }
      }
    } catch (Exception e) {
      logger.warn("Failed to create directories for vessel: {}", vesselName, e);
    }
  }
}
