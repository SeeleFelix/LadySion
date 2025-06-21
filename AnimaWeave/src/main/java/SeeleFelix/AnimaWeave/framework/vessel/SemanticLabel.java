package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;

/** 
 * 语义标签类型定义 - 定义语义标签的元信息和兼容性转换
 * 这是语义标签的"类型定义"，不包含实际值
 */
public record SemanticLabel(
    String labelName,
    Set<SemanticLabel> compatibleLabels,
    Function<Object, Object> converter) {

  /** 检查是否与另一个标签兼容 */
  public boolean isCompatibleWith(String otherLabelName) {
    return labelName.equals(otherLabelName) || 
           compatibleLabels.stream().anyMatch(label -> label.labelName().equals(otherLabelName));
  }
  
  /** 检查是否与另一个标签定义兼容 */
  public boolean isCompatibleWith(SemanticLabel otherLabel) {
    return this.equals(otherLabel) || compatibleLabels.contains(otherLabel);
  }

  /** 应用转换器 */
  public Object convert(Object value) {
    return converter.apply(value);
  }

  /**
   * 基于标签名称的相等性判断
   */
  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    SemanticLabel that = (SemanticLabel) obj;
    return Objects.equals(labelName, that.labelName);
  }

  /**
   * 基于标签名称的哈希码
   */
  @Override
  public int hashCode() {
    return Objects.hash(labelName);
  }
}
