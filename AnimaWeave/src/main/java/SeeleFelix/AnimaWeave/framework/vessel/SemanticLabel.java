package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Objects;

/**
 * 语义标签实例 - 包含类型定义和实际值
 * 这是运行时使用的语义标签实例，包含具体的数据
 */
public record SemanticLabel(
    SemanticLabelDefinition definition,
    Object value) {

  public SemanticLabel {
    Objects.requireNonNull(definition, "语义标签定义不能为空");
    // 值可以为null，代表空值或未初始化状态
  }



  /** 获取语义标签名称 */
  public String labelName() {
    return definition.labelName();
  }

  /** 检查是否有值 */
  public boolean hasValue() {
    return value != null;
  }

  /** 检查是否为空值 */
  public boolean isEmpty() {
    return value == null;
  }

  /** 检查是否与另一个语义标签兼容 */
  public boolean isCompatibleWith(SemanticLabel other) {
    return definition.isCompatibleWith(other.labelName());
  }

  /** 检查是否与指定类型兼容 */
  public boolean isCompatibleWith(String labelName) {
    return definition.isCompatibleWith(labelName);
  }

  /** 应用转换器进行类型转换 */
  public SemanticLabel convertTo(SemanticLabelDefinition targetDefinition) {
    if (!isCompatibleWith(targetDefinition.labelName())) {
      throw new IllegalArgumentException(
          String.format("语义标签 %s 不兼容目标类型 %s", labelName(), targetDefinition.labelName()));
    }
    Object convertedValue = definition.convert(value);
    return new SemanticLabel(targetDefinition, convertedValue);
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
    return String.format("%s(%s)", labelName(), value);
  }
} 