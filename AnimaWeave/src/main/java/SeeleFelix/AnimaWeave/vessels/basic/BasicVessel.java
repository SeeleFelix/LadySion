package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.Node;
import SeeleFelix.AnimaWeave.framework.vessel.*;
import SeeleFelix.AnimaWeave.vessels.basic.labels.BoolLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.NumberLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.StringLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.TimestampLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.UUIDLabel;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Basic Vessel - 基础容器实现 提供基础数据类型和基本操作节点
 *
 * <p>使用Spring依赖注入，不需要通过VesselContext传递依赖 对应 basic.anima 文件中的定义
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BasicVessel implements AnimaVessel {

  @Override
  public VesselMetadata getMetadata() {
    return new VesselMetadata(
        "basic", "1.0.0", "提供基础数据类型和基本操作节点的核心容器", "SeeleFelix", List.of(), "1.0.0");
  }

  @Override
  public List<Class<? extends Node>> getSupportedNodeTypes() {
    return List.of(StartNode.class, IsEvenNode.class, GetTimestampNode.class);
  }

  @Override
  public List<Class<? extends SemanticLabel>> getSupportedLabelTypes() {
    return List.of(
        SignalLabel.class, 
        NumberLabel.class, 
        BoolLabel.class, 
        StringLabel.class, 
        TimestampLabel.class, 
        UUIDLabel.class
    );
  }

  @Override
  public void initialize(VesselsContext context) {
    log.info("🔌 初始化Basic容器 v{}", getMetadata().version());
  }

  @Override
  public void shutdown() {
    log.info("🔌 关闭Basic容器");
  }

  // ========== 辅助方法 ==========

  private Function<Object, Object> createStringConverter() {
    return value -> {
      if (value instanceof Number || value instanceof Boolean) {
        return String.valueOf(value);
      }
      return value;
    };
  }

  // ========== 内部数据类型 ==========

  /** Prompt数据类型 */
  public record PromptData(String id, String name, String content) {
    public static PromptData of(String name, String content) {
      return new PromptData(UUID.randomUUID().toString(), name, content);
    }
  }
}
