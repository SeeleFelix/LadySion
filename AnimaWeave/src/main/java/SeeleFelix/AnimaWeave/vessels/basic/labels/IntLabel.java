package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.Set;
import java.util.function.Function;

/**
 * 整数语义标签 - Basic Vessel定义
 * 用于表示整数类型数据
 */
public class IntLabel extends SemanticLabel {
    
    private static final IntLabel INSTANCE = new IntLabel();
    
    private IntLabel() {
        super("Int", Set.of(), Function.identity());
    }
    
    /**
     * 获取单例实例
     */
    public static IntLabel getInstance() {
        return INSTANCE;
    }
} 