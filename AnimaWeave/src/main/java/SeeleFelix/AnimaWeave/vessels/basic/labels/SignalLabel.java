package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.function.Function;

/**
 * 信号语义标签 - Basic Vessel定义
 * 继承SemanticLabel抽象类，天然不可变，用于触发和同步
 * Signal的值总是null，存在本身就表示触发
 * 标签名称自动从类名推导为"Signal"
 */
public class SignalLabel extends SemanticLabel<Void> {
    
    /**
     * 静态转换函数 - Signal总是返回null
     */
    private static final Function<Object, Void> CONVERTER = value -> null;
    
    /**
     * 创建Signal实例 - 值总是null
     */
    public SignalLabel() {
        super(null);
    }
    
    @Override
    public SemanticLabel<Void> withValue(Void newValue) {
        return new SignalLabel(); // Signal忽略值参数
    }
    
    @Override
    public Function<Object, Void> getConverter() {
        return CONVERTER; // 返回静态实例
    }
    
    /**
     * 检查Signal是否被触发 - Signal存在就表示触发
     */
    public boolean isTriggered() {
        return true; // Signal存在本身就表示触发
    }
    
    /**
     * 便利工厂方法 - 创建触发信号
     */
    public static SignalLabel trigger() {
        return new SignalLabel();
    }
    
    /**
     * 便利工厂方法 - 创建信号（别名）
     */
    public static SignalLabel signal() {
        return new SignalLabel();
    }
    
    // Signal的hasValue()和isEmpty()使用父类的final实现
    // hasValue() 返回 false，因为getValue()返回null
    // isEmpty() 返回 true，因为getValue()返回null
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        // 所有Signal实例都相等，因为值都是null
        return true;
    }
    
    @Override
    public int hashCode() {
        return getLabelName().hashCode(); // 基于标签名称
    }
    
    @Override
    public String toString() {
        return "SignalLabel[Signal=triggered]";
    }
} 