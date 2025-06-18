package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;
import SeeleFelix.AnimaWeave.framework.event.events.VesselLoadedEvent;
import SeeleFelix.AnimaWeave.framework.node.NodeInstanceFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.ServiceLoader;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Vessel插件管理器
 * 负责插件的加载、注册和生命周期管理
 * 使用Java 21 + Spring 6.1 + lombok现代化实现
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VesselManager {
    
    private final EventDispatcher eventDispatcher;
    private final VesselRegistry vesselRegistry;
    private final NodeInstanceFactory nodeInstanceFactory;
    
    @Value("${animaweave.vessels.directory:./vessels}")
    private final String vesselsDirectory;
    
    // vessel类加载器缓存 - 使用Java 21增强的ConcurrentHashMap
    private final ConcurrentMap<String, URLClassLoader> vesselClassLoaders = new ConcurrentHashMap<>();
    
    /**
     * 启动时自动加载所有vessel插件 - 使用Virtual Threads并行加载
     */
    @Async("virtualThreadExecutor")
    public CompletableFuture<Void> loadAllVessels() {
        log.info("Loading all vessels from directory: {}", vesselsDirectory);
        
        var vesselDir = new File(vesselsDirectory);
        if (!vesselDir.exists() || !vesselDir.isDirectory()) {
            log.warn("Vessels directory does not exist: {}", vesselsDirectory);
            return CompletableFuture.completedFuture(null);
        }
        
        var jarFiles = vesselDir.listFiles((dir, name) -> name.endsWith(".jar"));
        if (jarFiles == null) {
            log.warn("No JAR files found in vessels directory");
            return CompletableFuture.completedFuture(null);
        }
        
        // 使用Java 21的并行流和Virtual Threads并行加载
        var loadTasks = java.util.Arrays.stream(jarFiles)
            .map(jarFile -> CompletableFuture.runAsync(() -> {
                try {
                    loadVessel(jarFile.toPath());
                } catch (Exception e) {
                    log.error("Failed to load vessel from {}", jarFile.getPath(), e);
                }
            }))
            .toArray(CompletableFuture[]::new);
        
        return CompletableFuture.allOf(loadTasks)
            .thenRun(() -> log.info("Loaded {} vessels successfully", vesselRegistry.getAllVessels().size()));
    }
    
    /**
     * 从JAR文件加载vessel插件 - 使用Java 21的现代化异常处理
     */
    public void loadVessel(Path jarPath) throws Exception {
        log.info("Loading vessel from JAR: {}", jarPath);
        
        // 使用try-with-resources确保资源正确释放
        var jarUrl = jarPath.toUri().toURL();
        var classLoader = new URLClassLoader(
            new URL[]{jarUrl}, 
            this.getClass().getClassLoader()
        );
        
        try {
            // 使用ServiceLoader机制发现vessel实现
            var serviceLoader = ServiceLoader.load(AnimaVessel.class, classLoader);
            
            boolean vesselFound = false;
            for (var vessel : serviceLoader) {
                try {
                    // 初始化vessel
                    var context = createVesselContext(vessel.getMetadata().name());
                    vessel.initialize(context);
                    
                    // 注册vessel
                    var vesselName = vessel.getMetadata().name();
                    vesselRegistry.register(vesselName, vessel);
                    vesselClassLoaders.put(vesselName, classLoader);
                    
                    // 为vessel创建NodeInstance
                    nodeInstanceFactory.createNodeInstancesForVessel(vessel);
                    
                    log.info("Successfully loaded vessel: {} v{}", 
                              vessel.getMetadata().name(), 
                              vessel.getMetadata().version());
                    
                    // 发送vessel加载事件
                    var event = VesselLoadedEvent.success(
                        this,
                        "VesselManager",
                        vessel.getMetadata().name(),
                        vessel.getMetadata()
                    );
                    
                    eventDispatcher.publishEvent(event);
                    vesselFound = true;
                    
                } catch (Exception e) {
                    log.error("Failed to initialize vessel from {}", jarPath, e);
                    closeClassLoaderSafely(classLoader);
                    throw e;
                }
            }
            
            if (!vesselFound) {
                var errorMessage = """
                    No AnimaVessel implementation found in JAR: %s
                    
                    Please ensure the JAR contains a proper vessel implementation 
                    with META-INF/services configuration.
                    """.formatted(jarPath);
                log.warn(errorMessage);
                closeClassLoaderSafely(classLoader);
                throw new IllegalArgumentException("No vessel implementation found in JAR");
            }
            
        } catch (Exception e) {
            closeClassLoaderSafely(classLoader);
            throw e;
        }
    }
    
    /**
     * 卸载vessel插件 - 使用Optional和流式API
     */
    @Async("virtualThreadExecutor")
    public CompletableFuture<Void> unloadVessel(String vesselName) {
        return CompletableFuture.runAsync(() -> {
            log.info("Unloading vessel: {}", vesselName);
            
            vesselRegistry.getVessel(vesselName).ifPresentOrElse(
                vessel -> {
                    try {
                        // 关闭vessel
                        vessel.shutdown();
                        
                        // 注销vessel
                        vesselRegistry.unregister(vesselName);
                        
                        // 关闭类加载器
                        var classLoader = vesselClassLoaders.remove(vesselName);
                        closeClassLoaderSafely(classLoader);
                        
                        log.info("Successfully unloaded vessel: {}", vesselName);
                        
                    } catch (Exception e) {
                        log.error("Failed to unload vessel: {}", vesselName, e);
                    }
                },
                () -> log.warn("Vessel not found for unloading: {}", vesselName)
            );
        });
    }
    
    /**
     * 重新加载vessel插件
     */
    public CompletableFuture<Void> reloadVessel(String vesselName, Path jarPath) {
        return unloadVessel(vesselName)
            .thenCompose(v -> CompletableFuture.runAsync(() -> {
                try {
                    loadVessel(jarPath);
                } catch (Exception e) {
                    log.error("Failed to reload vessel: {}", vesselName, e);
                    throw new RuntimeException(e);
                }
            }));
    }
    
    /**
     * 关闭所有vessel插件 - 使用并行流
     */
    public CompletableFuture<Void> shutdown() {
        log.info("Shutting down all vessels");
        
        var shutdownTasks = vesselRegistry.getVesselNames().stream()
            .map(this::unloadVessel)
            .toArray(CompletableFuture[]::new);
        
        return CompletableFuture.allOf(shutdownTasks)
            .thenRun(() -> {
                vesselClassLoaders.clear();
                log.info("All vessels shut down");
            });
    }
    
    /**
     * 创建vessel上下文
     */
    private VesselContext createVesselContext(String vesselName) {
        return new VesselContextImpl(
            eventDispatcher,
            vesselRegistry,
            vesselName,
            vesselsDirectory
        );
    }
    
    /**
     * 安全关闭类加载器 - 使用Java 21的现代化异常处理
     */
    private void closeClassLoaderSafely(URLClassLoader classLoader) {
        if (classLoader != null) {
            try {
                classLoader.close();
            } catch (Exception e) {
                log.warn("Failed to close class loader: {}", e.getMessage());
            }
        }
    }
    
    // Getter for monitoring
    public VesselRegistry getVesselRegistry() {
        return vesselRegistry;
    }
} 