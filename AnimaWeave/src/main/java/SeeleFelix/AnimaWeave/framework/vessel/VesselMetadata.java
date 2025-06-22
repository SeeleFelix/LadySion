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

  /** 检查是否依赖特定vessel */
  public boolean dependsOn(String vesselName) {
    return dependencies.contains(vesselName);
  }
}
