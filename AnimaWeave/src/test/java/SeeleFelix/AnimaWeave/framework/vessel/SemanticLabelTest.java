package SeeleFelix.AnimaWeave.framework.vessel;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

class SemanticLabelTest {

  @Test
  void testEmptySemanticLabel() {
    var definition = new SemanticLabelDefinition("Signal", Set.of(), Function.identity());
    var emptyPort = new Port("testSignal", definition, null);
    
    assertEquals("Signal", emptyPort.labelName());
    assertNull(emptyPort.value());
    assertFalse(emptyPort.hasValue());
    assertTrue(emptyPort.isEmpty());
  }

  @Test
  void testSimpleSemanticLabel() {
    // 创建简单语义标签定义
    var intDefinition = new SemanticLabelDefinition("Int", Set.of(), Function.identity());
    
    // 创建端口实例
    var intPort = new Port("testInt", intDefinition, 42);
    
    assertEquals("Int", intPort.labelName());
    assertEquals(42, intPort.value());
    assertTrue(intPort.hasValue());
    assertFalse(intPort.isEmpty());
  }

  @Test
  void testCompatibilityAndConversion() {
    // 先创建基础类型
    var intDefinition = new SemanticLabelDefinition("Int", Set.of(), Function.identity());
    
    // 创建带兼容性的语义标签定义
    var stringDefinition = new SemanticLabelDefinition(
        "String", 
        Set.of(intDefinition), 
        value -> {
          if (value instanceof String str) {
            try {
              return Integer.parseInt(str);
            } catch (NumberFormatException e) {
              return value;
            }
          }
          return value;
        });
        
    // 创建字符串端口
    var stringPort = new Port("testString", stringDefinition, "123");
    
    // 检查兼容性
    assertTrue(stringPort.isCompatibleWith("Int"));
    assertFalse(stringPort.isCompatibleWith("Bool"));
    
    // 进行类型转换
    var convertedPort = stringPort.convertTo(intDefinition);
    assertEquals("Int", convertedPort.labelName());
    assertEquals(123, convertedPort.value());
  }

  @Test
  void testNodeValidation() {
    // 创建语义标签定义
    var intDefinition = new SemanticLabelDefinition("Int", Set.of(), Function.identity());
    var signalDefinition = new SemanticLabelDefinition("Signal", Set.of(), Function.identity());
    
    // 创建端口模板
    var inputTemplate = new PortTemplate("number", "数字", intDefinition, true, null);
    var triggerTemplate = new PortTemplate("trigger", "触发", signalDefinition, true, null);
    var outputTemplate = new PortTemplate("result", "结果", intDefinition, true, null);
    
    // 创建节点定义
    var nodeDefinition = new NodeDefinition(
        "TestNode", "测试节点", "用于测试的节点",
        List.of(inputTemplate, triggerTemplate),
        List.of(outputTemplate));
        
    // 创建输入端口
    var inputs = java.util.Map.of(
        "number", new Port("number", intDefinition, 42),
        "trigger", new Port("trigger", signalDefinition, true));
        
    // 验证输入
    assertTrue(nodeDefinition.validateInputs(inputs));
    
    // 测试缺少必需输入的情况
    var incompleteInputs = java.util.Map.of(
        "number", new Port("number", intDefinition, 42));
    assertFalse(nodeDefinition.validateInputs(incompleteInputs));
  }
} 