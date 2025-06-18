package SeeleFelix.AnimaWeave.framework.vessel;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AnimaFile生成器
 * 从Java的Vessel定义自动生成.anima文件
 * 
 * 这是ANTLR逆向生成的功能 - 从解析树/Java代码生成DSL
 */
@Slf4j
public class AnimaFileGenerator {
    
    /**
     * 从vessel生成.anima文件内容
     */
    public static String generateAnimaContent(AnimaVessel vessel) {
        var builder = new StringBuilder();
        
        // 生成类型定义部分
        builder.append("-- types\n");
        generateTypeDefinitions(vessel.getSupportedLabels(), builder);
        builder.append("--\n\n");
        
        // 生成节点定义部分
        builder.append("-- nodes\n");
        generateNodeDefinitions(vessel.getSupportedNodes(), builder);
        builder.append("--\n\n");
        
        return builder.toString();
    }
    
    /**
     * 生成类型定义部分
     */
    private static void generateTypeDefinitions(List<SemanticLabelDefinition> labels, StringBuilder builder) {
        for (var label : labels) {
            builder.append(label.labelName());
            
            // 检查是否有复合类型结构
            if (hasComplexStructure(label)) {
                builder.append(" {\n");
                generateComplexTypeStructure(label, builder);
                builder.append("}");
            }
            
            builder.append("\n");
        }
    }
    
    /**
     * 生成节点定义部分
     */
    private static void generateNodeDefinitions(List<NodeDefinition> nodes, StringBuilder builder) {
        for (var node : nodes) {
            builder.append(node.nodeType()).append(" {\n");
            
            // 默认使用Concurrent模式
            builder.append("    mode Concurrent\n");
            
            // 输入端口
            builder.append("    in {\n");
            for (var port : node.inputPorts()) {
                builder.append("        ")
                       .append(port.name())
                       .append(" ")
                       .append(getQualifiedTypeName(port.semanticLabel()))
                       .append("\n");
            }
            builder.append("    }\n");
            
            // 输出端口
            builder.append("    out {\n");
            for (var port : node.outputPorts()) {
                builder.append("        ")
                       .append(port.name())
                       .append(" ")
                       .append(getQualifiedTypeName(port.semanticLabel()))
                       .append("\n");
            }
            builder.append("    }\n");
            
            builder.append("}\n\n");
        }
    }
    
    /**
     * 检查类型是否有复杂结构
     */
    private static boolean hasComplexStructure(SemanticLabelDefinition label) {
        // 根据类型名称判断是否为复合类型
        return switch (label.labelName()) {
            case "UUID", "Prompt", "Prompts" -> true;
            default -> false;
        };
    }
    
    /**
     * 生成复杂类型结构
     */
    private static void generateComplexTypeStructure(SemanticLabelDefinition label, StringBuilder builder) {
        switch (label.labelName()) {
            case "UUID" -> builder.append("    String\n");
            case "Prompt" -> builder.append("    String\n");
            case "Prompts" -> builder.append("    Prompt\n");
        }
    }
    
    /**
     * 获取限定类型名称
     */
    private static String getQualifiedTypeName(SemanticLabelDefinition label) {
        // 默认为basic容器，可以根据需要扩展
        return "basic." + label.labelName();
    }
    
    /**
     * 将vessel的定义保存为.anima文件
     */
    public static void saveToFile(AnimaVessel vessel, Path outputPath) throws IOException {
        var content = generateAnimaContent(vessel);
        
        // 确保目录存在
        var parent = outputPath.getParent();
        if (parent != null && !Files.exists(parent)) {
            Files.createDirectories(parent);
        }
        
        // 写入文件
        Files.writeString(outputPath, content, 
                         StandardOpenOption.CREATE, 
                         StandardOpenOption.TRUNCATE_EXISTING);
        
        log.info("Generated .anima file: {}", outputPath);
    }
    
    /**
     * 批量生成所有已注册vessel的.anima文件
     */
    public static void generateAllVesselFiles(VesselRegistry registry, Path outputDirectory) {
        try {
            for (var vesselName : registry.getVesselNames()) {
                var vessel = registry.getVessel(vesselName);
                if (vessel.isPresent()) {
                    var fileName = vesselName + ".anima";
                    var outputPath = outputDirectory.resolve(fileName);
                    saveToFile(vessel.get(), outputPath);
                }
            }
            log.info("Generated .anima files for all vessels in directory: {}", outputDirectory);
        } catch (IOException e) {
            log.error("Failed to generate vessel files", e);
        }
    }
    
    /**
     * 验证生成的.anima文件语法
     */
    public static boolean validateGeneratedFile(Path animaFile) {
        try {
            var content = Files.readString(animaFile);
            
            // 基本语法检查
            return content.contains("-- types") && 
                   content.contains("-- nodes") &&
                   content.contains("--");
                   
        } catch (IOException e) {
            log.error("Failed to validate .anima file: {}", animaFile, e);
            return false;
        }
    }
} 