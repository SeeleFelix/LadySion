package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.function.Function;

/**
 * 整数语义标签 - Basic Vessel定义
 * 继承SemanticLabel抽象类，天然不可变，承载Integer值
 * 标签名称自动从类名推导为"Int"
 */
public class IntLabel extends SemanticLabel<Integer> {
    
    /**
     * 静态转换函数 - 复用同一个实例，提高性能
     */
    private static final Function<Object, Integer> CONVERTER = value -> {
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("无法将字符串 '" + value + "' 转换为整数", e);
            }
        }
        throw new IllegalArgumentException("无法将类型 " + value.getClass().getSimpleName() + " 转换为整数");
    };
    
    /**
     * 创建带值的IntLabel
     */
    public IntLabel(Integer value) {
        super(value);
    }
    
    /**
     * 创建空值的IntLabel（用于端口定义等场景）
     */
    public IntLabel() {
        this(null);
    }
    
    @Override
    public SemanticLabel<Integer> withValue(Integer newValue) {
        return new IntLabel(newValue);
    }
    
    @Override
    public Function<Object, Integer> getConverter() {
        return CONVERTER; // 返回静态实例
    }
    
    /**
     * 便利工厂方法 - 创建带值的IntLabel
     */
    public static IntLabel of(int value) {
        return new IntLabel(value);
    }
    
    /**
     * 便利工厂方法 - 创建空IntLabel
     */
    public static IntLabel empty() {
        return new IntLabel(null);
    }
} 