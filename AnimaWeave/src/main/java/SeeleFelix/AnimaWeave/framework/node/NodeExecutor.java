package SeeleFelix.AnimaWeave.framework.node;

import SeeleFelix.AnimaWeave.framework.event.events.NodeExecutionRequest;
import java.util.List;

/**
 * 节点执行器接口 - 事件驱动设计
 * 
 * 每个节点执行器监听自己的执行事件，处理完成后发布输出事件
 * 使用@AnimaNode注解注册到Spring容器
 */
public interface NodeExecutor {

    /**
     * 处理节点执行请求事件
     * 
     * @param request 节点执行请求
     */
    void handleExecution(NodeExecutionRequest request);

    /**
     * 定义输入端口 - 用于类型推断和验证
     * 
     * @return 输入端口列表
     */
    List<Port<?>> getInputPorts();

    /**
     * 定义输出端口 - 用于类型推断和验证
     * 
     * @return 输出端口列表
     */
    List<Port<?>> getOutputPorts();
} 