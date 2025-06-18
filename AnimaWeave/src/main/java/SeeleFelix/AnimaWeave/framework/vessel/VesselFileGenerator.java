package SeeleFelix.AnimaWeave.framework.vessel;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Vessel文件生成器
 * 启动时自动生成所有vessel的.anima文件到sanctums目录
 */
@Slf4j
@Component
public class VesselFileGenerator implements CommandLineRunner {
    
    private final VesselRegistry vesselRegistry;
    
    public VesselFileGenerator(VesselRegistry vesselRegistry) {
        this.vesselRegistry = vesselRegistry;
    }
    
    @Override
    public void run(String... args) throws Exception {
        // 检查是否有生成参数
        boolean shouldGenerate = false;
        for (String arg : args) {
            if ("--generate-anima".equals(arg)) {
                shouldGenerate = true;
                break;
            }
        }
        
        if (!shouldGenerate) {
            log.debug("跳过.anima文件生成（添加 --generate-anima 参数启用）");
            return;
        }
        
        generateAllVesselFiles();
    }
    
    /**
     * 生成所有vessel的.anima文件
     */
    public void generateAllVesselFiles() {
        try {
            // 确定输出目录 - 使用项目根目录下的sanctums目录
            var projectRoot = Paths.get("").toAbsolutePath();
            var sanctumsDir = projectRoot.resolve("sanctums");
            
            log.info("🔨 开始生成vessel .anima文件到目录: {}", sanctumsDir);
            
            // 创建BasicVessel实例并生成文件
            var basicVessel = new BasicVessel();
            var basicAnimaPath = sanctumsDir.resolve("basic_generated.anima");
            
            AnimaFileGenerator.saveToFile(basicVessel, basicAnimaPath);
            
            log.info("✅ 成功生成basic vessel的.anima文件: {}", basicAnimaPath);
            
            // 可以在这里添加其他vessel的生成逻辑
            // generateMathVessel(sanctumsDir);
            // generateOpenRouterVessel(sanctumsDir);
            
        } catch (Exception e) {
            log.error("❌ 生成vessel .anima文件失败", e);
        }
    }
    
    /**
     * 手动生成指定vessel的.anima文件
     */
    public void generateVesselFile(AnimaVessel vessel, String fileName) {
        try {
            var projectRoot = Paths.get("").toAbsolutePath();
            var sanctumsDir = projectRoot.resolve("sanctums");
            var outputPath = sanctumsDir.resolve(fileName);
            
            AnimaFileGenerator.saveToFile(vessel, outputPath);
            log.info("✅ 生成{}的.anima文件: {}", vessel.getMetadata().name(), outputPath);
            
        } catch (Exception e) {
            log.error("❌ 生成{}的.anima文件失败", vessel.getMetadata().name(), e);
        }
    }
    
    /**
     * 对比生成的文件与现有文件的差异
     */
    public void compareWithExisting(String vesselName) {
        try {
            var projectRoot = Paths.get("").toAbsolutePath();
            var sanctumsDir = projectRoot.resolve("sanctums");
            
            var existingFile = sanctumsDir.resolve(vesselName + ".anima");
            var generatedFile = sanctumsDir.resolve(vesselName + "_generated.anima");
            
            if (existingFile.toFile().exists() && generatedFile.toFile().exists()) {
                // 这里可以添加文件比较逻辑
                log.info("📋 可以比较文件: {} vs {}", existingFile, generatedFile);
            } else {
                log.warn("⚠️ 无法比较文件，某些文件不存在");
            }
            
        } catch (Exception e) {
            log.error("❌ 比较文件失败", e);
        }
    }
} 