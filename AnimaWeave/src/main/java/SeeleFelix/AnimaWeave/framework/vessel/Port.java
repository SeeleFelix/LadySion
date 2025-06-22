package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Objects;

/**
 * 端口定义 - 泛型化的端口规格定义
 * 
 * 定义节点的输入或输出接口规格，包括端口名称、期望的Label类型、是否必需和默认值
 * 使用泛型确保类型安全，在编译时就能检查Label类型匹配
 * 
 * @param <T> 端口期望的SemanticLabel类型
 */
public class Port<T extends SemanticLabel<?>> {
    
    private final String name;                    // 端口名称
    private final Class<T> labelType;            // 期望的Label类型
    private final boolean required;               // 是否必需
    private final T defaultLabel;                 // 默认Label值

    /**
     * 完整构造函数
     */
    public Port(String name, Class<T> labelType, boolean required, T defaultLabel) {
        this.name = Objects.requireNonNull(name, "端口名称不能为空");
        this.labelType = Objects.requireNonNull(labelType, "Label类型不能为空");
        this.required = required;
        this.defaultLabel = defaultLabel;
    }

    /**
     * 创建必需端口的便利构造方法
     */
    public Port(String name, Class<T> labelType) {
        this(name, labelType, true, null);
    }

    /**
     * 创建可选端口的便利构造方法
     */
    public Port(String name, Class<T> labelType, T defaultLabel) {
        this(name, labelType, false, defaultLabel);
    }

    /**
     * 验证给定的Label是否与此端口兼容
     */
    public boolean validateLabel(SemanticLabel<?> label) {
        if (label == null) {
            return !required; // 如果不是必需端口，null是可接受的
        }
        
        // 检查类型匹配
        if (labelType.isInstance(label)) {
            return true;
        }
        
        // 检查兼容性
        return label.isCompatibleWith(createEmptyLabel());
    }

    /**
     * 创建此端口类型的空Label实例（用于兼容性检查）
     */
    private T createEmptyLabel() {
        if (defaultLabel != null) {
            return defaultLabel;
        }
        
        // 这里需要反射创建实例，或者要求Label类型提供静态工厂方法
        // 暂时返回null，具体实现可以在子类中处理
        return null;
    }

    /**
     * 获取端口名称
     */
    public String getName() {
        return name;
    }

    /**
     * 获取期望的Label类型
     */
    public Class<T> getLabelType() {
        return labelType;
    }

    /**
     * 是否为必需端口
     */
    public boolean isRequired() {
        return required;
    }

    /**
     * 获取默认Label值
     */
    public T getDefaultLabel() {
        return defaultLabel;
    }

    /**
     * 检查是否有默认值
     */
    public boolean hasDefaultValue() {
        return defaultLabel != null;
    }

    /**
     * 基于端口名称的相等性判断
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Port<?> port = (Port<?>) obj;
        return Objects.equals(name, port.name);
    }

    /**
     * 基于端口名称的哈希码
     */
    @Override
    public int hashCode() {
        return Objects.hash(name);
    }

    @Override
    public String toString() {
        return String.format("%s<%s>%s%s", 
                           name, 
                           labelType.getSimpleName(),
                           required ? "*" : "",
                           defaultLabel != null ? "[default]" : "");
    }
} 