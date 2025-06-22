package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.graph.GraphDefinition;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Vessel注册表 - 简化版本
 * 系统启动时一次性构建，之后只读
 * 不支持动态加载/卸载，更新需要重启
 */
@Slf4j
@Component
public class VesselsRegistry {

  private final Map<String, AnimaVessel> vessels = new HashMap<>();
  
  // 节点类型索引 - 启动时构建，之后只读
  private final Map<String, String> nodeTypeIndex = new HashMap<>(); // nodeClassName -> vesselName
  private final Set<String> availableNodeTypes = new HashSet<>();
  
  // 标记是否已经初始化完成
  private boolean initialized = false;

  /** 注册vessel插件 - 只在系统启动时调用 */
  public void register(String vesselName, AnimaVessel vessel) {
    if (initialized) {
      throw new IllegalStateException("VesselsRegistry已初始化完成，不支持动态注册");
    }
    
    if (vesselName == null || vessel == null) {
      throw new IllegalArgumentException("Vessel name and vessel cannot be null");
    }

    if (vessels.containsKey(vesselName)) {
      throw new IllegalArgumentException("Vessel已存在: " + vesselName);
    }
    
    vessels.put(vesselName, vessel);
    log.info("注册vessel: {} v{}", vesselName, vessel.getMetadata().version());
  }

  /** 完成初始化 - 构建索引并设为只读 */
  public void finishInitialization() {
    if (initialized) {
      log.warn("VesselsRegistry已经初始化过了");
      return;
    }
    
    log.info("🔨 开始构建vessel索引...");
    
    // 构建节点类型索引
    vessels.forEach((vesselName, vessel) -> {
      try {
        vessel.getSupportedNodeTypes().forEach(nodeClass -> {
          String nodeClassName = nodeClass.getSimpleName();
          
          if (nodeTypeIndex.containsKey(nodeClassName)) {
            String existingVessel = nodeTypeIndex.get(nodeClassName);
            throw new IllegalStateException(
                String.format("节点类型冲突: %s 同时存在于 vessel %s 和 %s", 
                    nodeClassName, existingVessel, vesselName));
          }
          
          nodeTypeIndex.put(nodeClassName, vesselName);
          availableNodeTypes.add(nodeClassName);
          log.debug("索引节点类型: {} -> {}", nodeClassName, vesselName);
        });
        
        log.info("为vessel {} 索引了 {} 个节点类型", vesselName, vessel.getSupportedNodeTypes().size());
      } catch (Exception e) {
        log.error("为vessel {} 构建节点索引时失败", vesselName, e);
        throw new RuntimeException("构建vessel索引失败", e);
      }
    });
    
    initialized = true;
    log.info("✅ VesselsRegistry初始化完成，共 {} 个vessel，{} 个节点类型", 
        vessels.size(), availableNodeTypes.size());
    log.debug("可用节点类型: {}", availableNodeTypes);
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
  
  // ========== 节点类型查询 - 高性能只读操作 ==========
  
  /**
   * 检查节点类型是否存在（O(1)查询）
   */
  public boolean isNodeTypeAvailable(String nodeClassName) {
    ensureInitialized();
    return availableNodeTypes.contains(nodeClassName);
  }
  
  /**
   * 获取节点类型所属的vessel名称
   */
  public Optional<String> getVesselForNodeType(String nodeClassName) {
    ensureInitialized();
    return Optional.ofNullable(nodeTypeIndex.get(nodeClassName));
  }
  
  /**
   * 获取所有可用的节点类型名称
   */
  public Set<String> getAvailableNodeTypes() {
    ensureInitialized();
    return Set.copyOf(availableNodeTypes);
  }
  
  /**
   * 查找相似的节点类型（用于错误提示）
   */
  public List<String> findSimilarNodeTypes(String nodeClassName) {
    ensureInitialized();
    String lowerQuery = nodeClassName.toLowerCase();
    return availableNodeTypes.stream()
        .filter(nodeType -> {
          String lowerNodeType = nodeType.toLowerCase();
          return lowerNodeType.contains(lowerQuery) || lowerQuery.contains(lowerNodeType);
        })
        .sorted()
        .limit(5)
        .toList();
  }


  
  private void ensureInitialized() {
    if (!initialized) {
      throw new IllegalStateException("VesselsRegistry尚未初始化完成");
    }
  }
  

}
