package SeeleFelix.AnimaWeave.framework.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * AnimaWeave事件分发器
 * 基于Spring 6.1事件系统 + Java 21 Virtual Threads的现代化实现
 * 提供请求-响应模式和超时处理
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventDispatcher {
    
    private final ApplicationEventPublisher eventPublisher;
    
    // 使用Java 21增强的ConcurrentHashMap来管理回调
    private final ConcurrentHashMap<String, CompletableFuture<AnimaWeaveEvent>> pendingCallbacks = new ConcurrentHashMap<>();
    
    /**
     * 发布事件（同步）- 使用Spring原生机制
     */
    public void publishEvent(AnimaWeaveEvent event) {
        log.debug("Publishing event: {} from {}", event.getEventType(), event.getSourceIdentifier());
        eventPublisher.publishEvent(event);
    }
    
    /**
     * 异步发布事件 - 使用Virtual Threads
     */
    @Async("virtualThreadExecutor")
    public CompletableFuture<Void> publishEventAsync(AnimaWeaveEvent event) {
        return CompletableFuture.runAsync(() -> {
            log.debug("Publishing event asynchronously: {} from {}", event.getEventType(), event.getSourceIdentifier());
            eventPublisher.publishEvent(event);
        });
    }
    
    /**
     * 发布事件并等待响应 - 使用Java 21的现代化异步模式
     */
    public <T extends AnimaWeaveEvent> CompletableFuture<T> dispatchAndWait(
            AnimaWeaveEvent event, Class<T> responseType, long timeoutMs) {
        
        CompletableFuture<T> future = new CompletableFuture<>();
        
        // 注册等待回调
        @SuppressWarnings("unchecked")
        CompletableFuture<AnimaWeaveEvent> genericFuture = (CompletableFuture<AnimaWeaveEvent>) future;
        pendingCallbacks.put(event.getEventId(), genericFuture);
        
        // 使用Java 21的现代化超时处理
        CompletableFuture.delayedExecutor(timeoutMs, TimeUnit.MILLISECONDS)
                .execute(() -> {
                    CompletableFuture<AnimaWeaveEvent> removed = pendingCallbacks.remove(event.getEventId());
                    if (removed != null && !removed.isDone()) {
                        removed.completeExceptionally(new TimeoutException(
                                "Event response timeout after %dms: %s".formatted(timeoutMs, event.getEventId())));
                    }
                });
        
        // 发布事件
        publishEvent(event);
        
        return future;
    }
    
    /**
     * 处理响应事件 - 使用Java 21的switch表达式和pattern matching
     */
    public void handleResponse(AnimaWeaveEvent responseEvent, String originalRequestId) {
        var callback = pendingCallbacks.remove(originalRequestId);
        if (callback != null) {
            callback.complete(responseEvent);
            log.trace("Response handled for request: {}", originalRequestId);
        }
    }
    
    /**
     * 通用的dispatch方法 - 支持不同的响应类型
     */
    public <T extends AnimaWeaveEvent> CompletableFuture<T> dispatch(AnimaWeaveEvent event, Class<T> responseType) {
        return dispatchAndWait(event, responseType, 30_000L); // 默认30秒超时
    }
    
    /**
     * 获取待处理的回调数量（监控用）- 使用Java 21的简化方法
     */
    public int pendingCallbackCount() {
        return pendingCallbacks.size();
    }
    
    /**
     * 清理超时的回调 - 使用Virtual Thread执行
     */
    @Async("virtualThreadExecutor")
    public void cleanupTimeoutCallbacks() {
        pendingCallbacks.entrySet().removeIf(entry -> entry.getValue().isDone());
    }
} 