package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.vessel.AnimaVessel;
import SeeleFelix.AnimaWeave.framework.vessel.NodeDefinition;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

/**
 * NodeInstance工厂
 *
 * <p>职责： 1. 根据vessel提供的NodeDefinition创建NodeInstance 2. 将NodeInstance动态注册到Spring容器 3.
 * 确保每个节点类型都有对应的监听器
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NodeFactory {

  private final ApplicationContext applicationContext;
  private final ApplicationEventPublisher eventPublisher;

  /** 为vessel的所有节点类型创建NodeInstance */
  public void createNodeInstancesForVessel(AnimaVessel vessel) {
    var vesselName = vessel.getMetadata().name();
    log.info("Creating NodeInstances for vessel: {}", vesselName);

    for (NodeDefinition nodeDef : vessel.getSupportedNodes()) {
      try {
        createAndRegisterNodeInstance(vesselName, nodeDef);
      } catch (Exception e) {
        log.error(
            "Failed to create NodeInstance for node type: {} in vessel: {}",
            nodeDef.nodeType(),
            vesselName,
            e);
      }
    }
  }

  /** 创建并注册单个NodeInstance */
  private void createAndRegisterNodeInstance(String vesselName, NodeDefinition nodeDef) {
    var nodeType = nodeDef.nodeType();
    var beanName = generateBeanName(vesselName, nodeType);

    // 创建NodeInstance（这里先创建一个通用的实现）
    var nodeInstance = new GenericNode(beanName, nodeType, eventPublisher, nodeDef);

    // 动态注册到Spring容器
    var beanFactory = ((ConfigurableApplicationContext) applicationContext).getBeanFactory();
    beanFactory.registerSingleton(beanName, nodeInstance);

    log.debug("Registered NodeInstance: {} for node type: {}", beanName, nodeType);
  }

  /** 生成Bean名称 */
  private String generateBeanName(String vesselName, String nodeType) {
    return "%s_%s_NodeInstance".formatted(vesselName, nodeType);
  }

  /** 通用NodeInstance实现 这是一个适配器，将NodeDefinition的静态定义转换为可执行的实例 */
  public static class GenericNode extends Node {

    private final NodeDefinition nodeDefinition;

    public GenericNode(
        String nodeName,
        String nodeType,
        ApplicationEventPublisher eventPublisher,
        NodeDefinition nodeDefinition) {
      super(nodeName, nodeType, eventPublisher);
      this.nodeDefinition = nodeDefinition;
    }

    @Override
    protected Map<String, Object> executeNode(Map<String, Object> inputs) {
      // TODO: 这里需要根据nodeDefinition来执行实际的计算逻辑
      // 现在先返回一个简单的示例实现

      log.debug("Executing generic node: {} with inputs: {}", getNodeType(), inputs.keySet());

      // 简单的示例逻辑：将所有输入值加1（仅用于演示）
      var result =
          inputs.values().stream()
                  .filter(v -> v instanceof Number)
                  .mapToDouble(v -> ((Number) v).doubleValue())
                  .sum()
              + 1.0;

      var outputs = Map.<String, Object>of("result", result);

      log.debug("Generic node {} produced outputs: {}", getNodeType(), outputs);
      return outputs;
    }

    public NodeDefinition getNodeDefinition() {
      return nodeDefinition;
    }
  }
}
