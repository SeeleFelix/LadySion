package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.function.Function;

/**
 * 信号语义标签 - Basic Vessel定义 继承SemanticLabel抽象类，天然不可变，用于触发和同步 Signal的值总是null，存在本身就表示触发
 * 标签名称自动从类名推导为"Signal"
 */
public class SignalLabel extends SemanticLabel<Void> {

  /** 静态转换函数 - Signal总是返回null */
  private static final Function<Object, Void> CONVERTER = value -> null;

  /** 创建Signal实例 - 值总是null */
  public SignalLabel() {
    super(null);
  }

  // 移除旧的getConverter方法，现在使用@Converter注解

  /** 检查Signal是否被触发 - Signal存在就表示触发 */
  public boolean isTriggered() {
    return true; // Signal存在本身就表示触发
  }

  /** 便利工厂方法 - 创建触发信号 */
  public static SignalLabel trigger() {
    return new SignalLabel();
  }

  /** 便利工厂方法 - 创建信号（别名） */
  public static SignalLabel signal() {
    return new SignalLabel();
  }
}
