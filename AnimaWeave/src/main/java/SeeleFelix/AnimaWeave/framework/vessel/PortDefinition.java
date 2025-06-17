package SeeleFelix.AnimaWeave.framework.vessel;

/**
 * 端口定义
 */
public record PortDefinition(
    String name,
    String displayName,
    SemanticLabelDefinition semanticLabel,
    boolean required,
    Object defaultValue
) {
    
    /**
     * 创建必需端口
     */
    public static PortDefinition required(String name, String displayName, 
                                        SemanticLabelDefinition semanticLabel) {
        return new PortDefinition(name, displayName, semanticLabel, true, null);
    }
    
    /**
     * 创建可选端口
     */
    public static PortDefinition optional(String name, String displayName,
                                        SemanticLabelDefinition semanticLabel,
                                        Object defaultValue) {
        return new PortDefinition(name, displayName, semanticLabel, false, defaultValue);
    }
} 