package SeeleFelix.AnimaWeave.framework.vessel;

import static org.junit.jupiter.api.Assertions.*;

import SeeleFelix.AnimaWeave.vessels.basic.labels.BoolLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.IntLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import org.junit.jupiter.api.Test;

class SemanticLabelTest {

  @Test
  void testPortDefinition() {
    // 创建端口定义 - 使用泛型Port
    var port = new Port<IntLabel>("number", IntLabel.class, true, IntLabel.of(0));

    // 验证端口定义属性
    assertEquals("number", port.getName());
    assertEquals(IntLabel.class, port.getLabelType());
    assertTrue(port.isRequired());
    assertEquals(0, port.getDefaultLabel().getValue());
  }

  @Test
  void testSemanticLabelWithValue() {
    // 创建带值的Label实例
    var intLabel = IntLabel.of(42);

    // 验证Label属性
    assertEquals("Int", intLabel.getLabelName());
    assertEquals(42, intLabel.getValue());
    assertTrue(intLabel.hasValue());
    assertFalse(intLabel.isEmpty());
  }

  @Test
  void testSemanticLabelValueUpdate() {
    // 创建初始Label
    var originalLabel = IntLabel.of(10);

    // 创建新值的Label
    var updatedLabel = originalLabel.withValue(20);

    // 验证原Label未改变（不可变性）
    assertEquals(10, originalLabel.getValue());
    assertEquals(20, updatedLabel.getValue());
    assertNotSame(originalLabel, updatedLabel);
  }

  @Test
  void testSemanticLabelCompatibility() {
    // 创建不同类型的Label实例
    var intLabel = IntLabel.of(42);
    var signalLabel = SignalLabel.trigger();
    var anotherIntLabel = IntLabel.of(100);

    // 测试转换兼容性（新的API）
    assertTrue(intLabel.canConvertTo(IntLabel.class)); // 相同类型兼容
    assertFalse(intLabel.canConvertTo(SignalLabel.class)); // 不同类型不兼容
  }

  @Test
  void testPortValidation() {
    // 创建端口定义
    var port = new Port<IntLabel>("number", IntLabel.class);

    // 测试Label验证
    var validLabel = IntLabel.of(42);
    var invalidLabel = SignalLabel.trigger();

    assertTrue(port.validateLabel(validLabel)); // 正确类型
    assertFalse(port.validateLabel(invalidLabel)); // 错误类型
  }

  @Test
  void testPortEquality() {
    // 创建端口（相同名称，不同属性）
    var port1 = new Port<IntLabel>("number", IntLabel.class);
    var port2 = new Port<SignalLabel>("number", SignalLabel.class);
    var port3 = new Port<IntLabel>("value", IntLabel.class);

    // 验证端口相等性只基于名称
    assertEquals(port1, port2); // 相同名称，不同属性
    assertNotEquals(port1, port3); // 不同名称

    // 验证哈希码一致性
    assertEquals(port1.hashCode(), port2.hashCode());
    assertNotEquals(port1.hashCode(), port3.hashCode());
  }

  @Test
  void testSemanticLabelEquality() {
    // 创建不同的Label实例
    var intLabel1 = IntLabel.of(42);
    var intLabel2 = IntLabel.of(42); // 相同值
    var intLabel3 = IntLabel.of(100); // 不同值
    var boolLabel = BoolLabel.of(true);

    // 验证相等性（基于类型和值）
    assertEquals(intLabel1, intLabel2); // 相同类型和值
    assertNotEquals(intLabel1, intLabel3); // 相同类型，不同值
    assertNotEquals(intLabel1, boolLabel); // 不同类型

    // 验证哈希码一致性
    assertEquals(intLabel1.hashCode(), intLabel2.hashCode());
    assertNotEquals(intLabel1.hashCode(), intLabel3.hashCode());
  }

  @Test
  void testSignalLabel() {
    // Signal特殊测试
    var signal1 = SignalLabel.trigger();
    var signal2 = SignalLabel.signal();

    // Signal的值总是null
    assertNull(signal1.getValue());
    assertNull(signal2.getValue());
    assertFalse(signal1.hasValue());
    assertTrue(signal1.isEmpty());

    // Signal对象存在本身就表示触发
    assertTrue(signal1.isTriggered());
    assertTrue(signal2.isTriggered());
  }

  @Test
  void testBoolLabel() {
    // Bool标签测试
    var trueLabel = BoolLabel.trueValue();
    var falseLabel = BoolLabel.falseValue();
    var customLabel = BoolLabel.of(true);

    assertTrue(trueLabel.getValue());
    assertFalse(falseLabel.getValue());
    assertTrue(customLabel.getValue());

    assertEquals(trueLabel, customLabel); // 相同值应该相等
    assertNotEquals(trueLabel, falseLabel);
  }
}
