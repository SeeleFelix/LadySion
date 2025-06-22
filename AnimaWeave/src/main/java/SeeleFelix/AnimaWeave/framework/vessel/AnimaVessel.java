package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.node.Node;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;

/** AnimaWeave Vessel接口 */
public interface AnimaVessel {

  /** 获取vessel元数据 */
  VesselMetadata getMetadata();

  /** 获取支持的语义标签类列表 */
  List<Class<? extends SemanticLabel>> getSupportedLabelTypes();

  /**
   * 获取支持的Node类列表
   *
   * @return Node类列表
   */
  List<Class<? extends Node>> getSupportedNodeTypes();

  /**
   * 检查是否支持指定的节点类型
   * 
   * @param nodeType 节点类型名称，如 "Start"
   * @return 是否支持该节点类型
   */
  default boolean hasNode(String nodeType) {
    return getSupportedNodeTypes().stream()
        .anyMatch(nodeClass -> {
          String className = nodeClass.getSimpleName();
          
          if (className.equals(nodeType)) {
            return true;
          }
          
          if (className.endsWith("Node")) {
            String nodeNameWithoutSuffix = className.substring(0, className.length() - 4);
            if (nodeNameWithoutSuffix.equals(nodeType)) {
              return true;
            }
          }
          
          return false;
        });
  }

  /** 从Node类推导出NodeDefinition列表 这是默认实现，通过创建Node实例来获取端口信息 */
  default List<NodeDefinition> getSupportedNodes() {
    return getSupportedNodeTypes().stream().map(this::createNodeDefinitionFromClass).toList();
  }

  /** 从Node类创建NodeDefinition */
  default NodeDefinition createNodeDefinitionFromClass(Class<? extends Node> nodeClass) {
    try {
      // 创建Node实例来获取端口信息
      Node nodeInstance = createNodeInstance(nodeClass);

      return new NodeDefinition(
          nodeInstance.getNodeType(),
          nodeInstance.getDisplayName(),
          nodeInstance.getDescription(),
          nodeInstance.getInputPorts(),
          nodeInstance.getOutputPorts());
    } catch (Exception e) {
      throw new RuntimeException(
          "Failed to create NodeDefinition from " + nodeClass.getSimpleName(), e);
    }
  }

  /** 创建Node实例的辅助方法 */
  default Node createNodeInstance(Class<? extends Node> nodeClass) throws Exception {
    try {
      // 尝试使用带ApplicationEventPublisher参数的构造函数
      var constructor = nodeClass.getConstructor(ApplicationEventPublisher.class);
      // 创建一个简单的事件发布器用于获取端口信息
      ApplicationEventPublisher mockPublisher = event -> {};
      return constructor.newInstance(mockPublisher);
    } catch (NoSuchMethodException e) {
      // 尝试使用默认构造函数
      var constructor = nodeClass.getConstructor();
      return constructor.newInstance();
    }
  }

  /** 初始化vessel */
  void initialize(VesselsContext context);

  /** 关闭vessel，释放资源 */
  default void shutdown() {
    // 默认无需特殊关闭逻辑
  }

  /** 根据标签名称获取语义标签定义 - 通用辅助方法 */
  default SemanticLabel getLabel(String labelName) {
    return getSupportedLabelTypes().stream()
        .map(
            labelClass -> {
              try {
                // 尝试调用getInstance()方法获取单例
                var getInstanceMethod = labelClass.getMethod("getInstance");
                return (SemanticLabel) getInstanceMethod.invoke(null);
              } catch (Exception e) {
                try {
                  // 如果没有getInstance方法，尝试使用默认构造函数
                  return labelClass.getDeclaredConstructor().newInstance();
                } catch (Exception ex) {
                  throw new RuntimeException(
                      "Failed to create instance of " + labelClass.getSimpleName(), ex);
                }
              }
            })
        .filter(label -> label.getLabelName().equals(labelName))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unknown label: " + labelName));
  }
}
