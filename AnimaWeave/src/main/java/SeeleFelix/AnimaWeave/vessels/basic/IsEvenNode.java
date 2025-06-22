package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.InputPort;
import SeeleFelix.AnimaWeave.framework.node.Node;
import SeeleFelix.AnimaWeave.framework.node.NodeMeta;
import SeeleFelix.AnimaWeave.framework.node.OutputPort;
import SeeleFelix.AnimaWeave.framework.vessel.Port;
import SeeleFelix.AnimaWeave.vessels.basic.labels.BoolLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.IntLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** IsEven节点实例 - 判断一个数字是否为偶数 */
@Slf4j
@Component
@NodeMeta(displayName = "判断偶数", description = "判断一个数字是否为偶数")
public class IsEvenNode extends Node {

  // 输入端口定义 - 使用泛型Port
  @InputPort("number")
  private final Port<IntLabel> numberPort;

  @InputPort("trigger")
  private final Port<SignalLabel> triggerPort;

  // 输出端口定义 - 使用泛型Port
  @OutputPort("result")
  private final Port<BoolLabel> resultPort;

  @OutputPort("done")
  private final Port<SignalLabel> donePort;

  public IsEvenNode(ApplicationEventPublisher eventPublisher) {
    super("IsEven", "basic.IsEven", eventPublisher);

    // 初始化端口定义 - 泛型化的Port
    this.numberPort = new Port<>("number", IntLabel.class);
    this.triggerPort = new Port<>("trigger", SignalLabel.class);
    this.resultPort = new Port<>("result", BoolLabel.class);
    this.donePort = new Port<>("done", SignalLabel.class);
  }

  @Override
  protected void executeNode() {
    log.debug("IsEven节点开始执行");

    // 获取输入Label实例
    IntLabel numberInput = getInput("number");
    SignalLabel triggerInput = getInput("trigger");

    // 从Label中获取实际值
    Integer numberValue = numberInput.getValue();

    if (numberValue == null) {
      throw new IllegalArgumentException("输入数字不能为null");
    }

    // 判断是否为偶数
    boolean resultValue = numberValue % 2 == 0;

    // 创建输出Label实例并设置
    BoolLabel resultOutput = BoolLabel.of(resultValue);
    SignalLabel doneOutput = SignalLabel.trigger();

    setOutput("result", resultOutput);
    setOutput("done", doneOutput);

    log.debug("IsEven节点执行完成，数字: {}, 结果: {}", numberValue, resultValue);
  }
}
