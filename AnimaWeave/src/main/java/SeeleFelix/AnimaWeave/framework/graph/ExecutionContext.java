package SeeleFelix.AnimaWeave.framework.graph;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.*;

/**
 * 图执行上下文 - 简化的数据总线实现
 * 
 * 核心设计：
 * 1. 数据总线：存储所有节点输出 nodeName.portName -> value
 * 2. 执行追踪：记录每次节点执行的ID
 * 3. 不可变覆盖：节点重复执行时覆盖之前的输出
 */
@Slf4j
@Getter
public class ExecutionContext {
    
    private final String executionId;
    private final GraphDefinition graphDefinition;
    private final Instant startTime;
    
    // 数据总线：存储所有节点的端口输出 nodeName.portName -> value
    private final ConcurrentMap<String, Object> dataBus = new ConcurrentHashMap<>();
    
    // 执行追踪：记录每次节点执行的详细信息
    private final ConcurrentMap<String, NodeExecutionRecord> executionHistory = new ConcurrentHashMap<>();
    
    // 执行ID生成器：为每次节点执行生成唯一ID
    private final AtomicLong executionIdGenerator = new AtomicLong(1);
    
    // 节点执行计数：记录每个节点被执行的次数
    private final ConcurrentMap<String, Integer> nodeExecutionCounts = new ConcurrentHashMap<>();
    
    public ExecutionContext(String executionId, GraphDefinition graphDefinition) {
        this.executionId = executionId;
        this.graphDefinition = graphDefinition;
        this.startTime = Instant.now();
        
        log.debug("Created execution context: {} for graph: {}", executionId, graphDefinition.getName());
    }
    
    /**
     * 生成新的节点执行ID
     */
    public String generateNodeExecutionId(String nodeName) {
        var count = nodeExecutionCounts.merge(nodeName, 1, Integer::sum);
        var execId = "exec_%s_%s_%d".formatted(executionId, nodeName, executionIdGenerator.getAndIncrement());
        
        log.trace("Generated execution ID: {} for node: {} (execution #{})", execId, nodeName, count);
        return execId;
    }
    
    /**
     * 设置节点端口的输出值 - 实现不可变覆盖
     */
    public void setNodeOutput(String nodeName, String portName, Object value, String nodeExecutionId) {
        var portKey = createPortKey(nodeName, portName);
        var previousValue = dataBus.put(portKey, value);
        
        // 记录执行历史
        var record = new NodeExecutionRecord(
            nodeExecutionId,
            nodeName,
            portName,
            value,
            previousValue,
            Instant.now()
        );
        executionHistory.put(nodeExecutionId, record);
        
        log.trace("Node output updated: {} = {} (execution: {})", portKey, 
                 getValuePreview(value), nodeExecutionId);
        
        if (previousValue != null) {
            log.trace("Previous value overwritten: {} -> {}", 
                     getValuePreview(previousValue), getValuePreview(value));
    }
    }
    
    /**
     * 获取节点端口的当前值
     */
    public Object getNodeOutput(String nodeName, String portName) {
        var portKey = createPortKey(nodeName, portName);
        return dataBus.get(portKey);
    }
    
    /**
     * 检查节点端口是否有值
     */
    public boolean hasNodeOutput(String nodeName, String portName) {
        var portKey = createPortKey(nodeName, portName);
        return dataBus.containsKey(portKey);
    }
    
    /**
     * 获取数据总线的当前状态快照
     */
    public Map<String, Object> getDataBusSnapshot() {
        return Map.copyOf(dataBus);
    }
    
    /**
     * 创建端口键：nodeName.portName
     */
    private String createPortKey(String nodeName, String portName) {
        return "%s.%s".formatted(nodeName, portName);
    }
    
    /**
     * 获取值的简化预览（用于日志）
     */
    private String getValuePreview(Object value) {
        return switch (value) {
            case null -> "null";
            case String s when s.length() > 20 -> "\"" + s.substring(0, 17) + "...\"";
            case String s -> "\"" + s + "\"";
            default -> value.toString();
        };
    }
    
    /**
     * 节点执行记录 - 记录每次执行的详细信息
     */
    public record NodeExecutionRecord(
        String nodeExecutionId,     // 执行ID
        String nodeName,           // 节点名称
        String portName,           // 输出端口名
        Object newValue,           // 新值
        Object previousValue,      // 被覆盖的旧值
        Instant timestamp          // 执行时间
    ) {
        
        public boolean hasPreviousValue() {
            return previousValue != null;
        }
        
        public boolean isOverwrite() {
            return hasPreviousValue();
        }
    }
} 