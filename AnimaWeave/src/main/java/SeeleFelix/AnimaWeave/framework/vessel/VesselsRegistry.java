package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Vessel注册表 线程安全的vessel插件注册表，使用lombok和Java 21现代化实现
 *
 * <p>简化版本：专注于vessel生命周期管理，移除不必要的接口抽象
 */
@Slf4j
@Component
public class VesselsRegistry {

  private final ConcurrentMap<String, AnimaVessel> vessels = new ConcurrentHashMap<>();

  /** 注册vessel插件 */
  public void register(String vesselName, AnimaVessel vessel) {
    if (vesselName == null || vessel == null) {
      throw new IllegalArgumentException("Vessel name and vessel cannot be null");
    }

    var existing = vessels.put(vesselName, vessel);
    if (existing != null) {
      log.info("Replacing existing vessel: {} with {}", vesselName, vessel.getMetadata().version());
      shutdownVesselSafely(existing, "replaced vessel: " + vesselName);
    } else {
      log.info("Registered new vessel: {} v{}", vesselName, vessel.getMetadata().version());
    }
  }

  /** 注销vessel插件 */
  public void unregister(String vesselName) {
    var vessel = vessels.remove(vesselName);
    if (vessel != null) {
      log.info("Unregistered vessel: {}", vesselName);
      shutdownVesselSafely(vessel, "unregistered vessel: " + vesselName);
    } else {
      log.warn("Attempted to unregister non-existent vessel: {}", vesselName);
    }
  }

  /** 获取指定的vessel插件 */
  public Optional<AnimaVessel> getVessel(String vesselName) {
    return Optional.ofNullable(vessels.get(vesselName));
  }

  /** 获取所有已注册的vessel名称 */
  public List<String> getVesselNames() {
    return List.copyOf(vessels.keySet());
  }

  /** 获取所有已注册的vessel插件 */
  public List<AnimaVessel> getAllVessels() {
    return List.copyOf(vessels.values());
  }

  /** 检查vessel是否已注册 */
  public boolean isRegistered(String vesselName) {
    return vessels.containsKey(vesselName);
  }

  /** 获取所有支持的节点类型 - 用于调试和文档生成 */
  public List<String> getAllSupportedNodeTypes() {
    return vessels.values().stream()
        .flatMap(vessel -> vessel.getSupportedNodes().stream())
        .map(node -> node.nodeType())
        .distinct()
        .sorted()
        .toList();
  }

  /** 安全关闭vessel - 使用Java 21的现代化异常处理 */
  private void shutdownVesselSafely(AnimaVessel vessel, String context) {
    try {
      vessel.shutdown();
      log.debug("Successfully shut down {}", context);
    } catch (Exception e) {
      log.warn("Failed to shutdown {}: {}", context, e.getMessage());
    }
  }
}
