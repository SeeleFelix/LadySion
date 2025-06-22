package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.Converter;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;

/**
 * 整数语义标签 - Basic Vessel定义 继承SemanticLabel抽象类，天然不可变，承载Integer值 标签名称自动从类名推导为"Int"
 * 使用@Converter注解定义转换方法
 */
public class IntLabel extends SemanticLabel<Integer> {

  /** 创建带值的IntLabel */
  public IntLabel(Integer value) {
    super(value);
  }

  /** 创建空值的IntLabel（用于端口定义等场景） */
  public IntLabel() {
    this(null);
  }

  /** 转换到BoolLabel：0 -> false, 非0 -> true */
  @Converter(to = BoolLabel.class)
  private BoolLabel convertToBool() {
    Integer value = this.getValue();
    if (value == null) return SemanticLabel.withValue(BoolLabel.class, null);
    return SemanticLabel.withValue(BoolLabel.class, value != 0);
  }

  // 可以轻松添加更多转换器
  // @Converter(from = StringLabel.class)
  // private IntLabel convertFromString(StringLabel source) { ... }

  /** 便利工厂方法 - 创建带值的IntLabel */
  public static IntLabel of(int value) {
    return new IntLabel(value);
  }

  /** 便利工厂方法 - 创建空IntLabel */
  public static IntLabel empty() {
    return new IntLabel(null);
  }
}
