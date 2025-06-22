package SeeleFelix.AnimaWeave.framework.graph;

import SeeleFelix.AnimaWeave.framework.dsl.DSLGraphBuilder;
import SeeleFelix.AnimaWeave.parser.AnimaWeaveDSLLexer;
import SeeleFelix.AnimaWeave.parser.AnimaWeaveDSLParser;
import java.io.File;
import java.nio.file.Files;
import lombok.extern.slf4j.Slf4j;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.springframework.stereotype.Component;

/**
 * 图加载器 - 负责从文件加载和解析图定义
 */
@Slf4j
@Component
public class GraphLoader {

  /**
   * 从.weave文件集合加载图定义
   * 
   * @param weaveFiles .weave图文件数组
   * @param mainGraphName 主图名称（可选）
   * @return 解析后的图定义
   * @throws Exception 解析异常
   */
  public GraphDefinition loadFromFiles(File[] weaveFiles, String mainGraphName) throws Exception {
    log.debug("📄 Loading graph from {} weave files...", weaveFiles.length);

    if (weaveFiles.length != 1) {
      throw new UnsupportedOperationException("Multiple weave files not yet supported");
    }

    File weaveFile = weaveFiles[0];
    
    if (!weaveFile.getName().endsWith(".weave")) {
      throw new IllegalArgumentException("Only .weave files are allowed. Found: " + weaveFile.getName());
    }

    String weaveContent = Files.readString(weaveFile.toPath());
    log.debug("📄 Read weave file content: {} chars from {}", weaveContent.length(), weaveFile.getName());

    return parseWeaveContent(weaveContent, weaveFile.getName());
  }

  /**
   * 解析.weave文件内容
   * 
   * @param weaveContent .weave文件内容
   * @param fileName 文件名（用于日志）
   * @return 解析后的图定义
   */
  private GraphDefinition parseWeaveContent(String weaveContent, String fileName) {
    var lexer = new AnimaWeaveDSLLexer(CharStreams.fromString(weaveContent));
    var tokens = new CommonTokenStream(lexer);
    var parser = new AnimaWeaveDSLParser(tokens);

    var errorListener = new org.antlr.v4.runtime.BaseErrorListener() {
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

    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);

    var builder = new DSLGraphBuilder();
    var graphDefinition = builder.visit(parser.program());
    
    log.info("🔍 Loaded graph: {} from file: {}", graphDefinition.getName(), fileName);
    log.info("📦 Framework automatically loading required containers (basic.anima, etc.)");

    return graphDefinition;
  }
} 