package SeeleFelix.AnimaWeave.framework.event.events;

import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;
import SeeleFelix.AnimaWeave.framework.vessel.VesselMetadata;
import lombok.Getter;
import lombok.ToString;
import lombok.experimental.Accessors;

/** Vessel加载完成事件 当一个vessel插件成功加载并初始化完成时发出 使用lombok + 静态工厂方法的实用现代化方案 */
@Getter
@ToString(
    callSuper = true,
    of = {"vesselName", "successful", "errorMessage"})
@Accessors(fluent = true)
public class VesselLoadedEvent extends AnimaWeaveEvent {

  private final String vesselName;
  private final VesselMetadata metadata;
  private final boolean successful;
  private final String errorMessage;

  // 私有主构造函数
  private VesselLoadedEvent(
      Object source,
      String sourceIdentifier,
      String vesselName,
      VesselMetadata metadata,
      boolean successful,
      String errorMessage) {
    super(source, sourceIdentifier);
    this.vesselName = vesselName;
    this.metadata = metadata;
    this.successful = successful;
    this.errorMessage = errorMessage;
  }

  // Builder风格的静态工厂方法 - 成功加载
  public static VesselLoadedEvent success(
      Object source, String sourceIdentifier, String vesselName, VesselMetadata metadata) {
    return new VesselLoadedEvent(source, sourceIdentifier, vesselName, metadata, true, null);
  }

  // Builder风格的静态工厂方法 - 加载失败
  public static VesselLoadedEvent failure(
      Object source, String sourceIdentifier, String vesselName, String errorMessage) {
    return new VesselLoadedEvent(source, sourceIdentifier, vesselName, null, false, errorMessage);
  }

  // 便捷方法
  public boolean isFailure() {
    return !successful;
  }

  public boolean hasMetadata() {
    return metadata != null;
  }
}
