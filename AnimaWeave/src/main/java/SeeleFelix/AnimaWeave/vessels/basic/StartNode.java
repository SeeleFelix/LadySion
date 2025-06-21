package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.node.Node;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** Start节点实例 图执行的起始点，生成执行ID和信号 */
@Slf4j
@Component
public class StartNode extends Node {

  public StartNode(ApplicationEventPublisher eventPublisher) {
    super("Start", "basic.Start", eventPublisher);
  }

  @Override
  protected Map<String, Object> executeNode(Map<String, Object> inputs) {
    log.debug("Start节点开始执行");

    // 生成执行ID和信号
    var executionId = UUID.randomUUID().toString();
    var signal = true;

    Map<String, Object> outputs =
        Map.of(
            "signal", signal,
            "execution_id", executionId);

    log.debug("Start节点执行完成，生成执行ID: {}", executionId);
    return outputs;
  }
}
