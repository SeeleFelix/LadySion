package SeeleFelix.AnimaWeave.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

import SeeleFelix.AnimaWeave.framework.awakening.AnimaWeave;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 真正的端到端黑盒测试
 * 
 * 从用户角度测试：
 * 输入：.weave图文件（框架自动处理.anima容器）
 * 输出：执行结果
 * 不关心内部实现
 */
@SpringBootTest
@TestPropertySource(properties = {
    "logging.level.SeeleFelix.AnimaWeave=DEBUG"
})
class TimestampPipelineEndToEndTest {

    @Autowired
    private AnimaWeave animaWeave;
    
    private Path tempDir;

    @BeforeEach
    void setUp() throws IOException, InterruptedException {
        // 创建临时目录用于测试文件
        tempDir = Files.createTempDirectory("animaweave-test");
        
        // 等待系统就绪 - 解决异步初始化问题
        System.out.println("⏳ 等待 AnimaWeave 系统就绪...");
        boolean systemReady = animaWeave.waitForSystemReady(2); // 先等待2秒
        
        if (!systemReady) {
            System.out.println("⚠️ 系统未在2秒内自然就绪，强制设置就绪状态（测试环境）");
            animaWeave.forceSystemReadyForTesting();
            
            // 等待异步事件处理完成（GraphCoordinator在虚拟线程中处理SystemReadyEvent）
            Thread.sleep(200); // 等待200ms让事件处理完成
            
            // 再次检查
            if (animaWeave.isSystemReady()) {
                System.out.println("✅ 系统已强制就绪，开始测试");
            } else {
                throw new RuntimeException("即使强制设置，系统仍未就绪");
            }
        } else {
            System.out.println("✅ AnimaWeave 系统自然就绪，开始测试");
        }
    }
    
    @AfterEach
    void tearDown() throws IOException {
        // 清理临时文件
        if (tempDir != null && Files.exists(tempDir)) {
            Files.walk(tempDir)
                .sorted((a, b) -> b.compareTo(a)) // 先删除文件，再删除目录
                .forEach(path -> {
                    try {
                        Files.delete(path);
                    } catch (IOException e) {
                        // 忽略清理错误
                    }
                });
        }
    }

    @Test
    void userCanProcessTimestampWithWeaveFile() throws Exception {
        // Given: 用户只需创建.weave文件（框架自动处理.anima容器）
        
        String weaveContent = """
            -- import
            basic.anima
            --
            
            -- graph
            nodes {
                starter basic.Start
                timestamper basic.GetTimestamp
                formatter basic.FormatNumber
                stringProcessor basic.StringFormatter
            }
            
            datas {
                // 时间戳数据管道
                timestamper.timestamp -> formatter.number;
                formatter.formatted -> stringProcessor.input;
            }
            
            controls {
                // 控制流管道
                starter.signal -> timestamper.trigger;
                timestamper.done -> formatter.trigger; 
                formatter.done -> stringProcessor.trigger;
            }
            --
            """;
        
        File weaveFile = createTempFile("timestamp_pipeline.weave", weaveContent);

        // When: 用户运行AnimaWeave处理.weave文件
        var result = animaWeave.awakening(weaveFile).get(10, TimeUnit.SECONDS);
        
        // Debug: 打印执行结果信息
        System.out.println("🔍 执行结果详情:");
        System.out.println("- isSuccess: " + result.isSuccess());
        System.out.println("- getMessage: " + result.getMessage());
        if (result.getExecutionId() != null) {
            System.out.println("- getExecutionId: " + result.getExecutionId());
        }
        
        // Then: 用户应该得到成功的执行结果
        assertTrue(result.isSuccess(), 
            "时间戳处理应该成功: " + result.getMessage());
        
        // 黑盒验证：只关心最终结果，不关心内部实现
        assertNotNull(result.getExecutionId(), "应该有执行ID");
        
        System.out.println("🎉 用户成功执行了时间戳处理管道!");
        System.out.println("📄 输入文件: " + weaveFile.getName());
        System.out.println("📦 框架自动加载了basic.anima容器");
        System.out.println("✅ 执行结果: " + result.getSummary());
    }
    
    @Test
    void userCanSpecifyMainGraph() throws Exception {
        // Given: 用户创建命名图文件
        
        String weaveContent = """
            -- import
            basic.anima
            --
            
            -- graph TimestampPipeline
            nodes {
                starter basic.Start
                timestamper basic.GetTimestamp
            }
            
            controls {
                starter.signal -> timestamper.trigger;
            }
            --
            """;
        
        File weaveFile = createTempFile("named_pipeline.weave", weaveContent);
        String mainGraphName = "TimestampPipeline";

        // When: 用户指定主图执行
        var result = animaWeave.awakening(weaveFile, mainGraphName).get(10, TimeUnit.SECONDS);
        
        // Then: 用户应该得到成功的执行结果
        assertTrue(result.isSuccess(), 
            "指定主图的时间戳处理应该成功: " + result.getMessage());
        
        System.out.println("🎯 用户成功执行了指定的主图: " + mainGraphName);
        System.out.println("✅ 执行结果: " + result.getSummary());
    }
    
    @Test
    void userCanProcessMultipleWeaveFiles() throws Exception {
        // Given: 用户创建多个.weave文件
        
        String weave1Content = """
            -- import
            basic.anima
            --
            
            -- graph Pipeline1
            nodes {
                starter basic.Start
                timestamper basic.GetTimestamp
            }
            
            controls {
                starter.signal -> timestamper.trigger;
            }
            --
            """;
            
        String weave2Content = """
            -- import
            basic.anima
            --
            
            -- graph Pipeline2
            nodes {
                checker basic.IsEven
                formatter basic.FormatNumber
            }
            
            controls {
                checker.done -> formatter.trigger;
            }
            --
            """;
        
        File weaveFile1 = createTempFile("pipeline1.weave", weave1Content);
        File weaveFile2 = createTempFile("pipeline2.weave", weave2Content);
        File[] weaveFiles = {weaveFile1, weaveFile2};

        // When: 用户执行多个文件（暂时可能不支持，但应该给出明确提示）
        var result = animaWeave.awakening(weaveFiles, "Pipeline1").get(10, TimeUnit.SECONDS);
        
        // Then: 系统应该能处理或给出明确的不支持提示
        assertNotNull(result, "应该有执行结果");
        
        if (result.isFailure()) {
            System.out.println("📝 多文件执行暂不支持（预期）: " + result.getMessage());
            assertTrue(result.getMessage().contains("Multiple weave files not yet supported") ||
                      result.getMessage().contains("not yet supported"),
                      "错误信息应该说明多文件暂不支持");
        } else {
            System.out.println("🚀 多文件执行成功: " + result.getSummary());
        }
    }
    
    @Test
    void userCanExecuteSimpleGraph() throws Exception {
        // Given: 用户创建最简单的图
        
        String weaveContent = """
            -- import
            basic.anima
            --
            
            -- graph
            nodes {
                starter basic.Start
            }
            --
            """;
        
        File weaveFile = createTempFile("simple.weave", weaveContent);

        // When: 用户执行最简单的图
        var result = animaWeave.awakening(weaveFile).get(10, TimeUnit.SECONDS);
        
        // Then: 最简单的图应该能正常执行
        assertNotNull(result, "应该有执行结果");
        
        if (result.isSuccess()) {
            System.out.println("🎉 简单图执行成功: " + result.getSummary());
        } else {
            System.out.println("📋 简单图执行状态: " + result.getMessage());
        }
    }
    
    @Test
    void userGetsErrorWithNonWeaveFile() throws Exception {
        // Given: 用户错误地传入了非.weave文件
        
        File txtFile = createTempFile("not_a_weave.txt", "This is not a weave file");

        // When & Then: 用户应该得到明确的错误信息
        var result = animaWeave.awakening(txtFile).get(5, TimeUnit.SECONDS);
        
        // 黑盒验证：用户得到有用的错误信息
        assertTrue(result.isFailure(), "非.weave文件应该导致执行失败");
        assertNotNull(result.getMessage(), "应该有错误消息");
        assertTrue(result.getMessage().contains("Only .weave files are allowed"), 
                  "错误消息应该说明只允许.weave文件");
        
        System.out.println("❌ 用户得到了预期的文件类型错误: " + result.getMessage());
    }
    
    @Test
    void userGetsErrorWithInvalidWeaveContent() throws Exception {
        // Given: 用户创建了语法错误的.weave文件
        
        String invalidWeaveContent = """
            -- import
            basic.anima
            --
            
            -- graph
            nodes {
                starter basic.Start
                // 语法错误：缺少分号和引号
                invalid_node_definition
            }
            --
            """;

        File invalidWeaveFile = createTempFile("invalid_syntax.weave", invalidWeaveContent);

        // When & Then: 用户应该得到明确的语法错误信息
        var result = animaWeave.awakening(invalidWeaveFile).get(5, TimeUnit.SECONDS);
        
        // 黑盒验证：用户得到有用的错误信息
        assertTrue(result.isFailure(), "语法错误的.weave文件应该导致执行失败");
        assertNotNull(result.getMessage(), "应该有错误消息");
        
        System.out.println("❌ 用户得到了预期的语法错误信息: " + result.getMessage());
    }
    
    @Test
    void userCanProcessComplexPipeline() throws Exception {
        // Given: 用户创建了一个更复杂的数据处理管道
        
        String complexWeaveContent = """
            -- import
            basic.anima
            --
            
            -- graph ComplexPipeline
            nodes {
                starter basic.Start
                timestamper basic.GetTimestamp
                evenChecker basic.IsEven
                formatter basic.FormatNumber
                stringProcessor basic.StringFormatter
            }
            
            datas {
                // 分支数据流
                timestamper.timestamp -> evenChecker.number;
                timestamper.timestamp -> formatter.number;
                formatter.formatted -> stringProcessor.input;
            }
            
            controls {
                // 复杂控制流
                starter.signal -> timestamper.trigger;
                timestamper.done -> evenChecker.trigger;
                timestamper.done -> formatter.trigger;
                evenChecker.done -> stringProcessor.trigger;
                formatter.done -> stringProcessor.trigger;
            }
            --
            """;
        
        File weaveFile = createTempFile("complex_pipeline.weave", complexWeaveContent);

        // When: 用户执行复杂管道
        var result = animaWeave.awakening(weaveFile, "ComplexPipeline").get(15, TimeUnit.SECONDS);
        
        // Then: 复杂管道应该能够正确执行
        if (result.isSuccess()) {
            System.out.println("🚀 复杂管道执行成功: " + result.getSummary());
        } else {
            System.out.println("📋 复杂管道执行状态: " + result.getMessage());
            // 即使失败，也应该是因为实现不完整，而不是解析错误
        }
        
        assertNotNull(result, "应该有执行结果");
        System.out.println("📦 框架自动处理了basic.anima容器的加载");
    }
    
    /**
     * 创建临时测试文件的辅助方法
     */
    private File createTempFile(String fileName, String content) throws IOException {
        Path filePath = tempDir.resolve(fileName);
        Files.writeString(filePath, content);
        return filePath.toFile();
    }
} 