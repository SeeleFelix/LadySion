package SeeleFelix.AnimaWeave.framework.node;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** 节点元数据注解 用于定义节点的显示名称和描述 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface NodeMeta {

  /** 节点显示名称 */
  String displayName();

  /** 节点描述 */
  String description();
}
