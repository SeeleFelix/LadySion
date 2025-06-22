package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.Converter;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;

/** 布尔语义标签 - Basic Vessel定义 继承SemanticLabel抽象类，天然不可变，承载Boolean值 标签名称自动从类名推导为"Bool" */
public class BoolLabel extends SemanticLabel<Boolean> {

  /** 转换到IntLabel：true -> 1, false -> 0 */
  @Converter(to = IntLabel.class)
  private IntLabel convertToInt() {
    Boolean value = this.getValue();
    if (value == null) return SemanticLabel.withValue(IntLabel.class, null);
    return SemanticLabel.withValue(IntLabel.class, value ? 1 : 0);
  }
  
  /** 便利工厂方法 - 创建true值的BoolLabel */
  public static BoolLabel of(boolean value) {
    return SemanticLabel.withValue(BoolLabel.class, value);
  }
  
  /** 便利工厂方法 - 创建true值的BoolLabel */
  public static BoolLabel trueValue() {
    return SemanticLabel.withValue(BoolLabel.class, true);
  }
  
  /** 便利工厂方法 - 创建false值的BoolLabel */
  public static BoolLabel falseValue() {
    return SemanticLabel.withValue(BoolLabel.class, false);
  }
  
  /** 便利工厂方法 - 创建空BoolLabel */
  public static BoolLabel empty() {
    return SemanticLabel.empty(BoolLabel.class);
  }
}
