package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.Node;
import SeeleFelix.AnimaWeave.framework.node.NodeMeta;
import SeeleFelix.AnimaWeave.framework.node.OutputPort;
import SeeleFelix.AnimaWeave.framework.vessel.Port;
import SeeleFelix.AnimaWeave.framework.vessel.PortValue;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.UUIDLabel;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** Start节点实例 - 图执行的起始点，生成执行ID和信号 */
@Slf4j
@Component
@NodeMeta(
    displayName = "启动节点",
    description = "图执行的起始点，生成执行ID和信号"
)
public class StartNode extends Node {

  // 输出端口字段
  @OutputPort("signal")
  private PortValue signal;
  
  @OutputPort("execution_id") 
  private PortValue executionId;

  public StartNode(ApplicationEventPublisher eventPublisher) {
    super("Start", "basic.Start", eventPublisher);
    
    // 初始化输出端口定义
    this.signal = new PortValue(new Port("signal", SignalLabel.getInstance(), true, null), null);
    this.executionId = new PortValue(new Port("execution_id", UUIDLabel.getInstance(), true, null), null);
  }

  @Override
  protected void executeNode() {
    log.debug("Start节点开始执行");

    // 生成执行ID和信号
    var execId = UUID.randomUUID().toString();
    var signalValue = true;

    // 设置输出值
    this.signal = new PortValue(this.signal.port(), signalValue);
    this.executionId = new PortValue(this.executionId.port(), execId);

    log.debug("Start节点执行完成，生成执行ID: {}", execId);
  }
}
