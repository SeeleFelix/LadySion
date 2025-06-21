package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;

/** Vessel插件元数据 使用Java 21 record的现代化实现 */
public record VesselMetadata(
    String name,
    String version,
    String description,
    String author,
    List<String> dependencies,
    String minFrameworkVersion) {

  /** 创建基础元数据的便捷方法 */
  public static VesselMetadata of(String name, String version) {
    return new VesselMetadata(name, version, "", "", List.of(), "1.0.0");
  }

  /** 创建带描述的元数据 */
  public static VesselMetadata of(String name, String version, String description) {
    return new VesselMetadata(name, version, description, "", List.of(), "1.0.0");
  }

  /** 创建完整元数据的便捷方法 */
  public static VesselMetadata of(String name, String version, String description, String author) {
    return new VesselMetadata(name, version, description, author, List.of(), "1.0.0");
  }

  /** 检查是否依赖特定vessel */
  public boolean dependsOn(String vesselName) {
    return dependencies.contains(vesselName);
  }
}
