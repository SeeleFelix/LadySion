package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.InputPort;
import SeeleFelix.AnimaWeave.framework.node.Node;
import SeeleFelix.AnimaWeave.framework.node.NodeMeta;
import SeeleFelix.AnimaWeave.framework.node.OutputPort;
import SeeleFelix.AnimaWeave.framework.vessel.Port;
import SeeleFelix.AnimaWeave.framework.vessel.PortValue;
import SeeleFelix.AnimaWeave.vessels.basic.labels.BoolLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.IntLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** IsEven节点实例 - 判断一个数字是否为偶数 */
@Slf4j
@Component
@NodeMeta(
    displayName = "判断偶数",
    description = "判断一个数字是否为偶数"
)
public class IsEvenNode extends Node {

  // 输入端口字段
  @InputPort("number")
  private PortValue number;
  
  @InputPort("trigger")
  private PortValue trigger;

  // 输出端口字段
  @OutputPort("result")
  private PortValue result;
  
  @OutputPort("done") 
  private PortValue done;

  public IsEvenNode(ApplicationEventPublisher eventPublisher) {
    super("IsEven", "basic.IsEven", eventPublisher);
    
    // 初始化端口定义
    this.number = new PortValue(new Port("number", IntLabel.getInstance(), true, null), null);
    this.trigger = new PortValue(new Port("trigger", SignalLabel.getInstance(), true, null), null);
    this.result = new PortValue(new Port("result", BoolLabel.getInstance(), true, null), null);
    this.done = new PortValue(new Port("done", SignalLabel.getInstance(), true, null), null);
  }

  @Override
  protected void executeNode() {
    log.debug("IsEven节点开始执行");

    // 获取输入数字
    var numberValue = (Integer) this.number.getEffectiveValue();
    
    // 判断是否为偶数
    var resultValue = numberValue % 2 == 0;
    var doneValue = true;

    // 设置输出值
    this.result = new PortValue(this.result.port(), resultValue);
    this.done = new PortValue(this.done.port(), doneValue);

    log.debug("IsEven节点执行完成，数字: {}, 结果: {}", numberValue, resultValue);
  }
}
