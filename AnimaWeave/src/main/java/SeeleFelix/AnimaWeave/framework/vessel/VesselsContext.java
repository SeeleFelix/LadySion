package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;
import java.nio.file.Paths;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Vessel上下文 - 为vessel插件和图验证提供框架服务
 *
 * <p>作为Spring Bean提供统一的vessel服务接口
 */
@Component
@RequiredArgsConstructor
public class VesselsContext {

  private static final Logger logger = LoggerFactory.getLogger(VesselsContext.class);

  private final EventDispatcher eventDispatcher;
  private final VesselsRegistry vesselRegistry;
  
  @Value("${animaweave.vessels.directory:./vessels}")
  private String baseDirectory;

  // ========== 对外统一服务接口 ==========
  
  /**
   * 检查节点类型是否可用
   * 
   * @param nodeType 节点类型，必须是qualified name格式如 "basic.Start"
   */
  public ValidationResult validateNodeType(String nodeType) {
    // 按照DSL语法，节点类型必须是qualifiedName格式，即必须包含点号
    if (!nodeType.contains(".")) {
      return ValidationResult.unavailable(nodeType, 
          "Invalid node type format. According to DSL grammar, node type must be a qualified name (e.g., 'basic.Start')");
    }
    
    // 解析节点类型：basic.Start -> vessel="basic", node="Start"
    String[] parts = nodeType.split("\\.", 2); // 只分割第一个点
    String vesselName = parts[0];
    String nodeName = parts[1];
    
    // 1. 先检查vessel是否存在 - 优雅的设计
    if (!vesselRegistry.isRegistered(vesselName)) {
      return ValidationResult.unavailable(nodeType, 
          "Vessel '" + vesselName + "' is not registered");
    }
    
    // 2. 让vessel自己判断是否支持该节点 - 更优雅的设计
    return vesselRegistry.getVessel(vesselName)
        .map(v -> {
          if (v.hasNode(nodeName)) {
            return ValidationResult.available(nodeType);
          } else {
            return ValidationResult.unavailable(nodeType,
                String.format("Node '%s' not found in vessel '%s'", nodeName, vesselName));
          }
        })
        .orElse(ValidationResult.unavailable(nodeType, 
            String.format("Vessel '%s' exists but cannot be loaded", vesselName)));
  
  }
  
  /**
   * 检查节点类型是否可用
   */
  public boolean isNodeTypeAvailable(String nodeClassName) {
    return vesselRegistry.isNodeTypeAvailable(nodeClassName);
  }
  
  /**
   * 获取所有可用的节点类型
   */
  public java.util.Set<String> getAvailableNodeTypes() {
    return vesselRegistry.getAvailableNodeTypes();
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
      case "DEBUG" -> logger.debug("{}", message);
      case "INFO" -> logger.info("{}", message);
      case "WARN" -> logger.warn("{}", message);
      case "ERROR" -> logger.error("{}", message);
      default -> logger.info("{}", message);
    }
  }

  /** 记录日志（默认INFO级别） */
  public void log(String message) {
    log("INFO", message);
  }

  /** 获取工作目录 */
  public String getWorkingDirectory() {
    return baseDirectory;
  }

  /** 获取临时目录 */
  public String getTempDirectory() {
    return Paths.get(System.getProperty("java.io.tmpdir"), "animaweave").toString();
  }
}
