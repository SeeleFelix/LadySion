package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.vessels.basic.labels.BoolLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.IntLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.Set;
import java.util.function.Function;

class SemanticLabelTest {

  @Test
  void testPortDefinition() {
    // 使用具体的语义标签类
    var intLabel = IntLabel.getInstance();
    
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
    // 使用具体的语义标签类
    var intLabel = IntLabel.getInstance();
    
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
    // 使用具体的语义标签类
    var intLabel = IntLabel.getInstance();
    
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
    // 使用具体的语义标签类
    var intLabel = IntLabel.getInstance();
    var signalLabel = SignalLabel.getInstance();
    
    // 测试兼容性（这里我们简化测试，因为basic标签都是独立的）
    assertTrue(intLabel.isCompatibleWith(intLabel)); // 自己与自己兼容
    assertFalse(intLabel.isCompatibleWith(signalLabel)); // 不同标签不兼容
  }

  @Test
  void testPortEquality() {
    // 使用具体的语义标签类
    var intLabel = IntLabel.getInstance();
    var signalLabel = SignalLabel.getInstance();
    
    // 创建端口（相同名称，不同属性）
    var port1 = new Port("number", intLabel, true, 0);
    var port2 = new Port("number", signalLabel, false, 10);
    var port3 = new Port("value", intLabel, true, 0);
    
    // 验证端口相等性只基于名称
    assertEquals(port1, port2); // 相同名称，不同属性
    assertNotEquals(port1, port3); // 不同名称
    
    // 验证哈希码一致性
    assertEquals(port1.hashCode(), port2.hashCode());
    assertNotEquals(port1.hashCode(), port3.hashCode());
  }

  @Test
  void testSemanticLabelEquality() {
    // 使用具体的语义标签类
    var intLabel1 = IntLabel.getInstance();
    var intLabel2 = IntLabel.getInstance(); // 单例，应该是同一个实例
    var boolLabel = BoolLabel.getInstance();
    
    // 验证语义标签定义相等性
    assertEquals(intLabel1, intLabel2); // 同一个单例实例
    assertNotEquals(intLabel1, boolLabel); // 不同类型
    
    // 验证哈希码一致性
    assertEquals(intLabel1.hashCode(), intLabel2.hashCode());
    assertNotEquals(intLabel1.hashCode(), boolLabel.hashCode());
  }
} 