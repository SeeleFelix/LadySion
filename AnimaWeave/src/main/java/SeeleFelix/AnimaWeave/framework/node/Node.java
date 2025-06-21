package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.event.events.NodeOutputSaveEvent;
import SeeleFelix.AnimaWeave.framework.vessel.Port;
import SeeleFelix.AnimaWeave.framework.vessel.PortValue;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;

/**
 * 节点基类 - 使用注解标识端口和元数据
 * 
 * 子类通过@NodeMeta注解定义元数据
 * 子类通过@InputPort和@OutputPort注解标识端口字段
 * 字段类型必须是PortValue
 */
@Slf4j
@Getter
@RequiredArgsConstructor
public abstract class Node {

  private final String nodeName; // 节点实例名称
  private final String nodeType; // 节点类型（如basic.Start等）
  private final ApplicationEventPublisher eventPublisher;

  // 缓存字段
  private String cachedDisplayName;
  private String cachedDescription;
  private List<Port> cachedInputPorts;
  private List<Port> cachedOutputPorts;

  /** 获取显示名称 - 通过@NodeMeta注解获取并缓存 */
  public String getDisplayName() {
    if (cachedDisplayName == null) {
      NodeMeta nodeMeta = this.getClass().getAnnotation(NodeMeta.class);
      if (nodeMeta != null) {
        cachedDisplayName = nodeMeta.displayName();
      } else {
        log.warn("Node {} 没有@NodeMeta注解，使用默认显示名称", this.getClass().getSimpleName());
        cachedDisplayName = this.getClass().getSimpleName();
      }
    }
    return cachedDisplayName;
  }

  /** 获取描述 - 通过@NodeMeta注解获取并缓存 */
  public String getDescription() {
    if (cachedDescription == null) {
      NodeMeta nodeMeta = this.getClass().getAnnotation(NodeMeta.class);
      if (nodeMeta != null) {
        cachedDescription = nodeMeta.description();
      } else {
        log.warn("Node {} 没有@NodeMeta注解，使用默认描述", this.getClass().getSimpleName());
        cachedDescription = "No description available";
      }
    }
    return cachedDescription;
  }

  /** 获取输入端口列表 - 通过反射从@InputPort注解获取并缓存 */
  public List<Port> getInputPorts() {
    if (cachedInputPorts == null) {
      cachedInputPorts = new ArrayList<>();
      
      for (Field field : this.getClass().getDeclaredFields()) {
        InputPort annotation = field.getAnnotation(InputPort.class);
        if (annotation != null) {
          // 从字段的PortValue中获取Port定义
          try {
            field.setAccessible(true);
            PortValue portValue = (PortValue) field.get(this);
            if (portValue != null) {
              cachedInputPorts.add(portValue.port());
            } else {
              log.warn("InputPort字段 {} 为null，无法获取Port定义", field.getName());
            }
          } catch (Exception e) {
            log.error("获取InputPort字段 {} 失败", field.getName(), e);
          }
        }
      }
    }
    
    return cachedInputPorts;
  }

  /** 获取输出端口列表 - 通过反射从@OutputPort注解获取并缓存 */
  public List<Port> getOutputPorts() {
    if (cachedOutputPorts == null) {
      cachedOutputPorts = new ArrayList<>();
      
      for (Field field : this.getClass().getDeclaredFields()) {
        OutputPort annotation = field.getAnnotation(OutputPort.class);
        if (annotation != null) {
          // 从字段的PortValue中获取Port定义
          try {
            field.setAccessible(true);
            PortValue portValue = (PortValue) field.get(this);
            if (portValue != null) {
              cachedOutputPorts.add(portValue.port());
            } else {
              log.warn("OutputPort字段 {} 为null，无法获取Port定义", field.getName());
            }
          } catch (Exception e) {
            log.error("获取OutputPort字段 {} 失败", field.getName(), e);
          }
        }
      }
    }
    
    return cachedOutputPorts;
  }

  /** 执行节点逻辑的模板方法 */
  public void executeWithTemplate(
      String nodeId,
      Map<String, Object> inputs,
      String executionContextId,
      String nodeExecutionId) {
    log.debug("Node type {} 开始执行: nodeId={}, inputCount={}", nodeType, nodeId, inputs.size());

    try {
      // 根据@InputPort注解注入输入数据
      injectInputs(inputs);
      
      // 执行具体的业务逻辑（无参数）
      executeNode();
      
      // 根据@OutputPort注解收集输出数据
      Map<String, Object> outputs = collectOutputs();

      // 使用传入的执行ID
      var finalExecutionId =
          nodeExecutionId != null ? nodeExecutionId : generateExecutionId(nodeId);

      // 发送成功事件
      var saveEvent = createSuccessEvent(nodeId, finalExecutionId, outputs, executionContextId);
      eventPublisher.publishEvent(saveEvent);

      log.debug(
          "Node type {} 执行成功: nodeId={}, executionId={}, outputCount={}",
          nodeType,
          nodeId,
          finalExecutionId,
          outputs.size());

    } catch (Exception e) {
      log.error("Node type {} 执行失败: nodeId={}", nodeType, nodeId, e);

      // 使用传入的执行ID或生成错误执行ID
      var errorExecutionId =
          nodeExecutionId != null ? nodeExecutionId : generateErrorExecutionId(nodeId);

      // 发送错误事件
      var errorEvent =
          createErrorEvent(nodeId, errorExecutionId, e.getMessage(), executionContextId);
      eventPublisher.publishEvent(errorEvent);
    }
  }

  /**
   * 子类实现的具体节点逻辑 - 无参数
   * 输入数据已经通过@InputPort注解注入到字段中
   * 输出数据通过@OutputPort注解字段设置
   */
  protected abstract void executeNode();

  /**
   * 根据@InputPort注解注入输入数据
   */
  private void injectInputs(Map<String, Object> inputs) throws Exception {
    for (Field field : this.getClass().getDeclaredFields()) {
      InputPort annotation = field.getAnnotation(InputPort.class);
      if (annotation != null) {
        String portName = annotation.value();
        Object value = inputs.get(portName);
        
        field.setAccessible(true);
        PortValue currentPortValue = (PortValue) field.get(this);
        
        if (currentPortValue != null) {
          // 更新PortValue的值
          PortValue newPortValue = new PortValue(currentPortValue.port(), value);
          field.set(this, newPortValue);
        }
      }
    }
  }

  /**
   * 根据@OutputPort注解收集输出数据
   */
  private Map<String, Object> collectOutputs() throws Exception {
    Map<String, Object> outputs = new java.util.HashMap<>();
    
    for (Field field : this.getClass().getDeclaredFields()) {
      OutputPort annotation = field.getAnnotation(OutputPort.class);
      if (annotation != null) {
        field.setAccessible(true);
        PortValue portValue = (PortValue) field.get(this);
        
        if (portValue != null) {
          outputs.put(portValue.portName(), portValue.getEffectiveValue());
        }
      }
    }
    
    return outputs;
  }

  /** 生成节点执行ID */
  private String generateExecutionId(String nodeId) {
    return nodeId + "_exec_" + System.nanoTime();
  }

  /** 生成错误执行ID */
  private String generateErrorExecutionId(String nodeId) {
    return nodeId + "_exec_error_" + System.nanoTime();
  }

  /** 创建成功事件 */
  private NodeOutputSaveEvent createSuccessEvent(
      String nodeId, String executionId, Map<String, Object> outputs, String executionContextId) {
    return NodeOutputSaveEvent.of(this, nodeId, nodeId, executionId, outputs, executionContextId);
  }

  /** 创建错误事件 */
  private NodeOutputSaveEvent createErrorEvent(
      String nodeId, String errorExecutionId, String errorMessage, String executionContextId) {
    return NodeOutputSaveEvent.of(
        this, nodeId, nodeId, errorExecutionId, Map.of("error", errorMessage), executionContextId);
  }
}
