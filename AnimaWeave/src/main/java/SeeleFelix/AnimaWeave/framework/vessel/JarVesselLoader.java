package SeeleFelix.AnimaWeave.framework.vessel;

import SeeleFelix.AnimaWeave.framework.event.EventDispatcher;
import SeeleFelix.AnimaWeave.framework.node.NodeFactory;
import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.ServiceLoader;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * JAR Vessel加载器
 * 专门负责从JAR文件加载vessel插件
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JarVesselLoader {

  private final EventDispatcher eventDispatcher;
  private final VesselsRegistry vesselRegistry;
  private final NodeFactory nodeFactory;

  @Value("${animaweave.vessels.directory:./vessels}")
  private String vesselsDirectory;

  // vessel类加载器缓存
  private final ConcurrentMap<String, URLClassLoader> vesselClassLoaders = 
      new ConcurrentHashMap<>();

  /**
   * 启动时自动加载JAR vessel插件 - 使用Virtual Threads并行加载
   */
  @Async("virtualThreadExecutor")
  public CompletableFuture<LoadResult> loadJarVessels() {
    log.info("🔍 Loading JAR vessels from directory: {}", vesselsDirectory);

    var vesselDir = new File(vesselsDirectory);
    if (!vesselDir.exists() || !vesselDir.isDirectory()) {
      log.warn("Vessels directory does not exist: {}", vesselsDirectory);
      return CompletableFuture.completedFuture(new LoadResult(0, 0, 0));
    }

    var jarFiles = vesselDir.listFiles((dir, name) -> name.endsWith(".jar"));
    if (jarFiles == null || jarFiles.length == 0) {
      log.info("No JAR files found in vessels directory");
      return CompletableFuture.completedFuture(new LoadResult(0, 0, 0));
    }

    // 使用Java 21的并行流和Virtual Threads并行加载
    var loadTasks = java.util.Arrays.stream(jarFiles)
        .map(jarFile -> 
            CompletableFuture.supplyAsync(() -> {
              try {
                return loadJarVessel(jarFile.toPath()) ? 1 : 0;
              } catch (Exception e) {
                log.error("Failed to load vessel from {}", jarFile.getPath(), e);
                return 0;
              }
            }))
        .toList();

    var allTasks = loadTasks.toArray(new CompletableFuture[0]);
    
    return CompletableFuture.allOf(allTasks)
        .thenApply(v -> {
          int successCount = loadTasks.stream()
              .mapToInt(CompletableFuture::join)
              .sum();
          int totalFiles = jarFiles.length;
          int failureCount = totalFiles - successCount;
          
          var result = new LoadResult(successCount, failureCount, totalFiles);
          log.info("📊 JAR vessel加载完成: {}", result);
          return result;
        });
  }

  /**
   * 从JAR文件加载vessel插件
   */
  public boolean loadJarVessel(Path jarPath) throws Exception {
    log.info("Loading vessel from JAR: {}", jarPath);

    var jarUrl = jarPath.toUri().toURL();
    var classLoader = new URLClassLoader(new URL[] {jarUrl}, this.getClass().getClassLoader());

    try {
      // 使用ServiceLoader机制发现vessel实现
      var serviceLoader = ServiceLoader.load(AnimaVessel.class, classLoader);

      boolean vesselFound = false;
      for (var vessel : serviceLoader) {
        try {
          // 初始化vessel
          var context = createVesselContext(vessel.getMetadata().name());
          vessel.initialize(context);

          // 注册vessel到registry
          var vesselName = vessel.getMetadata().name();
          vesselRegistry.register(vesselName, vessel);
          vesselClassLoaders.put(vesselName, classLoader);

          // 为vessel创建Node
          nodeFactory.createNodeInstancesForVessel(vessel);

          log.info(
              "✅ 加载JAR vessel: {} v{}",
              vessel.getMetadata().name(),
              vessel.getMetadata().version());

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

      return true;

    } catch (Exception e) {
      closeClassLoaderSafely(classLoader);
      throw e;
    }
  }

  /**
   * 卸载vessel插件
   */
  @Async("virtualThreadExecutor")
  public CompletableFuture<Void> unloadVessel(String vesselName) {
    return CompletableFuture.runAsync(() -> {
      log.info("Unloading vessel: {}", vesselName);

      vesselRegistry.getVessel(vesselName)
          .ifPresentOrElse(
              vessel -> {
                try {
                  // 关闭vessel
                  vessel.shutdown();

                  // 注销vessel
                  vesselRegistry.unregister(vesselName);

                  // 关闭类加载器（只对JAR vessel有效）
                  var classLoader = vesselClassLoaders.remove(vesselName);
                  closeClassLoaderSafely(classLoader);

                  log.info("Successfully unloaded vessel: {}", vesselName);

                } catch (Exception e) {
                  log.error("Failed to unload vessel: {}", vesselName, e);
                }
              },
              () -> log.warn("Vessel not found for unloading: {}", vesselName));
    });
  }

  /**
   * 重新加载vessel插件
   */
  public CompletableFuture<Void> reloadVessel(String vesselName, Path jarPath) {
    return unloadVessel(vesselName)
        .thenCompose(v ->
            CompletableFuture.runAsync(() -> {
              try {
                loadJarVessel(jarPath);
              } catch (Exception e) {
                log.error("Failed to reload vessel: {}", vesselName, e);
                throw new RuntimeException(e);
              }
            }));
  }

  /**
   * 关闭所有JAR vessel插件
   */
  public CompletableFuture<Void> shutdown() {
    log.info("Shutting down all JAR vessels");

    var shutdownTasks = vesselClassLoaders.keySet().stream()
        .map(this::unloadVessel)
        .toArray(CompletableFuture[]::new);

    return CompletableFuture.allOf(shutdownTasks)
        .thenRun(() -> {
          vesselClassLoaders.clear();
          log.info("All JAR vessels shut down");
        });
  }

  /**
   * 创建vessel上下文
   */
  private VesselsContext createVesselContext(String vesselName) {
    return new VesselsContext(eventDispatcher, vesselRegistry, vesselName, vesselsDirectory);
  }

  /**
   * 安全关闭类加载器
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

  /**
   * 获取JAR vessel统计信息
   */
  public JarVesselStats getJarVesselStats() {
    return new JarVesselStats(
        vesselClassLoaders.size(), 
        java.util.List.copyOf(vesselClassLoaders.keySet()));
  }

  /**
   * JAR vessel统计信息
   */
  public record JarVesselStats(int jarVesselCount, java.util.List<String> jarVesselNames) {
    @Override
    public String toString() {
      return "JAR vessels: %d, names: %s".formatted(jarVesselCount, jarVesselNames);
    }
  }

  /**
   * 加载结果统计
   */
  public record LoadResult(int successCount, int failureCount, int totalFiles) {
    @Override
    public String toString() {
      return "成功 %d, 失败 %d, 总文件 %d".formatted(successCount, failureCount, totalFiles);
    }
  }
} 