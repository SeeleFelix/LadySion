package SeeleFelix.AnimaWeave.framework.node;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 节点注册器 - 管理节点元数据
 *
 * 只负责注册节点执行器和提供元数据查询，不再路由执行
 * 每个NodeExecutor直接监听自己的事件
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NodeEventRouter {

    private final ApplicationContext applicationContext;
    
    // 节点执行器缓存 - nodeType -> NodeExecutor
    private final Map<String, NodeExecutor> executorCache = new ConcurrentHashMap<>();
    // 节点元数据缓存 - nodeType -> AnimaNode
    private final Map<String, AnimaNode> metadataCache = new ConcurrentHashMap<>();

  @PostConstruct
    public void registerNodeExecutors() {
        log.info("🔍 开始注册NodeExecutor...");
        
        // 获取所有NodeExecutor Bean
        Map<String, NodeExecutor> executors = applicationContext.getBeansOfType(NodeExecutor.class);
        
        for (Map.Entry<String, NodeExecutor> entry : executors.entrySet()) {
            String beanName = entry.getKey();
            NodeExecutor executor = entry.getValue();
            
            // 获取AnimaNode注解
            AnimaNode nodeAnnotation = executor.getClass().getAnnotation(AnimaNode.class);
            if (nodeAnnotation == null) {
                log.warn("节点执行器 {} 缺少 @AnimaNode 注解，跳过注册", beanName);
                continue;
            }
            
            String nodeType = nodeAnnotation.vessel() + "." + nodeAnnotation.node();
            
            executorCache.put(nodeType, executor);
            metadataCache.put(nodeType, nodeAnnotation);
            
            log.debug("注册节点执行器: {} -> {} ({})", 
                nodeType, beanName, nodeAnnotation.description());
            
            // 显示端口信息
            logPortInfo(nodeType, executor);
    }
        
        log.info("✅ 节点执行器注册完成，共 {} 个执行器", executorCache.size());
        log.debug("可用节点类型: {}", executorCache.keySet());
    }
    
    private void logPortInfo(String nodeType, NodeExecutor executor) {
        var inputPorts = executor.getInputPorts();
        var outputPorts = executor.getOutputPorts();
        
        if (!inputPorts.isEmpty()) {
            log.debug("  输入端口: {}", inputPorts.stream()
                .map(p -> p.name() + ":" + p.getTypeName())
                .toList());
        }
        
        if (!outputPorts.isEmpty()) {
            log.debug("  输出端口: {}", outputPorts.stream()
                .map(p -> p.name() + ":" + p.getTypeName())
                .toList());
        }
    }

    /**
     * 获取所有已注册的节点类型和元数据
     */
    public Map<String, AnimaNode> getRegisteredNodeTypes() {
        return Map.copyOf(metadataCache);
    }
    
    /**
     * 检查节点类型是否可用
     */
    public boolean isNodeTypeAvailable(String nodeType) {
        return executorCache.containsKey(nodeType);
              }
    
    /**
     * 获取节点描述
     */
    public String getNodeDescription(String nodeType) {
        AnimaNode metadata = metadataCache.get(nodeType);
        return metadata != null ? metadata.description() : "未知节点";
  }

    /**
     * 获取节点执行器
     */
    public NodeExecutor getNodeExecutor(String nodeType) {
        return executorCache.get(nodeType);
  }
}
