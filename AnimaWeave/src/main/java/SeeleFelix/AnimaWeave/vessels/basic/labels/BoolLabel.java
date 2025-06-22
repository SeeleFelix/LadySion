package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.function.Function;

/**
 * 布尔语义标签 - Basic Vessel定义
 * 继承SemanticLabel抽象类，天然不可变，承载Boolean值
 * 标签名称自动从类名推导为"Bool"
 */
public class BoolLabel extends SemanticLabel<Boolean> {
    
    /**
     * 静态转换函数 - 复用同一个实例，提高性能
     */
    private static final Function<Object, Boolean> CONVERTER = value -> {
        if (value == null) return null;
        if (value instanceof Boolean) return (Boolean) value;
        if (value instanceof String) {
            String str = ((String) value).toLowerCase().trim();
            return "true".equals(str) || "1".equals(str) || "yes".equals(str);
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue() != 0.0;
        }
        throw new IllegalArgumentException("无法将类型 " + value.getClass().getSimpleName() + " 转换为布尔值");
    };
    
    /**
     * 创建带值的BoolLabel
     */
    public BoolLabel(Boolean value) {
        super(value);
    }
    
    /**
     * 创建空值的BoolLabel（用于端口定义等场景）
     */
    public BoolLabel() {
        this(null);
    }
    
    @Override
    public SemanticLabel<Boolean> withValue(Boolean newValue) {
        return new BoolLabel(newValue);
    }
    
    @Override
    public Function<Object, Boolean> getConverter() {
        return CONVERTER; // 返回静态实例
    }
    
    /**
     * 便利工厂方法 - 创建带值的BoolLabel
     */
    public static BoolLabel of(boolean value) {
        return new BoolLabel(value);
    }
    
    /**
     * 便利工厂方法 - 创建true值的BoolLabel
     */
    public static BoolLabel trueValue() {
        return new BoolLabel(true);
    }
    
    /**
     * 便利工厂方法 - 创建false值的BoolLabel
     */
    public static BoolLabel falseValue() {
        return new BoolLabel(false);
    }
    
    /**
     * 便利工厂方法 - 创建空BoolLabel
     */
    public static BoolLabel empty() {
        return new BoolLabel(null);
    }
} 