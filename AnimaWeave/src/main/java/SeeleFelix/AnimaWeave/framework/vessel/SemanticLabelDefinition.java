package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;
import java.util.function.Function;

/** 语义标签定义 使用Java 21 record实现 */
public record SemanticLabelDefinition(
    String labelName,
    Class<?> javaType,
    List<String> compatibleLabels,
    Function<Object, Object> converter) {

  /** 创建基础语义标签（无转换器） */
  public static SemanticLabelDefinition of(String labelName, Class<?> javaType) {
    return new SemanticLabelDefinition(labelName, javaType, List.of(), Function.identity());
  }

  /** 创建带兼容标签的语义标签 */
  public static SemanticLabelDefinition of(
      String labelName, Class<?> javaType, List<String> compatibleLabels) {
    return new SemanticLabelDefinition(labelName, javaType, compatibleLabels, Function.identity());
  }

  /** 创建带转换器的语义标签 */
  public static SemanticLabelDefinition of(
      String labelName,
      Class<?> javaType,
      List<String> compatibleLabels,
      Function<Object, Object> converter) {
    return new SemanticLabelDefinition(labelName, javaType, compatibleLabels, converter);
  }

  /** 检查是否与另一个标签兼容 */
  public boolean isCompatibleWith(String otherLabel) {
    return labelName.equals(otherLabel) || compatibleLabels.contains(otherLabel);
  }

  /** 检查Java类型是否匹配 */
  public boolean isTypeCompatible(Object value) {
    return value == null || javaType.isInstance(value);
  }

  /** 应用转换器 */
  public Object convert(Object value) {
    return converter.apply(value);
  }
}
