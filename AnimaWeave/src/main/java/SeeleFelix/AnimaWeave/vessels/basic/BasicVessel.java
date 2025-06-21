package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;
import SeeleFelix.AnimaWeave.framework.vessel.*;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Basic Vessel - 基础容器实现 提供基础数据类型和基本操作节点
 *
 * <p>使用Spring依赖注入，不需要通过VesselContext传递依赖 对应 basic.anima 文件中的定义
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BasicVessel implements AnimaVessel {

  private VesselStatus status = VesselStatus.STOPPED;

  @Override
  public VesselMetadata getMetadata() {
    return new VesselMetadata("basic", "1.0.0", "提供基础数据类型和基本操作节点的核心容器", "SeeleFelix", List.of(), "1.0.0");
  }

  @Override
  public List<SemanticLabelDefinition> getSupportedLabels() {
    // 先创建基础类型（无依赖）
    var signal = new SemanticLabelDefinition("Signal", Set.of(), Function.identity());
    var intType = new SemanticLabelDefinition("Int", Set.of(), Function.identity());
    var boolType = new SemanticLabelDefinition("Bool", Set.of(), Function.identity());
    var prompt = new SemanticLabelDefinition("Prompt", Set.of(), Function.identity());
    var prompts = new SemanticLabelDefinition("Prompts", Set.of(), Function.identity());
    
    // 创建有依赖关系的类型
    var stringType = new SemanticLabelDefinition("String", Set.of(intType, boolType), createStringConverter());
    var uuidType = new SemanticLabelDefinition("UUID", Set.of(stringType), Function.identity());
    
    return List.of(signal, intType, boolType, stringType, uuidType, prompt, prompts);
  }

  @Override
  public List<NodeDefinition> getSupportedNodes() {
    return List.of(
        // Start节点
        new NodeDefinition(
            "Start",
            "启动节点",
            "图执行的起始点，生成执行ID和信号",
            List.of(), // 无输入端口
            List.of(
                new PortDefinition("signal", "信号", getLabel("Signal"), true, null),
                new PortDefinition("execution_id", "执行ID", getLabel("UUID"), true, null))),

        // GetTimestamp节点
        new NodeDefinition(
            "GetTimestamp",
            "获取时间戳",
            "获取当前时间戳",
            List.of(new PortDefinition("trigger", "触发信号", getLabel("Signal"), true, null)),
            List.of(
                new PortDefinition("timestamp", "时间戳", getLabel("Int"), true, null),
                new PortDefinition("done", "完成信号", getLabel("Signal"), true, null))),

        // IsEven节点
        new NodeDefinition(
            "IsEven",
            "判断偶数",
            "判断一个数字是否为偶数",
            List.of(
                new PortDefinition("number", "数字", getLabel("Int"), true, null),
                new PortDefinition("trigger", "触发信号", getLabel("Signal"), true, null)),
            List.of(
                new PortDefinition("result", "结果", getLabel("Bool"), true, null),
                new PortDefinition("done", "完成信号", getLabel("Signal"), true, null))),

        // FormatNumber节点
        new NodeDefinition(
            "FormatNumber",
            "格式化数字",
            "将数字格式化为字符串",
            List.of(
                new PortDefinition("number", "数字", getLabel("Int"), true, null),
                new PortDefinition("trigger", "触发信号", getLabel("Signal"), true, null)),
            List.of(
                new PortDefinition("formatted", "格式化结果", getLabel("String"), true, null),
                new PortDefinition("done", "完成信号", getLabel("Signal"), true, null))),

        // CreatePrompt节点
        new NodeDefinition(
            "CreatePrompt",
            "创建提示",
            "创建一个提示对象",
            List.of(
                new PortDefinition("name", "名称", getLabel("String"), true, null),
                new PortDefinition("content", "内容", getLabel("String"), true, null),
                new PortDefinition("trigger", "触发信号", getLabel("Signal"), true, null)),
            List.of(
                new PortDefinition("prompt", "提示对象", getLabel("Prompt"), true, null),
                new PortDefinition("done", "完成信号", getLabel("Signal"), true, null))),

        // StringFormatter节点
        new NodeDefinition(
            "StringFormatter",
            "字符串格式化",
            "格式化字符串",
            List.of(
                new PortDefinition("input", "输入字符串", getLabel("String"), true, null),
                new PortDefinition("trigger", "触发信号", getLabel("Signal"), true, null)),
            List.of(
                new PortDefinition("formatted", "格式化结果", getLabel("String"), true, null),
                new PortDefinition("done", "完成信号", getLabel("Signal"), true, null))),

        // DataProcessor节点
        new NodeDefinition(
            "DataProcessor",
            "数据处理器",
            "处理数据并返回结果",
            List.of(new PortDefinition("execute", "执行信号", getLabel("Signal"), true, null)),
            List.of(
                new PortDefinition("result", "处理结果", getLabel("String"), true, null),
                new PortDefinition("done", "完成信号", getLabel("Signal"), true, null))),

        // CompletionMarker节点
        new NodeDefinition(
            "CompletionMarker",
            "完成标记",
            "标记处理完成并记录时间戳",
            List.of(new PortDefinition("trigger", "触发信号", getLabel("Signal"), true, null)),
            List.of(
                new PortDefinition("completed", "完成信号", getLabel("Signal"), true, null),
                new PortDefinition("timestamp", "时间戳", getLabel("Int"), true, null))));
  }

  @Override
  public void initialize(VesselContext context) {
    log.info("🔌 初始化Basic容器 v{}", getMetadata().version());
    this.status = VesselStatus.RUNNING;
  }

  @Override
  public void shutdown() {
    log.info("🔌 关闭Basic容器");
    this.status = VesselStatus.STOPPED;
  }

  @Override
  public VesselStatus getStatus() {
    return status;
  }

  // ========== 辅助方法 ==========

  private SemanticLabelDefinition getLabel(String labelName) {
    return getSupportedLabels().stream()
        .filter(label -> label.labelName().equals(labelName))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unknown label: " + labelName));
  }

  private Function<Object, Object> createStringConverter() {
    return value -> {
      if (value instanceof String str) {
        // 尝试转换为整数
        try {
          return Integer.parseInt(str);
        } catch (NumberFormatException e) {
          // 尝试转换为布尔值
          return Boolean.parseBoolean(str);
        }
      }
      return value;
    };
  }

  // ========== 内部数据类型 ==========

  /** Prompt数据类型 */
  public record PromptData(String id, String name, String content) {
    public static PromptData of(String name, String content) {
      return new PromptData(UUID.randomUUID().toString(), name, content);
    }
  }
}
