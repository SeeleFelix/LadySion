package SeeleFelix.AnimaWeave.framework.vessel;

import static org.junit.jupiter.api.Assertions.*;

import SeeleFelix.AnimaWeave.vessels.basic.labels.BoolLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.IntLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.SignalLabel;
import org.junit.jupiter.api.Test;

/** 测试@Converter注解系统的简洁用法 */
public class ConverterAnnotationTest {

  @Test
  public void testSimpleConversion() {
    // 创建一个BoolLabel
    BoolLabel boolLabel = BoolLabel.of(true);

    // 外部只需要问：你能转成IntLabel吗？
    assertTrue(boolLabel.canConvertTo(IntLabel.class));

    // 能转的话，就转给我！
    SemanticLabel<Integer> intLabel = boolLabel.convertTo(IntLabel.class);

    // 验证转换结果
    assertEquals(1, intLabel.getValue());
    assertTrue(intLabel instanceof IntLabel);
  }

  @Test
  public void testConversionWithNull() {
    // 测试null值转换
    BoolLabel nullBool = SemanticLabel.withValue(BoolLabel.class, null);

    assertTrue(nullBool.canConvertTo(IntLabel.class));

    SemanticLabel<Integer> intLabel = nullBool.convertTo(IntLabel.class);
    assertNull(intLabel.getValue());
  }

  @Test
  public void testFalseToZero() {
    BoolLabel falseLabel = BoolLabel.of(false);

    SemanticLabel<Integer> intLabel = falseLabel.convertTo(IntLabel.class);
    assertEquals(0, intLabel.getValue());
  }

  @Test
  public void testSameTypeConversion() {
    IntLabel original = IntLabel.of(42);

    // 相同类型也能"转换"（直接返回）
    assertTrue(original.canConvertTo(IntLabel.class));

    SemanticLabel<Integer> converted = original.convertTo(IntLabel.class);
    assertSame(original, converted); // 应该是同一个对象
  }

  @Test
  public void testUnsupportedConversion() {
    IntLabel intLabel = IntLabel.of(42);

    // IntLabel没有定义转换到SignalLabel的方法
    assertFalse(intLabel.canConvertTo(SignalLabel.class));

    // 尝试转换应该抛出异常
    assertThrows(
        IllegalArgumentException.class,
        () -> {
          intLabel.convertTo(SignalLabel.class);
        });
  }
}
