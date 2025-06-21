package SeeleFelix.AnimaWeave.framework.startup;

import SeeleFelix.AnimaWeave.framework.event.AnimaWeaveEvent;
import java.util.Set;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/** 系统就绪事件 当所有vessel都加载完成，系统准备好执行图时发出 */
@Getter
@ToString(
    callSuper = true,
    of = {"loadedVesselsCount", "startupTime"})
@EqualsAndHashCode(
    callSuper = false,
    of = {"loadedVessels", "startupTime"})
public final class SystemReadyEvent extends AnimaWeaveEvent {

  private final Set<String> loadedVessels;
  private final long startupTime;

  public SystemReadyEvent(
      Object source, String sourceIdentifier, Set<String> loadedVessels, long startupTime) {
    super(source, sourceIdentifier);
    this.loadedVessels = Set.copyOf(loadedVessels);
    this.startupTime = startupTime;
  }

  /** 便捷的静态工厂方法 */
  public static SystemReadyEvent of(
      Object source, String sourceIdentifier, Set<String> loadedVessels, long startupTime) {
    return new SystemReadyEvent(source, sourceIdentifier, loadedVessels, startupTime);
  }

  /** 获取加载的vessel数量 */
  public int getLoadedVesselsCount() {
    return loadedVessels.size();
  }

  /** 检查特定vessel是否已加载 */
  public boolean isVesselLoaded(String vesselName) {
    return loadedVessels.contains(vesselName);
  }
}
