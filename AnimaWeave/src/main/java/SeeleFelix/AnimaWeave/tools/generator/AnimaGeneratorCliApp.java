package SeeleFelix.AnimaWeave.tools.generator;

import SeeleFelix.AnimaWeave.framework.vessel.VesselRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * 独立的Anima文件生成器命令行应用
 * 
 * 这是一个完全独立的Spring Boot应用，专门用于生成.anima文件
 * 不包含任何web组件，启动快速，执行完成后自动退出
 * 
 * 使用方式：
 * java -jar AnimaWeave.jar --spring.main.sources=SeeleFelix.AnimaWeave.framework.generator.AnimaGeneratorCliApp
 */
@Slf4j
@SpringBootApplication(scanBasePackages = {
    "SeeleFelix.AnimaWeave.tools.generator",
    "SeeleFelix.AnimaWeave.vessels",
    "SeeleFelix.AnimaWeave.framework"  // 扫描整个framework包，确保所有依赖都被包含
})
public class AnimaGeneratorCliApp implements CommandLineRunner {

    private final AnimaFileGenerator generator;
    private final VesselRegistry vesselRegistry;

    public AnimaGeneratorCliApp(AnimaFileGenerator generator, VesselRegistry vesselRegistry) {
        this.generator = generator;
        this.vesselRegistry = vesselRegistry;
    }

    public static void main(String[] args) {
        log.info("🚀 启动Anima文件生成器命令行工具...");
        
        SpringApplication app = new SpringApplication(AnimaGeneratorCliApp.class);
        
        // 配置为非web应用
        app.setWebApplicationType(org.springframework.boot.WebApplicationType.NONE);
        
        // 禁用banner以减少输出噪音
        app.setBannerMode(org.springframework.boot.Banner.Mode.OFF);
        
        // 启动应用
        app.run(args);
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            log.info("🔨 开始生成.anima文件...");
            
            // 处理命令行参数：支持指定输出目录
            if (args.length > 0) {
                String outputDir = args[0];
                log.info("📁 使用自定义输出目录: {}", outputDir);
                // 动态设置输出目录
                var config = generator.getClass().getDeclaredField("config");
                config.setAccessible(true);
                GeneratorConfig generatorConfig = (GeneratorConfig) config.get(generator);
                generatorConfig.setOutputDirectory(outputDir);
            }
            
            // 依赖Spring自动机制加载vessel (SpringVesselAutoRegistrar + VesselManager)
            // 直接使用VesselRegistry中已注册的vessel
            generator.generateAllVesselFiles(vesselRegistry);
            
            log.info("🎉 .anima文件生成完成！");
            
            // 输出统计信息
            var vesselNames = vesselRegistry.getVesselNames();
            log.info("📊 已生成 {} 个vessel的.anima文件: {}", vesselNames.size(), vesselNames);
            
        } catch (Exception e) {
            log.error("❌ 生成过程中发生错误", e);
            throw e; // 重新抛出异常，让Spring Boot处理退出代码
        }
    }
} 