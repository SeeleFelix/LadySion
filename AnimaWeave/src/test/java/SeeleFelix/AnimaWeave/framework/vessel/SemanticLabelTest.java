package SeeleFelix.AnimaWeave.framework.vessel;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.function.Function;

class SemanticLabelTest {

  @Test
  void testSimpleSemanticLabel() {
    // 创建简单语义标签定义
    var intDefinition = new SemanticLabelDefinition("Int", List.of(), Function.identity());
    
    // 创建语义标签实例
    var intLabel = new SemanticLabel(intDefinition, 42);
    
    assertEquals("Int", intLabel.labelName());
    assertEquals(42, intLabel.value());
    assertTrue(intLabel.hasValue());
    assertFalse(intLabel.isEmpty());
  }

  @Test
  void testCompatibilityAndConversion() {
    // 先创建基础类型
    var intDefinition = new SemanticLabelDefinition("Int", List.of(), Function.identity());
    
    // 创建带兼容性的语义标签定义
    var stringDefinition = new SemanticLabelDefinition(
        "String", 
        List.of(intDefinition), 
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
    
    // 创建字符串标签
    var stringLabel = new SemanticLabel(stringDefinition, "123");
    
    // 检查兼容性
    assertTrue(stringLabel.isCompatibleWith("Int"));
    assertFalse(stringLabel.isCompatibleWith("Bool"));
    
    // 进行类型转换
    var convertedLabel = stringLabel.convertTo(intDefinition);
    assertEquals("Int", convertedLabel.labelName());
    assertEquals(123, convertedLabel.value());
  }

  @Test
  void testEmptySemanticLabel() {
    var definition = new SemanticLabelDefinition("Signal", List.of(), Function.identity());
    var emptyLabel = new SemanticLabel(definition, null);
    
    assertEquals("Signal", emptyLabel.labelName());
    assertNull(emptyLabel.value());
    assertFalse(emptyLabel.hasValue());
    assertTrue(emptyLabel.isEmpty());
  }

  @Test
  void testNodeValidation() {
    // 创建端口定义
    var intDefinition = new SemanticLabelDefinition("Int", List.of(), Function.identity());
    var signalDefinition = new SemanticLabelDefinition("Signal", List.of(), Function.identity());
    
    var inputPort = PortDefinition.required("number", "数字", intDefinition);
    var triggerPort = PortDefinition.required("trigger", "触发", signalDefinition);
    var outputPort = PortDefinition.required("result", "结果", intDefinition);
    
    // 创建节点定义
    var nodeDefinition = NodeDefinition.withDescription(
        "TestNode", "测试节点", "用于测试的节点",
        List.of(inputPort, triggerPort),
        List.of(outputPort));
        
    // 创建输入数据
    var inputs = java.util.Map.of(
        "number", new SemanticLabel(intDefinition, 42),
        "trigger", new SemanticLabel(signalDefinition, true));
        
    // 验证输入
    assertTrue(nodeDefinition.validateInputs(inputs));
    
    // 测试缺少必需输入的情况
    var incompleteInputs = java.util.Map.of(
        "number", new SemanticLabel(intDefinition, 42));
    assertFalse(nodeDefinition.validateInputs(incompleteInputs));
  }
} 