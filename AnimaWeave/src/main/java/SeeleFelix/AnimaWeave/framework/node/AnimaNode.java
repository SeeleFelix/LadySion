package SeeleFelix.AnimaWeave.framework.node;

import org.springframework.stereotype.Component;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * AnimaNode注解 - 标识节点执行器
 * 
 * 组合了@Component和节点元数据
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Component
public @interface AnimaNode {
    
    /**
     * Vessel名称
     */
    String vessel();
    
    /**
     * 节点名称
     */
    String node();
    
    /**
     * 节点描述
     */
    String description() default "";
    
    /**
     * Spring Bean名称 - 自动生成为 vessel.node
     */
    String value() default "";
} 