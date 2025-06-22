package SeeleFelix.AnimaWeave.framework.awakening;

import SeeleFelix.AnimaWeave.framework.graph.*;
import java.io.File;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * AnimaWeave核心觉醒接口
 *
 * <p>提供图执行的高级API，处理文件解析和执行协调
 *
 * <p>简化版本：移除复杂的系统就绪检查，Spring容器启动完成即可使用
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnimaWeave {

  private final GraphLoader graphLoader;
  private final GraphValidator graphValidator;
  private final GraphCoordinator graphCoordinator;

  /**
   * 觉醒：执行图文件集合
   *
   * @param weaveFiles .weave图文件数组
   * @param mainGraphName 主图名称（可选）
   * @return 执行结果的Future
   */
  public CompletableFuture<AwakeningResult> awakening(File[] weaveFiles, String mainGraphName) {
    return CompletableFuture.supplyAsync(
        () -> {
          try {
            log.info("🌅 AnimaWeave awakening begins for {} files", weaveFiles.length);

            // 加载图定义
            GraphDefinition mainGraph = graphLoader.loadFromFiles(weaveFiles, mainGraphName);

            // 静态检查 - 验证所有节点类型是否可用
            String validationError = graphValidator.validateGraph(mainGraph);
            if (validationError != null) {
              return AwakeningResult.failure(
                  mainGraph.getName(),
                  null,
                  "Static validation failed: " + validationError,
                  AwakeningResult.ExecutionTrace.empty());
            }

            // 开始图执行
            String executionId = graphCoordinator.startGraphExecution(mainGraph);

            log.info("✨ AnimaWeave awakening initiated for graph: {}", mainGraph.getName());

            // 等待图执行完成并返回完整的跟踪信息
            return graphCoordinator.waitForExecutionComplete(executionId, 60);

          } catch (Exception e) {
            log.error("💥 AnimaWeave awakening failed", e);
            return AwakeningResult.failure(
                "awakening",
                null,
                "Awakening failed: " + e.getMessage(),
                AwakeningResult.ExecutionTrace.empty());
          }
        });
  }

}
