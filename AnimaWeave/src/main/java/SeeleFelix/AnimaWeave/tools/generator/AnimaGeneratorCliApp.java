package SeeleFelix.AnimaWeave.tools.generator;

import SeeleFelix.AnimaWeave.framework.vessel.AnimaVessel;
import SeeleFelix.AnimaWeave.framework.vessel.VesselRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.ComponentScan;

import java.util.Map;

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
    "SeeleFelix.AnimaWeave.vessels"
})
public class AnimaGeneratorCliApp implements CommandLineRunner {

    private final AnimaFileGenerator generator;
    private final VesselRegistry vesselRegistry;
    private final ApplicationContext applicationContext;

    public AnimaGeneratorCliApp(AnimaFileGenerator generator, VesselRegistry vesselRegistry, ApplicationContext applicationContext) {
        this.generator = generator;
        this.vesselRegistry = vesselRegistry;
        this.applicationContext = applicationContext;
    }

    public static void main(String[] args) {
        log.info("🚀 启动Anima文件生成器命令行工具...");
        
        SpringApplication app = new SpringApplication(AnimaGeneratorCliApp.class);
        
        // 配置为非web应用
        app.setWebApplicationType(org.springframework.boot.WebApplicationType.NONE);
        
        // 禁用banner以减少输出噪音
        app.setBannerMode(org.springframework.boot.Banner.Mode.OFF);
        
        // 设置JVM退出代码
        System.exit(SpringApplication.exit(app.run(args)));
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            log.info("🔍 自动发现并注册vessel...");
            discoverAndRegisterVessels();
            
            log.info("🔨 开始生成.anima文件...");
            generator.generateAllVesselFiles(vesselRegistry);
            
            log.info("🎉 .anima文件生成完成！");
            
        } catch (Exception e) {
            log.error("❌ 生成过程中发生错误", e);
            throw e; // 重新抛出异常，让Spring Boot处理退出代码
        }
    }
    
    /**
     * 自动发现并注册所有的vessel
     */
    private void discoverAndRegisterVessels() {
        Map<String, AnimaVessel> vesselBeans = applicationContext.getBeansOfType(AnimaVessel.class);
        
        log.info("发现 {} 个vessel bean", vesselBeans.size());
        
        vesselBeans.forEach((beanName, vessel) -> {
            String vesselId = vessel.getMetadata().name();
            vesselRegistry.register(vesselId, vessel);
            log.info("✓ 注册vessel: {} ({})", vesselId, beanName);
        });
        
        if (vesselBeans.isEmpty()) {
            log.warn("⚠️  未发现任何vessel，请检查ComponentScan配置");
        }
    }
} 