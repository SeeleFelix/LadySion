package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.Set;
import java.util.function.Function;

/**
 * 布尔语义标签 - Basic Vessel定义
 * 用于表示布尔类型数据
 */
public class BoolLabel extends SemanticLabel {
    
    private static final BoolLabel INSTANCE = new BoolLabel();
    
    private BoolLabel() {
        super("Bool", Set.of(), Function.identity());
    }
    
    /**
     * 获取单例实例
     */
    public static BoolLabel getInstance() {
        return INSTANCE;
    }
} 