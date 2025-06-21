package SeeleFelix.AnimaWeave.integration;

import static org.junit.jupiter.api.Assertions.*;

import SeeleFelix.AnimaWeave.framework.awakening.AnimaWeave;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/** AnimaWeave集成测试 - 端到端黑盒测试 */
@SpringBootTest
@TestPropertySource(properties = {"logging.level.SeeleFelix.AnimaWeave=DEBUG"})
class TimestampPipelineTest {

  @Autowired private AnimaWeave animaWeave;

  private Path tempDir;

  @BeforeEach
  void setUp() throws IOException, InterruptedException {
    tempDir = Files.createTempDirectory("animaweave-test");
    // Spring容器启动完成后，所有vessel都已注册，无需等待系统就绪
  }

  @AfterEach
  void tearDown() throws IOException {
    if (tempDir != null && Files.exists(tempDir)) {
      Files.walk(tempDir)
          .sorted((a, b) -> b.compareTo(a))
          .forEach(
              path -> {
                try {
                  Files.delete(path);
                } catch (IOException e) {
                  // ignore cleanup errors
                }
              });
    }
  }

  @Test
  void shouldExecuteBasicPipeline() throws Exception {
    String weaveContent =
        """
            -- import
            basic.anima
            --

            -- graph
            nodes {
                starter basic.Start
                timestamper basic.GetTimestamp
                evenChecker basic.IsEven
            }

            datas {
                timestamper.timestamp -> evenChecker.number;
            }

            controls {
                starter.signal -> timestamper.trigger;
                timestamper.done -> evenChecker.trigger;
            }
            --
            """;

    File weaveFile = createTempFile("basic_pipeline.weave", weaveContent);
    var result = animaWeave.awakening(weaveFile).get(10, TimeUnit.SECONDS);

    assertTrue(result.isSuccess());
    assertNotNull(result.getExecutionId());

    var trace = result.getExecutionTrace();
    assertEquals(3, trace.getExecutedNodesCount());
    assertEquals(3, trace.getSuccessfulNodesCount());
    assertEquals(0, trace.getFailedNodesCount());
  }

  @Test
  void shouldExecuteNamedGraph() throws Exception {
    String weaveContent =
        """
            -- import
            basic.anima
            --

            -- graph TimestampPipeline
            nodes {
                starter basic.Start
                timestamper basic.GetTimestamp
            }

            controls {
                starter.signal -> timestamper.trigger;
            }
            --
            """;

    File weaveFile = createTempFile("named_pipeline.weave", weaveContent);
    var result = animaWeave.awakening(weaveFile, "TimestampPipeline").get(10, TimeUnit.SECONDS);

    assertTrue(result.isSuccess());
    assertNotNull(result.getExecutionId());

    var trace = result.getExecutionTrace();
    assertEquals(2, trace.getExecutedNodesCount());
    assertEquals(2, trace.getSuccessfulNodesCount());
  }

  @Test
  void shouldExecuteSimpleGraph() throws Exception {
    String weaveContent =
        """
            -- import
            basic.anima
            --

            -- graph
            nodes {
                starter basic.Start
            }
            --
            """;

    File weaveFile = createTempFile("simple.weave", weaveContent);
    var result = animaWeave.awakening(weaveFile).get(10, TimeUnit.SECONDS);

    assertTrue(result.isSuccess());
    assertNotNull(result.getExecutionId());

    var trace = result.getExecutionTrace();
    assertEquals(1, trace.getExecutedNodesCount());
    assertEquals(1, trace.getSuccessfulNodesCount());
  }

  @Test
  void shouldRejectNonWeaveFile() throws Exception {
    File txtFile = createTempFile("not_a_weave.txt", "This is not a weave file");
    var result = animaWeave.awakening(txtFile).get(5, TimeUnit.SECONDS);

    assertTrue(result.isFailure());
    assertNotNull(result.getMessage());
    assertTrue(result.getMessage().contains("Only .weave files are allowed"));
  }

  @Test
  void shouldRejectInvalidSyntax() throws Exception {
    String invalidWeaveContent =
        """
            -- import
            basic.anima
            --

            -- graph
            nodes {
                starter basic.Start
                invalid_node_definition
            }
            --
            """;

    File invalidWeaveFile = createTempFile("invalid_syntax.weave", invalidWeaveContent);
    var result = animaWeave.awakening(invalidWeaveFile).get(5, TimeUnit.SECONDS);

    assertTrue(result.isFailure());
    assertNotNull(result.getMessage());
  }

  @Test
  void shouldRejectMultipleWeaveFiles() throws Exception {
    String weave1Content =
        """
            -- import
            basic.anima
            --

            -- graph Pipeline1
            nodes {
                starter basic.Start
            }
            --
            """;

    String weave2Content =
        """
            -- import
            basic.anima
            --

            -- graph Pipeline2
            nodes {
                starter basic.Start
            }
            --
            """;

    File weaveFile1 = createTempFile("pipeline1.weave", weave1Content);
    File weaveFile2 = createTempFile("pipeline2.weave", weave2Content);
    File[] weaveFiles = {weaveFile1, weaveFile2};

    var result = animaWeave.awakening(weaveFiles, "Pipeline1").get(10, TimeUnit.SECONDS);

    assertTrue(result.isFailure());
    assertTrue(
        result.getMessage().contains("Multiple weave files not yet supported")
            || result.getMessage().contains("not yet supported"));
  }

  @Test
  void shouldProvideCompleteExecutionTrace() throws Exception {
    String weaveContent =
        """
            -- import
            basic.anima
            --

            -- graph ExecutionTrackingTest
            nodes {
                starter basic.Start
                timestamper basic.GetTimestamp
                evenChecker basic.IsEven
            }

            datas {
                timestamper.timestamp -> evenChecker.number;
            }

            controls {
                starter.signal -> timestamper.trigger;
                timestamper.done -> evenChecker.trigger;
            }
            --
            """;

    File weaveFile = createTempFile("execution_tracking_test.weave", weaveContent);
    var result = animaWeave.awakening(weaveFile, "ExecutionTrackingTest").get(10, TimeUnit.SECONDS);

    assertTrue(result.isSuccess());

    var trace = result.getExecutionTrace();
    assertNotNull(trace);
    assertFalse(trace.isEmpty());

    // 验证基本统计数据
    assertEquals(3, trace.getExecutedNodesCount());
    assertEquals(3, trace.getSuccessfulNodesCount());
    assertEquals(0, trace.getFailedNodesCount());
    assertTrue(trace.getTotalDuration().toMillis() >= 0);

    // 验证执行时间线
    var timeline = trace.getExecutionTimeline();
    assertEquals(3, timeline.size());

    // 验证节点执行顺序
    assertEquals("starter", timeline.get(0).getNodeId());
    assertEquals("timestamper", timeline.get(1).getNodeId());
    assertEquals("evenChecker", timeline.get(2).getNodeId());

    // 验证节点类型
    assertEquals("basic.Start", timeline.get(0).getNodeType());
    assertEquals("basic.GetTimestamp", timeline.get(1).getNodeType());
    assertEquals("basic.IsEven", timeline.get(2).getNodeType());

    // 验证所有节点都成功执行
    assertTrue(timeline.stream().allMatch(ne -> ne.isSuccess()));

    // 验证调试日志存在
    assertFalse(trace.getDebugLogs().isEmpty());

    // 验证元数据
    var metadata = trace.getExecutionMetadata();
    assertEquals("3", metadata.get("totalNodes"));
    assertEquals("3", metadata.get("successfulNodes"));
    assertEquals("0", metadata.get("failedNodes"));
  }

  private File createTempFile(String fileName, String content) throws IOException {
    Path filePath = tempDir.resolve(fileName);
    Files.writeString(filePath, content);
    return filePath.toFile();
  }
}
