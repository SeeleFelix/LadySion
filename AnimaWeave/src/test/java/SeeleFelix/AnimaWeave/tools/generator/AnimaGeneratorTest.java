package SeeleFelix.AnimaWeave.tools.generator;

import static com.diffplug.selfie.Selfie.expectSelfie;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

class AnimaGeneratorTest {

    @Test  
    void shouldGenerateAnimaFileForRegisteredVessel(@TempDir Path tempDir) throws Exception {
        // JUnit 5 自动提供临时目录，测试结束后自动清理
        Path animaFile = tempDir.resolve("basic.anima");
        
        // 传入临时目录作为输出目录参数
        String[] args = {tempDir.toString()};
        SeeleFelix.AnimaWeave.tools.generator.AnimaGeneratorCliApp.main(args);
        
        // 验证文件是否生成
        assertThat(animaFile).exists();
        String content = Files.readString(animaFile);
        
        // Selfie快照测试
        expectSelfie(content).toMatchDisk();
    }
    

} 