package SeeleFelix.AnimaWeave.integration;

import SeeleFelix.AnimaWeave.framework.dsl.DSLParser;
import SeeleFelix.AnimaWeave.framework.graph.GraphDefinition;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 集成测试 - 验证完整的DSL解析和执行流程
 */
@SpringBootTest
@ActiveProfiles("test")
@Slf4j
class AwakeningIntegrationTest {

    @Autowired
    private DSLParser dslParser;

    @Test
    void testDSLParsing() throws Exception {
        // 解析测试DSL文件
        Path dslFile = Paths.get("src/test/resources/test_graph.weave");
        
        log.info("开始解析DSL文件: {}", dslFile);
        GraphDefinition graphDef = dslParser.parseFile(dslFile);
        
        // 验证解析结果
        assertNotNull(graphDef, "图定义不应为空");
        
        // 验证节点定义
        assertNotNull(graphDef.getNodeDefinitions(), "节点定义不应为空");
        assertTrue(graphDef.getNodeDefinitions().size() > 0, "应该至少有一个节点定义");
        
        // 验证具体的节点类型
        assertTrue(graphDef.getNodeDefinitions().containsKey("Constant"), "应该包含Constant节点定义");
        assertTrue(graphDef.getNodeDefinitions().containsKey("Add"), "应该包含Add节点定义");
        assertTrue(graphDef.getNodeDefinitions().containsKey("Output"), "应该包含Output节点定义");
        
        // 验证节点实例
        assertNotNull(graphDef.getNodeInstances(), "节点实例不应为空");
        assertTrue(graphDef.getNodeInstances().size() > 0, "应该至少有一个节点实例");
        
        // 验证具体的节点实例
        assertTrue(graphDef.getNodeInstances().containsKey("c1"), "应该包含c1节点实例");
        assertTrue(graphDef.getNodeInstances().containsKey("c2"), "应该包含c2节点实例");
        assertTrue(graphDef.getNodeInstances().containsKey("add"), "应该包含add节点实例");
        assertTrue(graphDef.getNodeInstances().containsKey("out"), "应该包含out节点实例");
        
        // 验证节点类型映射
        assertEquals("Constant", graphDef.getNodeInstances().get("c1"), "c1应该是Constant类型");
        assertEquals("Constant", graphDef.getNodeInstances().get("c2"), "c2应该是Constant类型");
        assertEquals("Add", graphDef.getNodeInstances().get("add"), "add应该是Add类型");
        assertEquals("Output", graphDef.getNodeInstances().get("out"), "out应该是Output类型");
        
        // 验证数据连接
        assertNotNull(graphDef.getDataConnections(), "数据连接不应为空");
        assertTrue(graphDef.getDataConnections().size() > 0, "应该至少有一个数据连接");
        
        // 验证控制连接
        assertNotNull(graphDef.getControlConnections(), "控制连接不应为空");
        assertTrue(graphDef.getControlConnections().size() > 0, "应该至少有一个控制连接");
        
        log.info("DSL解析成功完成");
        log.info("解析结果: {}", graphDef);
    }
    
    @Test
    void testNodeDefinitionParsing() throws Exception {
        // 解析测试DSL文件
        Path dslFile = Paths.get("src/test/resources/test_graph.weave");
        GraphDefinition graphDef = dslParser.parseFile(dslFile);
        
        // 详细验证Constant节点定义
        var constantDef = graphDef.getNodeDefinitions().get("Constant");
        assertNotNull(constantDef, "Constant节点定义不应为空");
        assertEquals("Constant", constantDef.getName(), "节点名称应该是Constant");
        assertEquals("Sequential", constantDef.getMode(), "模式应该是Sequential");
        
        // 验证输出端口
        assertNotNull(constantDef.getOutputPorts(), "输出端口不应为空");
        assertTrue(constantDef.getOutputPorts().containsKey("value"), "应该包含value输出端口");
        assertEquals("Number", constantDef.getOutputPorts().get("value"), "value端口类型应该是Number");
        
        // 详细验证Add节点定义
        var addDef = graphDef.getNodeDefinitions().get("Add");
        assertNotNull(addDef, "Add节点定义不应为空");
        assertEquals("Add", addDef.getName(), "节点名称应该是Add");
        assertEquals("Sequential", addDef.getMode(), "模式应该是Sequential");
        
        // 验证输入端口
        assertNotNull(addDef.getInputPorts(), "输入端口不应为空");
        assertTrue(addDef.getInputPorts().containsKey("a"), "应该包含a输入端口");
        assertTrue(addDef.getInputPorts().containsKey("b"), "应该包含b输入端口");
        assertEquals("Number", addDef.getInputPorts().get("a"), "a端口类型应该是Number");
        assertEquals("Number", addDef.getInputPorts().get("b"), "b端口类型应该是Number");
        
        // 验证输出端口
        assertNotNull(addDef.getOutputPorts(), "输出端口不应为空");
        assertTrue(addDef.getOutputPorts().containsKey("result"), "应该包含result输出端口");
        assertEquals("Number", addDef.getOutputPorts().get("result"), "result端口类型应该是Number");
        
        log.info("节点定义解析验证成功");
    }
    
    @Test
    void testConnectionParsing() throws Exception {
        // 解析测试DSL文件
        Path dslFile = Paths.get("src/test/resources/test_graph.weave");
        GraphDefinition graphDef = dslParser.parseFile(dslFile);
        
        // 验证数据连接的具体内容
        var dataConnections = graphDef.getDataConnections();
        assertEquals(3, dataConnections.size(), "应该有3个数据连接");
        
        // 验证第一个连接: c1.value -> add.a
        boolean foundC1ToAdd = dataConnections.stream().anyMatch(conn ->
            "c1".equals(conn.getSourceNodeName()) &&
            "value".equals(conn.getSourcePortName()) &&
            "add".equals(conn.getTargetNodeName()) &&
            "a".equals(conn.getTargetPortName())
        );
        assertTrue(foundC1ToAdd, "应该找到c1.value -> add.a连接");
        
        // 验证第二个连接: c2.value -> add.b
        boolean foundC2ToAdd = dataConnections.stream().anyMatch(conn ->
            "c2".equals(conn.getSourceNodeName()) &&
            "value".equals(conn.getSourcePortName()) &&
            "add".equals(conn.getTargetNodeName()) &&
            "b".equals(conn.getTargetPortName())
        );
        assertTrue(foundC2ToAdd, "应该找到c2.value -> add.b连接");
        
        // 验证第三个连接: add.result -> out.input
        boolean foundAddToOut = dataConnections.stream().anyMatch(conn ->
            "add".equals(conn.getSourceNodeName()) &&
            "result".equals(conn.getSourcePortName()) &&
            "out".equals(conn.getTargetNodeName()) &&
            "input".equals(conn.getTargetPortName())
        );
        assertTrue(foundAddToOut, "应该找到add.result -> out.input连接");
        
        // 验证控制连接
        var controlConnections = graphDef.getControlConnections();
        assertEquals(3, controlConnections.size(), "应该有3个控制连接");
        
        log.info("连接解析验证成功");
    }
} 