package SeeleFelix.AnimaWeave.tools.generator;

import SeeleFelix.AnimaWeave.framework.vessel.*;
import SeeleFelix.AnimaWeave.tools.generator.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.test.context.TestPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Anima文件生成器集成测试
 * 
 * 测试场景：
 * 1. 注册一个测试vessel
 * 2. 运行生成器 
 * 3. 验证生成的.anima文件内容
 */
@SpringBootTest(classes = {
    AnimaGeneratorTest.TestConfig.class,
    AnimaGeneratorTest.TestMathVessel.class,
    AnimaFileGenerator.class,
    VesselRegistryImpl.class,
    GeneratorConfig.class
})
class AnimaGeneratorTest {

    @Autowired
    private AnimaFileGenerator generator;
    
    @Autowired
    private VesselRegistry vesselRegistry;
    
    @Autowired
    private ApplicationContext applicationContext;
    
    @TempDir
    Path tempDir;
    
    @BeforeEach
    void setUp() {
        // 清空注册表
        vesselRegistry.getVesselNames().forEach(vesselRegistry::unregister);
    }

    @Test
    void shouldGenerateAnimaFileForRegisteredVessel() throws Exception {
        System.out.println("🧪 开始测试Anima文件生成...");
        
        // 1. 自动发现并注册测试vessel
        discoverAndRegisterTestVessels();
        
        // 2. 验证vessel已注册
        assertThat(vesselRegistry.getVesselNames()).contains("test-math");
        assertThat(vesselRegistry.getAllVessels()).hasSize(1);
        
        // 3. 创建临时输出目录
        Path outputDir = tempDir.resolve("generated");
        Files.createDirectories(outputDir);
        
        // 4. 运行生成器（模拟gradle task的调用方式）
        runGeneratorLikeGradleTask();
        
        // 5. 验证生成的文件
        // 先检查实际的生成位置（从日志看是使用了默认的sanctums目录）
        Path actualOutputDir = Path.of("sanctums");
        Path generatedFile = actualOutputDir.resolve("testmath.anima");
        assertThat(generatedFile).exists();
        
        System.out.println("🔍 实际生成的文件: " + generatedFile.toAbsolutePath());
        
        // 6. 验证文件内容
        String content = Files.readString(generatedFile);
        verifyGeneratedContent(content);
        
        System.out.println("🎉 测试完成，生成的文件: " + generatedFile);
        
        // 7. 清理测试生成的临时文件
        cleanupTestFiles(generatedFile);
        System.out.println("🧹 测试文件已清理");
    }
    
    /**
     * 模拟gradle task的vessel发现和注册过程
     */
    private void discoverAndRegisterTestVessels() {
        Map<String, AnimaVessel> vesselBeans = applicationContext.getBeansOfType(AnimaVessel.class);
        
        System.out.println("发现 " + vesselBeans.size() + " 个vessel bean");
        
        vesselBeans.forEach((beanName, vessel) -> {
            String vesselId = vessel.getMetadata().name();
            vesselRegistry.register(vesselId, vessel);
            System.out.println("✓ 注册vessel: " + vesselId + " (" + beanName + ")");
        });
    }
    
    /**
     * 模拟gradle task运行生成器的方式
     */
    private void runGeneratorLikeGradleTask() throws IOException {
        System.out.println("⚡ 启动生成器（模拟gradle调用）...");
        
        // 直接使用配置好的generator，它会使用@TestPropertySource中的配置
        generator.generateAllVesselFiles(vesselRegistry);
        System.out.println("📁 生成完成");
    }
    
    /**
     * 验证生成的.anima文件内容
     */
    private void verifyGeneratedContent(String content) {
        System.out.println("🔍 验证生成的内容...");
        
        // 验证基本结构
        assertThat(content).contains("-- types");
        assertThat(content).contains("-- nodes");
        assertThat(content).contains("--");
        
        // 验证测试vessel的特定内容
        assertThat(content).contains("Number");
        assertThat(content).contains("Add");
        assertThat(content).contains("Multiply");
        
        // 验证端口定义
        assertThat(content).contains("in {");
        assertThat(content).contains("out {");
        
        System.out.println("✅ 内容验证通过");
    }
    
    /**
     * 清理测试生成的文件
     */
    private void cleanupTestFiles(Path generatedFile) {
        try {
            if (Files.exists(generatedFile)) {
                Files.delete(generatedFile);
                System.out.println("🗑️ 已删除测试文件: " + generatedFile.getFileName());
            }
            
            // 如果是在sanctums目录中的测试文件，额外清理
            Path sanctumsDir = Path.of("sanctums");
            if (Files.exists(sanctumsDir)) {
                try (var stream = Files.list(sanctumsDir)) {
                    stream.filter(path -> path.getFileName().toString().contains("testmath"))
                          .forEach(path -> {
                              try {
                                  Files.delete(path);
                                  System.out.println("🗑️ 已删除测试文件: " + path.getFileName());
                              } catch (IOException e) {
                                  System.out.println("⚠️ 清理文件失败: " + path.getFileName() + " - " + e.getMessage());
                              }
                          });
                }
            }
        } catch (IOException e) {
            System.out.println("⚠️ 清理过程中发生错误: " + e.getMessage());
        }
    }

    /**
     * 测试用的数学vessel
     */
    @Component
    public static class TestMathVessel implements AnimaVessel {
        
        @Override
        public VesselMetadata getMetadata() {
            return VesselMetadata.of(
                "test-math", 
                "1.0.0", 
                "测试用的数学运算容器"
            );
        }
        
        @Override
        public List<SemanticLabelDefinition> getSupportedLabels() {
            return List.of(
                SemanticLabelDefinition.of("Number", Double.class),
                SemanticLabelDefinition.of("Signal", Boolean.class)
            );
        }
        
        @Override
        public List<NodeDefinition> getSupportedNodes() {
            return List.of(
                NodeDefinition.withDescription(
                    "Add",
                    "加法节点",
                    "计算两个数的和",
                    List.of(
                        PortDefinition.required("a", "第一个数", getLabel("Number")),
                        PortDefinition.required("b", "第二个数", getLabel("Number")),
                        PortDefinition.required("trigger", "触发信号", getLabel("Signal"))
                    ),
                    List.of(
                        PortDefinition.required("result", "结果", getLabel("Number")),
                        PortDefinition.required("done", "完成信号", getLabel("Signal"))
                    )
                ),
                
                NodeDefinition.withDescription(
                    "Multiply",
                    "乘法节点", 
                    "计算两个数的乘积",
                    List.of(
                        PortDefinition.required("x", "乘数", getLabel("Number")),
                        PortDefinition.required("y", "被乘数", getLabel("Number")),
                        PortDefinition.required("trigger", "触发信号", getLabel("Signal"))
                    ),
                    List.of(
                        PortDefinition.required("product", "乘积", getLabel("Number")),
                        PortDefinition.required("done", "完成信号", getLabel("Signal"))
                    )
                )
            );
        }
        
        @Override
        public void initialize(VesselContext context) {
            System.out.println("初始化测试数学容器");
        }
        
        @Override
        public void shutdown() {
            System.out.println("关闭测试数学容器");
        }
        
        @Override
        public VesselStatus getStatus() {
            return VesselStatus.RUNNING;
        }
        
        private SemanticLabelDefinition getLabel(String name) {
            return getSupportedLabels().stream()
                .filter(label -> label.labelName().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Label not found: " + name));
        }
    }
    
    /**
     * 测试配置类
     */
    public static class TestConfig {
        // Spring会自动扫描@Component注解的TestMathVessel
    }
} 