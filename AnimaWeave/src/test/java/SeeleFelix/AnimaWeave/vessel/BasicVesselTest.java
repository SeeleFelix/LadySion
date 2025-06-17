package SeeleFelix.AnimaWeave.vessel;

import SeeleFelix.AnimaWeave.framework.vessel.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * 基础Vessel插件测试
 * 演示vessel插件的基本功能
 */
@SpringBootTest
@SpringJUnitConfig(BasicVesselTest.TestConfig.class)
class BasicVesselTest {
    
    private TestBasicVessel vessel;
    private VesselContext mockContext;
    
    @BeforeEach
    void setUp() {
        vessel = new TestBasicVessel();
        mockContext = new MockVesselContext();
    }
    
    @Test
    void testVesselMetadata() {
        VesselMetadata metadata = vessel.getMetadata();
        
        assertThat(metadata.name()).isEqualTo("basic");
        assertThat(metadata.version()).isEqualTo("1.0.0");
        assertThat(metadata.description()).isEqualTo("Basic data type vessel");
    }
    
    @Test
    void testSupportedLabels() {
        List<SemanticLabelDefinition> labels = vessel.getSupportedLabels();
        
        assertThat(labels).hasSize(3);
        assertThat(labels).extracting(SemanticLabelDefinition::labelName)
                .contains("Number", "String", "Boolean");
    }
    
    @Test
    void testSupportedNodes() {
        List<NodeDefinition> nodes = vessel.getSupportedNodes();
        
        assertThat(nodes).hasSize(2);
        assertThat(nodes).extracting(NodeDefinition::nodeType)
                .contains("Add", "ToString");
    }
    
    @Test
    void testVesselLifecycle() {
        assertThat(vessel.getStatus()).isEqualTo(VesselStatus.LOADED);
        
        vessel.initialize(mockContext);
        assertThat(vessel.getStatus()).isEqualTo(VesselStatus.RUNNING);
        assertThat(vessel.isHealthy()).isTrue();
        
        vessel.shutdown();
        assertThat(vessel.getStatus()).isEqualTo(VesselStatus.STOPPED);
    }
    
    @Test
    void testAddNodeExecution() {
        vessel.initialize(mockContext);
        
        // 找到Add节点定义
        NodeDefinition addNode = vessel.getSupportedNodes().stream()
                .filter(node -> node.nodeType().equals("Add"))
                .findFirst()
                .orElseThrow();
        
        // 执行Add节点
        Map<String, Object> inputs = Map.of(
            "a", 10,
            "b", 20
        );
        
        NodeExecutionContext context = NodeExecutionContext.of("node1", "exec1");
        Map<String, Object> outputs = addNode.executor().execute(inputs, context);
        
        assertThat(outputs).containsEntry("result", 30.0);
    }
    
    /**
     * 测试用的Basic Vessel实现
     */
    static class TestBasicVessel implements AnimaVessel {
        
        private VesselStatus status = VesselStatus.LOADED;
        
        @Override
        public VesselMetadata getMetadata() {
            return VesselMetadata.of("basic", "1.0.0", "Basic data type vessel");
        }
        
        @Override
        public List<SemanticLabelDefinition> getSupportedLabels() {
            return List.of(
                SemanticLabelDefinition.of("Number", Number.class),
                SemanticLabelDefinition.of("String", String.class),
                SemanticLabelDefinition.of("Boolean", Boolean.class)
            );
        }
        
        @Override
        public List<NodeDefinition> getSupportedNodes() {
            return List.of(
                createAddNode(),
                createToStringNode()
            );
        }
        
        @Override
        public void initialize(VesselContext context) {
            status = VesselStatus.RUNNING;
            context.log("INFO", "Basic vessel initialized");
        }
        
        @Override
        public void shutdown() {
            status = VesselStatus.STOPPED;
        }
        
        @Override
        public VesselStatus getStatus() {
            return status;
        }
        
        private NodeDefinition createAddNode() {
            List<PortDefinition> inputs = List.of(
                PortDefinition.required("a", "First Number", 
                    SemanticLabelDefinition.of("Number", Number.class)),
                PortDefinition.required("b", "Second Number", 
                    SemanticLabelDefinition.of("Number", Number.class))
            );
            
            List<PortDefinition> outputs = List.of(
                PortDefinition.required("result", "Sum Result", 
                    SemanticLabelDefinition.of("Number", Number.class))
            );
            
            return NodeDefinition.of("Add", "Add Numbers", inputs, outputs, 
                (inputData, context) -> {
                    Number a = (Number) inputData.get("a");
                    Number b = (Number) inputData.get("b");
                    return Map.of("result", a.doubleValue() + b.doubleValue());
                });
        }
        
        private NodeDefinition createToStringNode() {
            List<PortDefinition> inputs = List.of(
                PortDefinition.required("value", "Input Value", 
                    SemanticLabelDefinition.of("Number", Object.class))
            );
            
            List<PortDefinition> outputs = List.of(
                PortDefinition.required("text", "String Result", 
                    SemanticLabelDefinition.of("String", String.class))
            );
            
            return NodeDefinition.of("ToString", "Convert to String", inputs, outputs,
                (inputData, context) -> {
                    Object value = inputData.get("value");
                    return Map.of("text", String.valueOf(value));
                });
        }
    }
    
    /**
     * Mock Vessel Context用于测试
     */
    static class MockVesselContext implements VesselContext {
        
        @Override
        public SeeleFelix.AnimaWeave.framework.event.EventDispatcher getEventDispatcher() {
            return null; // Mock implementation
        }
        
        @Override
        public VesselRegistry getVesselRegistry() {
            return null; // Mock implementation
        }
        
        @Override
        public String getProperty(String key) {
            return "test-value";
        }
        
        @Override
        public String getProperty(String key, String defaultValue) {
            return defaultValue;
        }
        
        @Override
        public void log(String level, String message) {
            System.out.println("[" + level + "] " + message);
        }
        
        @Override
        public String getWorkingDirectory() {
            return "./test-work";
        }
        
        @Override
        public String getTempDirectory() {
            return "./test-temp";
        }
    }
    
    @Configuration
    static class TestConfig {
        // 测试配置
    }
} 