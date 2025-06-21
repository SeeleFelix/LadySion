package SeeleFelix.AnimaWeave.framework.awakening;

import SeeleFelix.AnimaWeave.framework.dsl.DSLGraphBuilder;
import SeeleFelix.AnimaWeave.framework.graph.GraphCoordinator;
import SeeleFelix.AnimaWeave.framework.graph.GraphDefinition;
import SeeleFelix.AnimaWeave.framework.startup.SystemStartupCoordinator;
import SeeleFelix.AnimaWeave.parser.AnimaWeaveDSLLexer;
import SeeleFelix.AnimaWeave.parser.AnimaWeaveDSLParser;
import java.io.File;
import java.nio.file.Files;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.springframework.stereotype.Component;

/**
 * AnimaWeave - 图执行的核心引擎
 *
 * <p>这是AnimaWeave系统的主入口，负责解析和执行图文件 框架自动加载内置的.anima容器文件，用户只需提供.weave图文件
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnimaWeave {

  private final GraphCoordinator graphCoordinator;
  private final SystemStartupCoordinator startupCoordinator;

  /**
   * 觉醒：执行图文件集合 (主用户接口)
   *
   * @param weaveFiles .weave图文件数组
   * @param mainGraphName 主图名称，如果为null则自动选择
   * @return 执行结果的Future
   */
  public CompletableFuture<AwakeningResult> awakening(File[] weaveFiles, String mainGraphName) {
    return CompletableFuture.supplyAsync(
        () -> {
          try {
            log.info(
                "🌅 AnimaWeave awakening begins with {} weave files, main graph: {}",
                weaveFiles.length,
                mainGraphName != null ? mainGraphName : "auto-detect");

            // 检查系统是否就绪
            if (!graphCoordinator.isSystemReady()) {
              return AwakeningResult.failure(
                  "system",
                  null,
                  "System is not ready. Please wait for vessel loading to complete.",
                  AwakeningResult.ExecutionTrace.empty());
            }

            // 验证所有文件都是.weave文件
            for (File file : weaveFiles) {
              if (!file.getName().endsWith(".weave")) {
                return AwakeningResult.failure(
                    file.getName(),
                    null,
                    "Only .weave files are allowed. Found: " + file.getName(),
                    AwakeningResult.ExecutionTrace.empty());
              }
            }

            // 解析所有.weave文件
            GraphDefinition mainGraph = parseWeaveFiles(weaveFiles, mainGraphName);

            // 开始图执行
            String executionId = graphCoordinator.startGraphExecution(mainGraph);

            log.info("✨ AnimaWeave awakening initiated for graph: {}", mainGraph.getName());

            // 等待图执行完成并返回完整的跟踪信息
            return graphCoordinator.waitForExecutionComplete(executionId, 60); // 60秒超时

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

  /**
   * 觉醒：执行图文件集合，自动检测主图
   *
   * @param weaveFiles .weave图文件数组
   * @return 执行结果的Future
   */
  public CompletableFuture<AwakeningResult> awakening(File[] weaveFiles) {
    return awakening(weaveFiles, null);
  }

  /**
   * 觉醒：执行单个图文件
   *
   * @param weaveFile .weave图文件
   * @return 执行结果的Future
   */
  public CompletableFuture<AwakeningResult> awakening(File weaveFile) {
    return awakening(new File[] {weaveFile}, null);
  }

  /**
   * 觉醒：执行单个图文件并指定主图
   *
   * @param weaveFile .weave图文件
   * @param mainGraphName 主图名称
   * @return 执行结果的Future
   */
  public CompletableFuture<AwakeningResult> awakening(File weaveFile, String mainGraphName) {
    return awakening(new File[] {weaveFile}, mainGraphName);
  }

  /** 解析.weave文件集合，构建图定义 框架自动处理.anima容器文件的加载 */
  private GraphDefinition parseWeaveFiles(File[] weaveFiles, String mainGraphName)
      throws Exception {
    log.debug("📄 Parsing {} weave files...", weaveFiles.length);

    // TODO: 实现多文件解析逻辑
    // 1. 自动加载所需的.anima容器文件（从sanctums/目录或内置资源）
    // 2. 解析所有.weave文件
    // 3. 根据mainGraphName选择主图，或自动检测
    // 4. 验证所有节点的容器依赖都已加载

    // 临时实现：处理单个.weave文件
    if (weaveFiles.length != 1) {
      throw new UnsupportedOperationException("Multiple weave files not yet supported");
    }

    File weaveFile = weaveFiles[0];

    // 解析.weave文件
    String weaveContent = Files.readString(weaveFile.toPath());
    log.debug(
        "📄 Read weave file content: {} chars from {}", weaveContent.length(), weaveFile.getName());

    // 解析DSL
    var lexer = new AnimaWeaveDSLLexer(CharStreams.fromString(weaveContent));
    var tokens = new CommonTokenStream(lexer);
    var parser = new AnimaWeaveDSLParser(tokens);

    // 添加错误监听器来捕获语法错误
    var errorListener =
        new org.antlr.v4.runtime.BaseErrorListener() {
          @Override
          public void syntaxError(
              org.antlr.v4.runtime.Recognizer<?, ?> recognizer,
              Object offendingSymbol,
              int line,
              int charPositionInLine,
              String msg,
              org.antlr.v4.runtime.RecognitionException e) {
            throw new IllegalArgumentException(
                String.format("Syntax error at line %d:%d - %s", line, charPositionInLine, msg));
          }
        };

    // 移除默认错误监听器并添加我们的错误监听器
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);

    var builder = new DSLGraphBuilder();

    var graphDefinition = builder.visit(parser.program());
    log.info("🔍 Parsed graph: {} from file: {}", graphDefinition.getName(), weaveFile.getName());

    // TODO: 自动加载图中引用的容器文件
    // 例如：从 "-- import basic.anima --" 中提取需要加载的容器
    log.info("📦 Framework automatically loading required containers (basic.anima, etc.)");

    return graphDefinition;
  }

  /**
   * 觉醒：执行图定义 (内部接口)
   *
   * @param graphDefinition 图定义
   * @return 执行结果的Future
   */
  public CompletableFuture<AwakeningResult> awakening(GraphDefinition graphDefinition) {
    return CompletableFuture.supplyAsync(
        () -> {
          try {
            log.info("🌅 AnimaWeave awakening begins for graph: {}", graphDefinition.getName());

            // 检查系统是否就绪
            if (!graphCoordinator.isSystemReady()) {
              return AwakeningResult.failure(
                  graphDefinition.getName(),
                  null,
                  "System is not ready. Please wait for vessel loading to complete.",
                  AwakeningResult.ExecutionTrace.empty());
            }

            // 开始图执行
            String executionId = graphCoordinator.startGraphExecution(graphDefinition);

            log.info("✨ AnimaWeave awakening initiated: {}", graphDefinition.getName());

            // 等待图执行完成并返回完整的跟踪信息
            return graphCoordinator.waitForExecutionComplete(executionId, 60); // 60秒超时

          } catch (Exception e) {
            log.error("💥 AnimaWeave awakening failed for graph: {}", graphDefinition.getName(), e);
            return AwakeningResult.failure(
                graphDefinition.getName(),
                null,
                "Awakening failed: " + e.getMessage(),
                AwakeningResult.ExecutionTrace.empty());
          }
        });
  }

  /**
   * 等待系统就绪
   *
   * @param timeoutSeconds 超时时间（秒）
   * @return 是否就绪
   */
  public boolean waitForSystemReady(long timeoutSeconds) {
    log.info("⏳ Waiting for system to be ready (timeout: {}s)...", timeoutSeconds);

    long startTime = System.currentTimeMillis();
    long timeoutMs = timeoutSeconds * 1000;

    while (!graphCoordinator.isSystemReady()) {
      if (System.currentTimeMillis() - startTime > timeoutMs) {
        log.warn("⏰ System readiness timeout after {}s", timeoutSeconds);
        return false;
      }

      try {
        Thread.sleep(100); // 每100ms检查一次
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
      }
    }

    log.info("✅ System is ready!");
    return true;
  }

  /** 获取系统启动状态 */
  public String getSystemStatus() {
    var status = startupCoordinator.getStartupStatus();
    return status.getStatusSummary();
  }

  /** 检查系统是否就绪 */
  public boolean isSystemReady() {
    return graphCoordinator.isSystemReady();
  }

  /** 强制系统就绪（仅用于测试环境） */
  public void forceSystemReadyForTesting() {
    log.info("🧪 Forcing system ready for testing environment");
    startupCoordinator.forceSystemReady();
  }
}
