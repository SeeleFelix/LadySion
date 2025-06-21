package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.Set;
import java.util.function.Function;

/**
 * UUID语义标签 - Basic Vessel定义
 * 用于表示唯一标识符，通常是String类型
 */
public class UUIDLabel extends SemanticLabel {
    
    private static final UUIDLabel INSTANCE = new UUIDLabel();
    
    private UUIDLabel() {
        super("UUID", Set.of(), Function.identity());
    }
    
    /**
     * 获取单例实例
     */
    public static UUIDLabel getInstance() {
        return INSTANCE;
    }
} 