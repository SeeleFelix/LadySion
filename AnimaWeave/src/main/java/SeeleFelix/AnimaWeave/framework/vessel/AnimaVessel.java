package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;

/** AnimaWeave Vessel插件核心接口 所有vessel插件都必须实现此接口 */
public interface AnimaVessel {

  /** 获取插件元数据 */
  VesselMetadata getMetadata();

  /** 获取支持的语义标签定义 */
  List<SemanticLabelDefinition> getSupportedLabels();

  /** 获取支持的节点类型定义 */
  List<NodeDefinition> getSupportedNodes();

  /**
   * 插件初始化
   *
   * @param context vessel上下文，提供框架服务
   */
  void initialize(VesselContext context);

  /** 插件关闭 */
  void shutdown();

  /** 获取插件状态 */
  VesselStatus getStatus();

  /** 插件健康检查 */
  default boolean isHealthy() {
    return getStatus() == VesselStatus.RUNNING;
  }
}
