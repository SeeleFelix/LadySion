package SeeleFelix.AnimaWeave.framework.vessel;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 转换器注解 - 标记转换方法
 *
 * <p>约定： 1. 被标记的方法必须是无参数的 2. 返回类型必须是SemanticLabel的子类 3. 方法转换当前实例到目标类型
 *
 * <p>示例： @Converter(to = IntLabel.class) private IntLabel convertToInt() { return new
 * IntLabel(this.getValue() ? 1 : 0); }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Converter {
  /** 目标标签类型 - 可以转换到哪个类型 */
  Class<? extends SemanticLabel<?>> to();
}
