package SeeleFelix.AnimaWeave.framework.node;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标识Node类中的输入端口字段
 * 字段类型必须是PortValue
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface InputPort {
    
    /**
     * 端口名称
     */
    String value();
} 