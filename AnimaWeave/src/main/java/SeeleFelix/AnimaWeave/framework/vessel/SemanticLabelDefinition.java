package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;
import java.util.Set;
import java.util.function.Function;

/** 
 * 语义标签类型定义 - 定义语义标签的元信息和兼容性转换
 * 这是语义标签的"类型定义"，不包含实际值
 */
public record SemanticLabelDefinition(
    String labelName,
    Set<SemanticLabelDefinition> compatibleLabels,
    Function<Object, Object> converter) {

  /** 检查是否与另一个标签兼容 */
  public boolean isCompatibleWith(String otherLabelName) {
    return labelName.equals(otherLabelName) || 
           compatibleLabels.stream().anyMatch(label -> label.labelName().equals(otherLabelName));
  }
  
  /** 检查是否与另一个标签定义兼容 */
  public boolean isCompatibleWith(SemanticLabelDefinition otherLabel) {
    return this.equals(otherLabel) || compatibleLabels.contains(otherLabel);
  }

  /** 应用转换器 */
  public Object convert(Object value) {
    return converter.apply(value);
  }
}
