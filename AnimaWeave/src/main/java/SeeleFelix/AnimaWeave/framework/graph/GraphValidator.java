package SeeleFelix.AnimaWeave.framework.graph;

import SeeleFelix.AnimaWeave.framework.vessel.VesselsContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 图验证器 - 负责图定义的静态验证
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GraphValidator {

  private final VesselsContext vesselsContext;

  /**
   * 验证图中所有节点类型是否可用
   * 
   * @param graphDefinition 图定义
   * @return 验证错误信息，null表示验证通过
   */
  public String validateNodeTypes(GraphDefinition graphDefinition) {
    log.debug("🔍 Validating node types for graph: {}", graphDefinition.getName());
    
    for (var entry : graphDefinition.getNodeInstances().entrySet()) {
      String instanceName = entry.getKey();
      String nodeType = entry.getValue();
      
      var validationResult = vesselsContext.validateNodeType(nodeType);
      if (!validationResult.isAvailable()) {
        String error = String.format("节点类型 '%s' (实例 '%s') 不可用: %s", 
            nodeType, instanceName, validationResult.errorMessage());
        log.error("❌ {}", error);
        return error;
      }
      
      log.debug("✅ 节点验证通过: {} -> {}", instanceName, nodeType);
    }
    
    log.info("✅ 图定义验证通过: '{}' 中的 {} 个节点都可用", 
        graphDefinition.getName(), graphDefinition.getNodeInstances().size());
    return null;
  }

  /**
   * 验证图的完整性（可扩展更多验证规则）
   * 
   * @param graphDefinition 图定义
   * @return 验证错误信息，null表示验证通过
   */
  public String validateGraph(GraphDefinition graphDefinition) {
    String nodeTypesError = validateNodeTypes(graphDefinition);
    if (nodeTypesError != null) {
      return nodeTypesError;
    }
    
    return null;
  }
} 