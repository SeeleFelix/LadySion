package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.Set;
import java.util.function.Function;

/**
 * 信号语义标签 - Basic Vessel定义
 * 用于表示控制流信号，通常是boolean类型
 */
public class SignalLabel extends SemanticLabel {
    
    private static final SignalLabel INSTANCE = new SignalLabel();
    
    private SignalLabel() {
        super("Signal", Set.of(), Function.identity());
    }
    
    /**
     * 获取单例实例
     */
    public static SignalLabel getInstance() {
        return INSTANCE;
    }
} 