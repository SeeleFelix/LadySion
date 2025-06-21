package SeeleFelix.AnimaWeave.tools.generator;

import SeeleFelix.AnimaWeave.framework.vessel.AnimaVessel;
import SeeleFelix.AnimaWeave.framework.vessel.NodeDefinition;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabelDefinition;
import SeeleFelix.AnimaWeave.framework.vessel.VesselRegistry;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * AnimaFile生成器 从Java的Vessel定义自动生成.anima文件
 *
 * <p>这是ANTLR逆向生成的功能 - 从解析树/Java代码生成DSL
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnimaFileGenerator {

  private final GeneratorConfig config;

  /** 从vessel生成.anima文件内容 */
  public String generateAnimaContent(AnimaVessel vessel) {
    var containerName = config.extractContainerName(vessel);
    var builder = new StringBuilder();

    if (config.isVerboseLogging()) {
      log.debug("正在为容器 {} 生成.anima内容", containerName);
    }

    // 生成类型定义部分
    builder.append("-- types\n");
    generateTypeDefinitions(vessel.getSupportedLabels(), containerName, builder);
    builder.append("--\n\n");

    // 生成节点定义部分
    builder.append("-- nodes\n");
    generateNodeDefinitions(vessel.getSupportedNodes(), containerName, builder);
    builder.append("--\n\n");

    return builder.toString();
  }

  /** 生成类型定义部分 */
  private void generateTypeDefinitions(
      List<SemanticLabelDefinition> labels, String containerName, StringBuilder builder) {
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

  /** 生成节点定义部分 */
  private void generateNodeDefinitions(
      List<NodeDefinition> nodes, String containerName, StringBuilder builder) {
    for (var node : nodes) {
      builder.append(node.nodeType()).append(" {\n");

      // 默认使用Concurrent模式
      builder.append("    mode Concurrent\n");

      // 输入端口
      builder.append("    in {\n");
      for (var port : node.inputPorts()) {
        builder
            .append("        ")
            .append(port.name())
            .append(" ")
            .append(getQualifiedTypeName(port.semanticLabel(), containerName))
            .append("\n");
      }
      builder.append("    }\n");

      // 输出端口
      builder.append("    out {\n");
      for (var port : node.outputPorts()) {
        builder
            .append("        ")
            .append(port.name())
            .append(" ")
            .append(getQualifiedTypeName(port.semanticLabel(), containerName))
            .append("\n");
      }
      builder.append("    }\n");

      builder.append("}\n\n");
    }
  }

  /** 检查类型是否有复杂结构 */
  private boolean hasComplexStructure(SemanticLabelDefinition label) {
    // 根据类型名称判断是否为复合类型
    return switch (label.labelName()) {
      case "UUID", "Prompt", "Prompts" -> true;
      default -> false;
    };
  }

  /** 生成复杂类型结构 */
  private void generateComplexTypeStructure(SemanticLabelDefinition label, StringBuilder builder) {
    switch (label.labelName()) {
      case "UUID" -> builder.append("    String\n");
      case "Prompt" -> builder.append("    String\n");
      case "Prompts" -> builder.append("    Prompt\n");
    }
  }

  /** 获取限定类型名称，动态使用容器名称 */
  private String getQualifiedTypeName(SemanticLabelDefinition label, String containerName) {
    return containerName + "." + label.labelName();
  }

  /** 将vessel的定义保存为.anima文件 */
  public void saveToFile(AnimaVessel vessel, Path outputPath) throws IOException {
    var content = generateAnimaContent(vessel);

    // 检查是否应该覆盖现有文件
    if (!config.isOverwriteExisting() && Files.exists(outputPath)) {
      log.warn("文件 {} 已存在且配置为不覆盖，跳过生成", outputPath);
      return;
    }

    // 确保目录存在
    var parent = outputPath.getParent();
    if (parent != null && !Files.exists(parent)) {
      Files.createDirectories(parent);
      if (config.isVerboseLogging()) {
        log.debug("创建目录: {}", parent);
      }
    }

    // 写入文件
    Files.writeString(
        outputPath, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

    log.info("生成.anima文件: {}", outputPath);

    // 验证生成的文件
    if (config.isValidateAfterGeneration() && !validateGeneratedFile(outputPath)) {
      throw new IOException("生成的文件验证失败: " + outputPath);
    }
  }

  /** 使用配置自动确定输出路径并保存 */
  public void saveToFile(AnimaVessel vessel) throws IOException {
    var outputPath = config.getOutputPath(vessel);
    saveToFile(vessel, outputPath);
  }

  /** 批量生成所有已注册vessel的.anima文件 */
  public void generateAllVesselFiles(VesselRegistry registry, Optional<Path> customOutputDir) {
    try {
      var outputDir = customOutputDir.orElse(config.getOutputDirectoryPath());
      log.info("🔨 开始生成所有vessel的.anima文件到目录: {}", outputDir);

      var vesselNames = registry.getVesselNames();
      log.info("发现 {} 个vessel: {}", vesselNames.size(), vesselNames);

      for (var vesselName : vesselNames) {
        var vessel = registry.getVessel(vesselName);
        if (vessel.isPresent()) {
          try {
            saveToFile(vessel.get());
          } catch (IOException e) {
            log.error("生成{}的.anima文件失败", vesselName, e);
          }
        } else {
          log.warn("Vessel {} 未找到", vesselName);
        }
      }

      log.info("✅ 完成所有vessel的.anima文件生成");
    } catch (Exception e) {
      log.error("❌ 批量生成vessel文件失败", e);
    }
  }

  /** 验证生成的.anima文件语法 */
  public boolean validateGeneratedFile(Path animaFile) {
    try {
      var content = Files.readString(animaFile);

      // 基本语法检查
      var isValid =
          content.contains("-- types") && content.contains("-- nodes") && content.contains("--");

      if (config.isVerboseLogging()) {
        log.debug("文件 {} 验证结果: {}", animaFile, isValid ? "通过" : "失败");
      }

      return isValid;

    } catch (IOException e) {
      log.error("验证.anima文件失败: {}", animaFile, e);
      return false;
    }
  }

  /** 创建独立使用的实例（不依赖Spring） */
  public static AnimaFileGenerator standalone(GeneratorConfig config) {
    return new AnimaFileGenerator(config);
  }
}
