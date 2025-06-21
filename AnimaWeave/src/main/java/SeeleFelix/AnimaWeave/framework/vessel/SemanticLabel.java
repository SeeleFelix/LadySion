package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Objects;
import java.util.Set;
import java.util.function.Function;

/**
 * 语义标签抽象基类
 * 
 * 每种具体的语义标签都应该继承此类
 * 例如：SignalLabel, IntLabel, StringLabel等
 */
public abstract class SemanticLabel {

  private final String labelName;
  private final Set<SemanticLabel> compatibleLabels;
  private final Function<Object, Object> converter;

  protected SemanticLabel(
      String labelName, 
      Set<SemanticLabel> compatibleLabels, 
      Function<Object, Object> converter) {
    this.labelName = Objects.requireNonNull(labelName, "标签名称不能为空");
    this.compatibleLabels = Objects.requireNonNull(compatibleLabels, "兼容标签集合不能为空");
    this.converter = Objects.requireNonNull(converter, "转换函数不能为空");
  }

  public String labelName() {
    return labelName;
  }

  public Set<SemanticLabel> compatibleLabels() {
    return compatibleLabels;
  }

  public Function<Object, Object> converter() {
    return converter;
  }

  /**
   * 检查是否与另一个标签兼容
   */
  public boolean isCompatibleWith(SemanticLabel other) {
    return this.equals(other) || this.compatibleLabels.contains(other);
  }

  /**
   * 转换值到此标签类型
   */
  public Object convertValue(Object value) {
    return converter.apply(value);
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    SemanticLabel that = (SemanticLabel) obj;
    return Objects.equals(labelName, that.labelName);
  }

  @Override
  public int hashCode() {
    return Objects.hash(labelName);
  }

  @Override
  public String toString() {
    return String.format("SemanticLabel[%s]", labelName);
  }
}
