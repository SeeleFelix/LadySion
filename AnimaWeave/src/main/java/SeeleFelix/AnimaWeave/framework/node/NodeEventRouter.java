package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import SeeleFelix.AnimaWeave.framework.vessel.AnimaVessel;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 节点事件路由器 - 智能路由执行请求
 *
 * <p>功能： - 自动注册所有Node实现 - 接收NodeExecutionRequest事件 - 根据nodeType路由到对应的Node实例 - 无需SpEL条件，直接O(1)查找
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NodeEventRouter {

  private final List<Node> nodes;
  private final Map<String, Node> nodeMap = new ConcurrentHashMap<>();

  /** 系统启动时自动注册所有Node实现 */
  @PostConstruct
  public void registerAllNodes() {
    log.info("开始注册Node实现...");

    for (Node node : nodes) {
      String nodeType = node.getNodeType(); // 例如: "Start"
      String vesselName = extractVesselName(node.getClass()); // 例如: "basic"
      String fullNodeType = vesselName + "." + nodeType; // 例如: "basic.Start"
      
      nodeMap.put(fullNodeType, node);
      log.debug("已注册Node: nodeType={}, class={}", fullNodeType, node.getClass().getSimpleName());
    }

    log.info("Node注册完成，共注册{}个类型: {}", nodeMap.size(), nodeMap.keySet());
  }

  /** 从Node类的包名中提取vessel名称 */
  private String extractVesselName(Class<? extends Node> nodeClass) {
    String packageName = nodeClass.getPackageName();
    // SeeleFelix.AnimaWeave.vessels.basic.StartNode -> basic
    if (packageName.startsWith("SeeleFelix.AnimaWeave.vessels.")) {
      String vesselPart = packageName.substring("SeeleFelix.AnimaWeave.vessels.".length());
      // 取第一个点之前的部分作为vessel名，如果没有点就取全部
      int dotIndex = vesselPart.indexOf('.');
      return dotIndex > 0 ? vesselPart.substring(0, dotIndex) : vesselPart;
    }
    return "unknown"; // 默认值
  }

  /** 处理节点执行请求 - 无需SpEL条件 直接根据nodeType进行O(1)路由 */
  @EventListener
  @Async("virtualThreadExecutor")
  public void routeExecution(NodeExecutionRequest request) {
    String nodeType = request.getNodeType();
    String nodeId = request.getNodeId();

    log.debug("收到节点执行请求: nodeId={}, nodeType={}", nodeId, nodeType);

    // O(1)查找对应的Node
    Node node = nodeMap.get(nodeType);

    if (node == null) {
      log.error("未找到Node实现: nodeType={}, 可用类型: {}", nodeType, nodeMap.keySet());
      return; 
    }

    // 转换输入类型：Object -> SemanticLabel
    Map<String, SemanticLabel<?>> semanticInputs = new HashMap<>();
    request
        .getInputs()
        .forEach(
            (key, value) -> {
              if (value instanceof SemanticLabel<?> label) {
                semanticInputs.put(key, label);
              } else {
                log.warn(
                    "Expected SemanticLabel but got {} for input {}",
                    value != null ? value.getClass().getSimpleName() : "null",
                    key);
              }
            });

    // 调用Node的模板方法执行，传递执行ID
    node.executeWithTemplate(
        request.getNodeId(),
        semanticInputs,
        request.getExecutionContextId(),
        request.getNodeExecutionId());
  }

  /** 获取已注册的节点类型 */
  public Map<String, Node> getRegisteredNodeTypes() {
    return Map.copyOf(nodeMap);
  }
}
