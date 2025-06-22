package SeeleFelix.AnimaWeave.framework.vessel;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import SeeleFelix.AnimaWeave.vessels.basic.labels.IntLabel;
import SeeleFelix.AnimaWeave.vessels.basic.labels.BoolLabel;

/**
 * 测试通用的static工厂方法 - 减少样板代码的威力！
 */
public class StaticFactoryTest {

    @Test
    public void testStaticWithValue() {
        // 🎯 新的通用static工厂方法 - 一行搞定！
        BoolLabel boolLabel = SemanticLabel.withValue(BoolLabel.class, true);
        IntLabel intLabel = SemanticLabel.withValue(IntLabel.class, 42);
        
        // 验证创建成功
        assertEquals(true, boolLabel.getValue());
        assertEquals(42, intLabel.getValue());
        
        // 验证类型正确
        assertTrue(boolLabel instanceof BoolLabel);
        assertTrue(intLabel instanceof IntLabel);
    }

    @Test
    public void testStaticWithNullValue() {
        // 测试null值创建
        BoolLabel nullBool = SemanticLabel.withValue(BoolLabel.class, null);
        IntLabel nullInt = SemanticLabel.withValue(IntLabel.class, null);
        
        assertNull(nullBool.getValue());
        assertNull(nullInt.getValue());
        assertTrue(nullBool.isEmpty());
        assertTrue(nullInt.isEmpty());
    }

    @Test
    public void testStaticEmpty() {
        // 🎯 通用的空值工厂方法
        BoolLabel emptyBool = SemanticLabel.empty(BoolLabel.class);
        IntLabel emptyInt = SemanticLabel.empty(IntLabel.class);
        
        assertNull(emptyBool.getValue());
        assertNull(emptyInt.getValue());
        assertTrue(emptyBool.isEmpty());
        assertTrue(emptyInt.isEmpty());
    }

    @Test
    public void testCombinedWithConversion() {
        // 🚀 结合转换系统的强大用法
        
        // 1. 用static工厂创建
        BoolLabel boolLabel = SemanticLabel.withValue(BoolLabel.class, true);
        
        // 2. 转换到其他类型
        assertTrue(boolLabel.canConvertTo(IntLabel.class));
        IntLabel intLabel = (IntLabel) boolLabel.convertTo(IntLabel.class);
        
        // 3. 验证转换结果
        assertEquals(1, intLabel.getValue());
        
        // 4. 再用static工厂创建新的
        IntLabel anotherInt = SemanticLabel.withValue(IntLabel.class, 100);
        assertEquals(100, anotherInt.getValue());
    }

    @Test
    public void testTypeInference() {
        // 测试类型推断
        var boolLabel = SemanticLabel.withValue(BoolLabel.class, false);
        var intLabel = SemanticLabel.withValue(IntLabel.class, 0);
        
        // 编译器能正确推断类型
        assertEquals(Boolean.class, boolLabel.getValue().getClass());
        assertEquals(Integer.class, intLabel.getValue().getClass());
    }
} 