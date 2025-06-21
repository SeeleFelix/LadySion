package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.InputPort;
import SeeleFelix.AnimaWeave.framework.node.Node;
import SeeleFelix.AnimaWeave.framework.node.NodeMeta;
import SeeleFelix.AnimaWeave.framework.node.OutputPort;
import SeeleFelix.AnimaWeave.framework.vessel.Port;
import SeeleFelix.AnimaWeave.framework.vessel.PortValue;
import SeeleFelix.AnimaWeave.vessels.basic.labels.IntLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** GetTimestamp节点实例 - 获取当前时间戳 */
@Slf4j
@Component
@NodeMeta(
    displayName = "获取时间戳",
    description = "获取当前时间戳"
)
public class GetTimestampNode extends Node {

  // 输入端口字段
  @InputPort("trigger")
  private PortValue trigger;

  // 输出端口字段
  @OutputPort("timestamp")
  private PortValue timestamp;
  
  @OutputPort("done") 
  private PortValue done;

  public GetTimestampNode(ApplicationEventPublisher eventPublisher) {
    super("GetTimestamp", "basic.GetTimestamp", eventPublisher);
    
    // 初始化端口定义
    this.trigger = new PortValue(new Port("trigger", SignalLabel.getInstance(), true, null), null);
    this.timestamp = new PortValue(new Port("timestamp", IntLabel.getInstance(), true, null), null);
    this.done = new PortValue(new Port("done", SignalLabel.getInstance(), true, null), null);
  }

  @Override
  protected void executeNode() {
    log.debug("GetTimestamp节点开始执行");

    // 获取当前时间戳
    var timestampValue = System.currentTimeMillis();
    var doneValue = true;

    // 设置输出值
    this.timestamp = new PortValue(this.timestamp.port(), timestampValue);
    this.done = new PortValue(this.done.port(), doneValue);

    log.debug("GetTimestamp节点执行完成，时间戳: {}", timestampValue);
  }
}
