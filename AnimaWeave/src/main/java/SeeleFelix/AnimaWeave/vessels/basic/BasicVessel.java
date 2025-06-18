package SeeleFelix.AnimaWeave.vessels.basic;

import SeeleFelix.AnimaWeave.framework.vessel.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.function.Function;

/**
 * Basic Vessel - 基础容器实现
 * 提供基础数据类型和基本操作节点
 * 
 * 对应 basic.anima 文件中的定义
 */
@Slf4j
@Component
public class BasicVessel implements AnimaVessel {
    
    private VesselStatus status = VesselStatus.STOPPED;
    
    @Override
    public VesselMetadata getMetadata() {
        return VesselMetadata.of(
            "basic", 
            "1.0.0", 
            "提供基础数据类型和基本操作节点的核心容器",
            "SeeleFelix"
        );
    }
    
    @Override
    public List<SemanticLabelDefinition> getSupportedLabels() {
        return List.of(
            // Signal - 布尔信号类型
            SemanticLabelDefinition.of("Signal", Boolean.class),
            
            // Int - 整数类型
            SemanticLabelDefinition.of("Int", Integer.class),
            
            // Bool - 布尔类型
            SemanticLabelDefinition.of("Bool", Boolean.class),
            
            // String - 字符串类型，可以转换为其他类型
            SemanticLabelDefinition.of(
                "String", 
                String.class,
                List.of("Int", "Bool"),
                createStringConverter()
            ),
            
            // UUID - UUID类型，内部结构为String
            SemanticLabelDefinition.of("UUID", String.class),
            
            // Prompt - 提示类型，内部结构为String
            SemanticLabelDefinition.of("Prompt", PromptData.class),
            
            // Prompts - 提示数组类型
            SemanticLabelDefinition.of("Prompts", PromptData[].class)
        );
    }
    
    @Override
    public List<NodeDefinition> getSupportedNodes() {
        return List.of(
            // Start节点
            NodeDefinition.withDescription(
                "Start",
                "启动节点",
                "图执行的起始点，生成执行ID和信号",
                List.of(), // 无输入端口
                List.of(
                    PortDefinition.required("signal", "信号", getLabel("Signal")),
                    PortDefinition.required("execution_id", "执行ID", getLabel("UUID"))
                )
            ),
            
            // GetTimestamp节点
            NodeDefinition.withDescription(
                "GetTimestamp",
                "获取时间戳",
                "获取当前时间戳",
                List.of(
                    PortDefinition.required("trigger", "触发信号", getLabel("Signal"))
                ),
                List.of(
                    PortDefinition.required("timestamp", "时间戳", getLabel("Int")),
                    PortDefinition.required("done", "完成信号", getLabel("Signal"))
                )
            ),
            
            // IsEven节点
            NodeDefinition.withDescription(
                "IsEven",
                "判断偶数",
                "判断一个数字是否为偶数",
                List.of(
                    PortDefinition.required("number", "数字", getLabel("Int")),
                    PortDefinition.required("trigger", "触发信号", getLabel("Signal"))
                ),
                List.of(
                    PortDefinition.required("result", "结果", getLabel("Bool")),
                    PortDefinition.required("done", "完成信号", getLabel("Signal"))
                )
            ),
            
            // FormatNumber节点
            NodeDefinition.withDescription(
                "FormatNumber",
                "格式化数字",
                "将数字格式化为字符串",
                List.of(
                    PortDefinition.required("number", "数字", getLabel("Int")),
                    PortDefinition.required("trigger", "触发信号", getLabel("Signal"))
                ),
                List.of(
                    PortDefinition.required("formatted", "格式化结果", getLabel("String")),
                    PortDefinition.required("done", "完成信号", getLabel("Signal"))
                )
            ),
            
            // CreatePrompt节点
            NodeDefinition.withDescription(
                "CreatePrompt",
                "创建提示",
                "创建一个提示对象",
                List.of(
                    PortDefinition.required("name", "名称", getLabel("String")),
                    PortDefinition.required("content", "内容", getLabel("String")),
                    PortDefinition.required("trigger", "触发信号", getLabel("Signal"))
                ),
                List.of(
                    PortDefinition.required("prompt", "提示对象", getLabel("Prompt")),
                    PortDefinition.required("done", "完成信号", getLabel("Signal"))
                )
            ),
            
            // StringFormatter节点
            NodeDefinition.withDescription(
                "StringFormatter",
                "字符串格式化",
                "格式化字符串",
                List.of(
                    PortDefinition.required("input", "输入字符串", getLabel("String")),
                    PortDefinition.required("trigger", "触发信号", getLabel("Signal"))
                ),
                List.of(
                    PortDefinition.required("formatted", "格式化结果", getLabel("String")),
                    PortDefinition.required("done", "完成信号", getLabel("Signal"))
                )
            ),
            
            // DataProcessor节点
            NodeDefinition.withDescription(
                "DataProcessor",
                "数据处理器",
                "处理数据并返回结果",
                List.of(
                    PortDefinition.required("execute", "执行信号", getLabel("Signal"))
                ),
                List.of(
                    PortDefinition.required("result", "处理结果", getLabel("String")),
                    PortDefinition.required("done", "完成信号", getLabel("Signal"))
                )
            ),
            
            // CompletionMarker节点
            NodeDefinition.withDescription(
                "CompletionMarker",
                "完成标记",
                "标记处理完成并记录时间戳",
                List.of(
                    PortDefinition.required("trigger", "触发信号", getLabel("Signal"))
                ),
                List.of(
                    PortDefinition.required("completed", "完成信号", getLabel("Signal")),
                    PortDefinition.required("timestamp", "时间戳", getLabel("Int"))
                )
            )
        );
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
    
    /**
     * Prompt数据类型
     */
    public record PromptData(
        String id,
        String name,
        String content
    ) {
        public static PromptData of(String name, String content) {
            return new PromptData(UUID.randomUUID().toString(), name, content);
        }
    }
} 