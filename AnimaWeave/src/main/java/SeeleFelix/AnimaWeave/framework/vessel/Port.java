package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Objects;

/**
 * 端口 - 包含名字、语义标签定义和实际值
 * 这是运行时使用的端口实例，包含端口名称、类型定义和具体的数据
 */
public record Port(
    String name,
    SemanticLabelDefinition semanticLabel,
    Object value) {

  public Port {
    Objects.requireNonNull(name, "端口名称不能为空");
    Objects.requireNonNull(semanticLabel, "语义标签定义不能为空");
    // 值可以为null，代表空值或未初始化状态
  }



  /** 获取语义标签名称 */
  public String labelName() {
    return semanticLabel.labelName();
  }

  /** 检查是否有值 */
  public boolean hasValue() {
    return value != null;
  }

  /** 检查是否为空值 */
  public boolean isEmpty() {
    return value == null;
  }

  /** 检查是否与另一个端口兼容 */
  public boolean isCompatibleWith(Port other) {
    return semanticLabel.isCompatibleWith(other.labelName());
  }

  /** 检查是否与指定类型兼容 */
  public boolean isCompatibleWith(String labelName) {
    return semanticLabel.isCompatibleWith(labelName);
  }

  /** 应用转换器进行类型转换 */
  public Port convertTo(SemanticLabelDefinition targetDefinition) {
    if (!isCompatibleWith(targetDefinition.labelName())) {
      throw new IllegalArgumentException(
          String.format("端口 %s 的语义标签 %s 不兼容目标类型 %s", name, labelName(), targetDefinition.labelName()));
    }
    Object convertedValue = semanticLabel.convert(value);
    return new Port(name, targetDefinition, convertedValue);
  }

  /** 获取值的字符串表示 */
  public String getValueAsString() {
    return value != null ? value.toString() : "";
  }

  /** 尝试获取值作为指定类型 */
  @SuppressWarnings("unchecked")
  public <T> T getValueAs(Class<T> type) {
    if (value == null) {
      return null;
    }
    if (type.isInstance(value)) {
      return (T) value;
    }
    throw new IllegalArgumentException(
        String.format("无法将值 %s 转换为类型 %s", value, type.getSimpleName()));
  }

  @Override
  public String toString() {
    return String.format("%s[%s](%s)", name, labelName(), value);
  }
} 