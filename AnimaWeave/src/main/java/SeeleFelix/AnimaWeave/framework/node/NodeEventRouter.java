package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import jakarta.annotation.PostConstruct;
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
      String nodeType = node.getNodeType();
      nodeMap.put(nodeType, node);
      log.debug("已注册Node: nodeType={}, class={}", nodeType, node.getClass().getSimpleName());
    }

    log.info("Node注册完成，共注册{}个类型: {}", nodeMap.size(), nodeMap.keySet());
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

    // 调用Node的模板方法执行，传递执行ID
    node.executeWithTemplate(
        request.getNodeId(),
        request.getInputs(),
        request.getExecutionContextId(),
        request.getNodeExecutionId());
  }

  /** 获取已注册的节点类型 */
  public Map<String, Node> getRegisteredNodeTypes() {
    return Map.copyOf(nodeMap);
  }

  /** 手动注册Node（用于测试或动态注册） */
  public void registerNode(Node node) {
    String nodeType = node.getNodeType();
    nodeMap.put(nodeType, node);
    log.info("手动注册Node: nodeType={}, class={}", nodeType, node.getClass().getSimpleName());
  }
}
