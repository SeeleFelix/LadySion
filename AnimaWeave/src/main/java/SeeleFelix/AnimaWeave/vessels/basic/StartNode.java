package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.Node;
import SeeleFelix.AnimaWeave.framework.node.NodeMeta;
import SeeleFelix.AnimaWeave.framework.node.OutputPort;
import SeeleFelix.AnimaWeave.framework.vessel.Port;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.UUIDLabel;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** Start节点实例 - 图执行的起始点，生成执行ID和信号 */
@Slf4j
@Component
@NodeMeta(displayName = "启动节点", description = "图执行的起始点，生成执行ID和信号")
public class StartNode extends Node {

  // 输出端口定义 - 使用泛型Port
  @OutputPort("signal")
  private final Port<SignalLabel> signalPort;

  @OutputPort("execution_id")
  private final Port<UUIDLabel> executionIdPort;

  public StartNode(ApplicationEventPublisher eventPublisher) {
    super("Start", "basic.Start", eventPublisher);

    // 初始化输出端口定义 - 泛型化的Port
    this.signalPort = new Port<>("signal", SignalLabel.class);
    this.executionIdPort = new Port<>("execution_id", UUIDLabel.class);
  }

  @Override
  protected void executeNode() {
    log.debug("Start节点开始执行");

    // 生成执行ID和信号
    UUID execId = UUID.randomUUID();

    // 创建输出Label实例并设置到输出
    SignalLabel signalOutput = SignalLabel.trigger();
    UUIDLabel executionIdOutput = UUIDLabel.of(execId);

    // 使用新的setOutput方法设置输出
    setOutput("signal", signalOutput);
    setOutput("execution_id", executionIdOutput);

    log.debug("Start节点执行完成，生成执行ID: {}", execId);
  }
}
