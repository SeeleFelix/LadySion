package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Objects;
import java.util.Set;
import java.util.function.Function;

/**
 * 语义标签抽象基类 - 天然带值的不可变设计
 * 
 * 每个Label实例直接承载具体的数据值，天然不可变
 * 提供丰富的默认实现，子类只需实现核心方法
 * 标签名称直接从类名获取，无需额外存储
 * 
 * @param <T> 标签承载的值类型
 */
public abstract class SemanticLabel<T> {

    private final T value;

    /**
     * 构造函数 - 创建不可变的标签实例
     */
    protected SemanticLabel(T value) {
        this.value = value; // 允许null值，如Signal标签
    }

    /**
     * 获取标签名称 - 从类名推导
     * 例如：IntLabel -> "Int", BoolLabel -> "Bool"
     */
    public final String getLabelName() {
        String className = getClass().getSimpleName();
        // 移除"Label"后缀
        if (className.endsWith("Label")) {
            return className.substring(0, className.length() - 5);
        }
        return className;
    }

    /**
     * 获取标签承载的值
     */
    public final T getValue() {
        return value;
    }

    /**
     * 创建相同类型但不同值的新标签实例 - 子类必须实现
     */
    public abstract SemanticLabel<T> withValue(T newValue);

    /**
     * 获取兼容的标签类型集合 - 子类可选实现
     */
    public Set<Class<? extends SemanticLabel<?>>> getCompatibleLabels() {
        return Set.of(); // 默认不与其他类型兼容
    }

    /**
     * 获取类型转换函数 - 子类可选实现
     */
    public Function<Object, T> getConverter() {
        return value -> {
            throw new UnsupportedOperationException(
                "标签类型 " + getLabelName() + " 不支持类型转换");
        };
    }

    /**
     * 检查是否有实际值（非null）
     */
    public final boolean hasValue() {
        return value != null;
    }

    /**
     * 检查是否为空值
     */
    public final boolean isEmpty() {
        return value == null;
    }

    /**
     * 检查是否与另一个标签类型兼容
     */
    public boolean isCompatibleWith(SemanticLabel<?> other) {
        if (other == null) return false;
        
        // 相同类型直接兼容
        if (this.getClass().equals(other.getClass())) {
            return true;
        }
        
        // 检查兼容性列表
        return this.getCompatibleLabels().contains(other.getClass()) ||
               other.getCompatibleLabels().contains(this.getClass());
    }

    /**
     * 转换其他值到此标签类型
     */
    public T convertValue(Object value) {
        return getConverter().apply(value);
    }

    /**
     * 创建相同类型的标签，值为转换后的值
     */
    public SemanticLabel<T> convertFrom(Object value) {
        T convertedValue = convertValue(value);
        return withValue(convertedValue);
    }

    /**
     * 基于标签名称和值的相等性判断
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        SemanticLabel<?> that = (SemanticLabel<?>) obj;
        return Objects.equals(getLabelName(), that.getLabelName()) &&
               Objects.equals(value, that.value);
    }

    /**
     * 基于标签名称和值的哈希码
     */
    @Override
    public int hashCode() {
        return Objects.hash(getLabelName(), value);
    }

    /**
     * 默认的toString实现
     */
    @Override
    public String toString() {
        return String.format("%s[%s=%s]", 
                           getClass().getSimpleName(), 
                           getLabelName(), 
                           value != null ? value.toString() : "null");
    }
}
