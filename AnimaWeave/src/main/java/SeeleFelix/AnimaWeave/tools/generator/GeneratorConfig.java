package SeeleFelix.AnimaWeave.tools.generator;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.regex.Pattern;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** 文件生成器配置 支持配置文件和命令行参数 */
@Data
@Slf4j
@Component
@ConfigurationProperties(prefix = "anima.generator")
public class GeneratorConfig {

  private static final Pattern VESSEL_NAME_PATTERN = Pattern.compile("(.+)Vessel$");

  /** 输出目录，默认为项目根目录下的sanctums */
  private String outputDirectory = "sanctums";

  /** 生成文件名后缀，默认为空（无后缀） */
  private String generatedFileSuffix = "";

  /** 文件扩展名 */
  private String fileExtension = ".anima";

  /** 是否覆盖现有文件 */
  private boolean overwriteExisting = true;

  /** 是否验证生成的文件 */
  private boolean validateAfterGeneration = true;

  /** 是否生成详细日志 */
  private boolean verboseLogging = false;

  /** 从Vessel类名动态提取容器名称 BasicVessel -> basic MathVessel -> math OpenRouterVessel -> openrouter */
  public String extractContainerName(String vesselClassName) {
    var matcher = VESSEL_NAME_PATTERN.matcher(vesselClassName);
    if (matcher.matches()) {
      return matcher.group(1).toLowerCase();
    }

    // 降级处理：直接转小写并移除"vessel"后缀（如果存在）
    var name = vesselClassName.toLowerCase();
    if (name.endsWith("vessel")) {
      name = name.substring(0, name.length() - 6);
    }

    log.warn("无法从类名 {} 提取容器名称，使用降级策略: {}", vesselClassName, name);
    return name;
  }

  /** 从Vessel实例提取容器名称 */
  public String extractContainerName(Object vessel) {
    return extractContainerName(vessel.getClass().getSimpleName());
  }

  /** 获取输出目录的Path对象 */
  public Path getOutputDirectoryPath() {
    return Paths.get("").toAbsolutePath().resolve(outputDirectory);
  }

  /** 获取生成文件的完整路径 */
  public Path getOutputPath(String containerName) {
    var fileName = containerName + generatedFileSuffix + fileExtension;
    return getOutputDirectoryPath().resolve(fileName);
  }

  /** 获取生成文件的完整路径（从vessel实例） */
  public Path getOutputPath(Object vessel) {
    var containerName = extractContainerName(vessel);
    return getOutputPath(containerName);
  }

  /** 创建默认配置（用于独立运行） */
  public static GeneratorConfig defaultConfig() {
    return new GeneratorConfig();
  }

  /** 创建测试配置 */
  public static GeneratorConfig testConfig(Path tempDir) {
    var config = new GeneratorConfig();
    config.setOutputDirectory(tempDir.toString());
    config.setValidateAfterGeneration(true);
    config.setVerboseLogging(true);
    return config;
  }
}
