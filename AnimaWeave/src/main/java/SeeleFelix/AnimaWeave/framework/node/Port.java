package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;

/**
 * Port定义 - 包含类型信息和元数据
 * 
 * @param <T> SemanticLabel的具体类型
 */
public record Port<T extends SemanticLabel<?>>(
    String name,
    Class<T> labelType,
    String description,
    boolean required
) {
    
    /**
     * 创建必需的输入端口
     */
    public static <T extends SemanticLabel<?>> Port<T> input(String name, Class<T> labelType, String description) {
        return new Port<>(name, labelType, description, true);
    }
    
    /**
     * 创建可选的输入端口
     */
    public static <T extends SemanticLabel<?>> Port<T> optionalInput(String name, Class<T> labelType, String description) {
        return new Port<>(name, labelType, description, false);
    }
    
    /**
     * 创建输出端口
     */
    public static <T extends SemanticLabel<?>> Port<T> output(String name, Class<T> labelType, String description) {
        return new Port<>(name, labelType, description, false);
    }
    
    /**
     * 获取端口的类型名称
     */
    public String getTypeName() {
        return labelType.getSimpleName().replace("Label", "");
    }
} 