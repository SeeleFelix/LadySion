package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.Map;

/**
 * 节点执行器接口
 */
@FunctionalInterface
public interface NodeExecutor {
    
    /**
     * 执行节点逻辑
     * @param inputs 输入数据
     * @param context 执行上下文
     * @return 输出数据
     */
    Map<String, Object> execute(Map<String, Object> inputs, NodeExecutionContext context);
} 