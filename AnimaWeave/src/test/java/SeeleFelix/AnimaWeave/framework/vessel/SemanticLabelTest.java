package SeeleFelix.AnimaWeave.framework.vessel;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.Set;
import java.util.function.Function;

class SemanticLabelTest {

  @Test
  void testPortDefinition() {
    // 创建语义标签定义
    var intLabel = new SemanticLabel("Int", Set.of(), Function.identity());
    
    // 创建端口定义
    var port = new Port("number", intLabel, true, 0);
    
    // 验证端口定义属性
    assertEquals("number", port.name());
    assertEquals("Int", port.semanticLabel().labelName());
    assertTrue(port.required());
    assertEquals(0, port.defaultValue());
  }

  @Test
  void testPortValue() {
    // 创建语义标签定义
    var intLabel = new SemanticLabel("Int", Set.of(), Function.identity());
    
    // 创建端口定义
    var port = new Port("number", intLabel, true, 0);
    
    // 创建端口值
    var portValue = new PortValue(port, 42);
    
    // 验证端口值属性
    assertEquals("number", portValue.portName());
    assertEquals("Int", portValue.semanticLabel().labelName());
    assertEquals(42, portValue.value());
    assertTrue(portValue.hasValue());
    assertEquals(42, portValue.getEffectiveValue());
  }

  @Test
  void testPortValueWithDefaultValue() {
    // 创建语义标签定义
    var intLabel = new SemanticLabel("Int", Set.of(), Function.identity());
    
    // 创建端口定义（有默认值）
    var port = new Port("number", intLabel, false, 10);
    
    // 创建端口值（值为null）
    var portValue = new PortValue(port, null);
    
    // 验证端口值使用默认值
    assertFalse(portValue.hasValue());
    assertEquals(10, portValue.getEffectiveValue()); // 应该返回默认值
  }

  @Test
  void testSemanticLabelCompatibility() {
    // 创建语义标签定义
    var intLabel = new SemanticLabel("Int", Set.of(), Function.identity());
    var stringLabel = new SemanticLabel("String", Set.of(intLabel), Function.identity());
    
    // 测试兼容性
    assertTrue(stringLabel.isCompatibleWith("Int"));
    assertFalse(intLabel.isCompatibleWith("String"));
  }

  @Test
  void testPortEquality() {
    // 创建语义标签定义
    var intLabel1 = new SemanticLabel("Int", Set.of(), Function.identity());
    var intLabel2 = new SemanticLabel("Int", Set.of(), Function.identity());
    var stringLabel = new SemanticLabel("String", Set.of(), Function.identity());
    
    // 创建端口（相同名称，不同属性）
    var port1 = new Port("number", intLabel1, true, 0);
    var port2 = new Port("number", stringLabel, false, 10);
    var port3 = new Port("value", intLabel1, true, 0);
    
    // 验证端口相等性只基于名称
    assertEquals(port1, port2); // 相同名称，不同属性
    assertNotEquals(port1, port3); // 不同名称
    
    // 验证哈希码一致性
    assertEquals(port1.hashCode(), port2.hashCode());
    assertNotEquals(port1.hashCode(), port3.hashCode());
  }

  @Test
  void testSemanticLabelEquality() {
    // 创建语义标签定义（相同名称，不同属性）
    var label1 = new SemanticLabel("Int", Set.of(), Function.identity());
    var label2 = new SemanticLabel("Int", Set.of(), x -> x.toString());
    var label3 = new SemanticLabel("String", Set.of(), Function.identity());
    
    // 验证语义标签定义相等性只基于名称
    assertEquals(label1, label2); // 相同名称，不同转换器
    assertNotEquals(label1, label3); // 不同名称
    
    // 验证哈希码一致性
    assertEquals(label1.hashCode(), label2.hashCode());
    assertNotEquals(label1.hashCode(), label3.hashCode());
  }
} 