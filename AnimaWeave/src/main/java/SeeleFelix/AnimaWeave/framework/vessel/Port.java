package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Objects;

/**
 * 端口定义 - 定义节点的输入或输出接口规格
 * 不包含实际值，只定义端口的名称、语义标签、是否必需和默认值
 * 类似于函数参数的定义
 */
public record Port(
    String name,                    // 端口名称
    SemanticLabel semanticLabel,  // 语义标签定义
    boolean required,               // 是否必需
    Object defaultValue) {          // 默认值

  public Port {
    Objects.requireNonNull(name, "端口名称不能为空");
    Objects.requireNonNull(semanticLabel, "语义标签定义不能为空");
  }

  /**
   * 创建必需端口的便利构造方法
   */
  public Port(String name, SemanticLabel semanticLabel) {
    this(name, semanticLabel, true, null);
  }

  /**
   * 基于端口名称的相等性判断
   */
  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    Port port = (Port) obj;
    return Objects.equals(name, port.name);
  }

  /**
   * 基于端口名称的哈希码
   */
  @Override
  public int hashCode() {
    return Objects.hash(name);
  }

  @Override
  public String toString() {
    return String.format("%s[%s]%s", name, semanticLabel.labelName(), required ? "*" : "");
  }
} 