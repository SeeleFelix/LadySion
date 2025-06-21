package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Objects;

/**
 * 端口值 - 端口定义和实际值的组合
 * 用于实际的数据传递，类似于函数调用时的实参
 */
public record PortValue(
    Port port,    // 端口定义
    Object value  // 实际值
) {

  public PortValue {
    Objects.requireNonNull(port, "端口定义不能为空");
    // value可以为null，表示空值或使用默认值
  }

  /**
   * 获取端口名称
   */
  public String portName() {
    return port.name();
  }

  /**
   * 获取语义标签定义
   */
  public SemanticLabel semanticLabel() {
    return port.semanticLabel();
  }

  /**
   * 检查是否有值（非null且非默认值）
   */
  public boolean hasValue() {
    return value != null;
  }

  /**
   * 获取有效值（如果当前值为null，则返回端口的默认值）
   */
  public Object getEffectiveValue() {
    return value != null ? value : port.defaultValue();
  }

  @Override
  public String toString() {
    return String.format("%s[%s] = %s", 
        port.name(), 
        port.semanticLabel().labelName(), 
        value);
  }
} 