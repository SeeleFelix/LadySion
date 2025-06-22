package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.UUID;
import java.util.function.Function;

/** UUID语义标签 - Basic Vessel定义 继承SemanticLabel抽象类，天然不可变，承载UUID值 标签名称自动从类名推导为"UUID" */
public class UUIDLabel extends SemanticLabel<UUID> {

  /** 静态转换函数 - 复用同一个实例，提高性能 */
  private static final Function<Object, UUID> CONVERTER =
      value -> {
        if (value == null) return null;
        if (value instanceof UUID) return (UUID) value;
        if (value instanceof String) {
          try {
            return UUID.fromString((String) value);
          } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("无法将字符串 '" + value + "' 转换为UUID", e);
          }
        }
        throw new IllegalArgumentException(
            "无法将类型 " + value.getClass().getSimpleName() + " 转换为UUID");
      };

  /** 创建带值的UUIDLabel */
  public UUIDLabel(UUID value) {
    super(value);
  }

  /** 创建空值的UUIDLabel（用于端口定义等场景） */
  public UUIDLabel() {
    this(null);
  }



  // 移除旧的getConverter方法，现在使用@Converter注解

  /** 便利工厂方法 - 创建带值的UUIDLabel */
  public static UUIDLabel of(UUID value) {
    return new UUIDLabel(value);
  }

  /** 便利工厂方法 - 创建随机UUID的UUIDLabel */
  public static UUIDLabel random() {
    return new UUIDLabel(UUID.randomUUID());
  }

  /** 便利工厂方法 - 从字符串创建UUIDLabel */
  public static UUIDLabel fromString(String uuidString) {
    return new UUIDLabel(UUID.fromString(uuidString));
  }

  /** 便利工厂方法 - 创建空UUIDLabel */
  public static UUIDLabel empty() {
    return new UUIDLabel(null);
  }
}
