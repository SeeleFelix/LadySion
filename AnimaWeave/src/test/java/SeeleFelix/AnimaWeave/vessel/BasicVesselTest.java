package SeeleFelix.AnimaWeave.vessel;

import SeeleFelix.AnimaWeave.framework.vessel.AnimaFileGenerator;
import SeeleFelix.AnimaWeave.framework.vessel.BasicVessel;
import SeeleFelix.AnimaWeave.framework.vessel.VesselContextImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * BasicVessel测试类
 * 验证基础容器的实现和自动生成功能
 */
class BasicVesselTest {
    
    private BasicVessel basicVessel;
    
    @TempDir
    Path tempDir;
    
    @BeforeEach
    void setUp() {
        basicVessel = new BasicVessel();
    }
    
    @Test
    void testVesselMetadata() {
        var metadata = basicVessel.getMetadata();
        
        assertEquals("basic", metadata.name());
        assertEquals("1.0.0", metadata.version());
        assertNotNull(metadata.description());
        assertEquals("SeeleFelix", metadata.author());
    }
    
    @Test
    void testSupportedLabels() {
        var labels = basicVessel.getSupportedLabels();
        
        // 验证所有预期的标签都存在
        var labelNames = labels.stream()
                .map(label -> label.labelName())
                .toList();
        
        assertTrue(labelNames.contains("Signal"));
        assertTrue(labelNames.contains("Int"));
        assertTrue(labelNames.contains("Bool"));
        assertTrue(labelNames.contains("String"));
        assertTrue(labelNames.contains("UUID"));
        assertTrue(labelNames.contains("Prompt"));
        assertTrue(labelNames.contains("Prompts"));
        
        assertEquals(7, labels.size());
    }
    
    @Test
    void testSupportedNodes() {
        var nodes = basicVessel.getSupportedNodes();
        
        // 验证所有预期的节点都存在
        var nodeTypes = nodes.stream()
                .map(node -> node.nodeType())
                .toList();
        
        assertTrue(nodeTypes.contains("Start"));
        assertTrue(nodeTypes.contains("GetTimestamp"));
        assertTrue(nodeTypes.contains("IsEven"));
        assertTrue(nodeTypes.contains("FormatNumber"));
        assertTrue(nodeTypes.contains("CreatePrompt"));
        assertTrue(nodeTypes.contains("StringFormatter"));
        assertTrue(nodeTypes.contains("DataProcessor"));
        assertTrue(nodeTypes.contains("CompletionMarker"));
        
        assertEquals(8, nodes.size());
    }
    
    @Test
    void testStartNodeDefinition() {
        var nodes = basicVessel.getSupportedNodes();
        var startNode = nodes.stream()
                .filter(node -> "Start".equals(node.nodeType()))
                .findFirst()
                .orElseThrow();
        
        // Start节点应该没有输入端口
        assertTrue(startNode.inputPorts().isEmpty());
        
        // Start节点应该有2个输出端口
        assertEquals(2, startNode.outputPorts().size());
        
        var outputPortNames = startNode.outputPorts().stream()
                .map(port -> port.name())
                .toList();
        
        assertTrue(outputPortNames.contains("signal"));
        assertTrue(outputPortNames.contains("execution_id"));
    }
    
    @Test
    void testStringLabelCompatibility() {
        var labels = basicVessel.getSupportedLabels();
        var stringLabel = labels.stream()
                .filter(label -> "String".equals(label.labelName()))
                .findFirst()
                .orElseThrow();
        
        // String标签应该能转换为Int和Bool
        assertTrue(stringLabel.isCompatibleWith("Int"));
        assertTrue(stringLabel.isCompatibleWith("Bool"));
        assertFalse(stringLabel.isCompatibleWith("Signal"));
    }
    
    @Test
    void testAnimaFileGeneration() throws Exception {
        // 生成.anima文件内容
        var content = AnimaFileGenerator.generateAnimaContent(basicVessel);
        
        assertNotNull(content);
        assertTrue(content.contains("-- types"));
        assertTrue(content.contains("-- nodes"));
        assertTrue(content.contains("Signal"));
        assertTrue(content.contains("Start"));
        
        System.out.println("Generated .anima content:");
        System.out.println(content);
    }
    
    @Test
    void testAnimaFileSaving() throws Exception {
        var outputPath = tempDir.resolve("basic_generated.anima");
        
        // 生成并保存文件
        AnimaFileGenerator.saveToFile(basicVessel, outputPath);
        
        // 验证文件是否存在
        assertTrue(Files.exists(outputPath));
        
        // 验证文件内容
        var content = Files.readString(outputPath);
        assertTrue(content.contains("-- types"));
        assertTrue(content.contains("Start {"));
        assertTrue(content.contains("mode Concurrent"));
        
        // 验证文件语法
        assertTrue(AnimaFileGenerator.validateGeneratedFile(outputPath));
        
        System.out.println("Generated file path: " + outputPath);
        System.out.println("File content:");
        System.out.println(content);
    }
    
    @Test
    void testPromptDataRecord() {
        // 测试PromptData记录类
        var prompt = BasicVessel.PromptData.of("test", "test content");
        
        assertNotNull(prompt.id());
        assertEquals("test", prompt.name());
        assertEquals("test content", prompt.content());
    }
    
    @Test
    void testVesselInitialization() {
        // 创建模拟的上下文
        var context = createMockContext();
        
        // 初始化vessel
        basicVessel.initialize(context);
        
        // 验证状态
        assertTrue(basicVessel.isHealthy());
        assertEquals(basicVessel.getStatus().toString(), "RUNNING");
    }
    
    private VesselContextImpl createMockContext() {
        // 这里应该创建一个模拟的上下文，暂时返回null
        // 在实际实现中需要提供EventDispatcher和VesselRegistry的模拟实现
        return null;
    }
} 