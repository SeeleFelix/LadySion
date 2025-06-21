package SeeleFelix.AnimaWeave.framework.vessel;

/** 
 * 端口模板 - 用于在NodeDefinition中定义端口的规格
 * 不包含实际值，只定义端口的名称、类型和约束
 */
public record PortTemplate(
    String name,
    String displayName,
    SemanticLabelDefinition semanticLabel,
    boolean required,
    Object defaultValue) {

  /** 创建实际的端口实例 */
  public Port createPort() {
    return new Port(name, semanticLabel, defaultValue);
  }
  
  /** 创建带指定值的端口实例 */
  public Port createPort(Object value) {
    return new Port(name, semanticLabel, value);
  }
} 