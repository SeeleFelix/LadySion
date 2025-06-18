package SeeleFelix.AnimaWeave.tools.generator;

import SeeleFelix.AnimaWeave.framework.vessel.VesselRegistry;
import SeeleFelix.AnimaWeave.framework.vessel.VesselRegistryImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 命令行应用的配置类
 * 
 * 手动注册必要的vessel组件，避免扫描整个vessel包
 * 这样可以避免依赖VesselManager和EventDispatcher等复杂组件
 */
@Configuration
public class CliConfiguration {
    
    /**
     * 创建VesselRegistry实例
     * 这是生成器唯一需要的vessel组件
     */
    @Bean
    public VesselRegistry vesselRegistry() {
        return new VesselRegistryImpl();
    }
} 