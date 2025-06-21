package SeeleFelix.AnimaWeave.framework.vessel;

/** 端口定义 */
public record PortDefinition(
    String name,
    String displayName,
    SemanticLabelDefinition semanticLabel,
    boolean required,
    Object defaultValue) {


}
