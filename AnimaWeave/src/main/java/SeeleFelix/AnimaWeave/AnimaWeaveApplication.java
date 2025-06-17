package SeeleFelix.AnimaWeave;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.event.ApplicationEventMulticaster;
import org.springframework.context.event.SimpleApplicationEventMulticaster;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.Executors;

/**
 * AnimaWeave主应用类
 * 配置了Virtual Threads和现代化的Spring特性
 */
@Slf4j
@SpringBootApplication
@EnableAsync
public class AnimaWeaveApplication {

	public static void main(String[] args) {
		// 启用Virtual Threads和现代化特性
		configureJavaFeatures();
		
		var context = SpringApplication.run(AnimaWeaveApplication.class, args);
		log.info("🚀 AnimaWeave started successfully with {} vessels", 
				context.getBeansOfType(org.springframework.stereotype.Component.class).size());
	}

	/**
	 * 配置Java特性
	 */
	private static void configureJavaFeatures() {
		// 启用Virtual Threads
		System.setProperty("spring.threads.virtual.enabled", "true");
		// 启用Java 21特性
		System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", 
						  String.valueOf(Runtime.getRuntime().availableProcessors()));
		
		log.info("🧵 Enabled Virtual Threads with {} processors", 
				Runtime.getRuntime().availableProcessors());
	}

	/**
	 * 配置Virtual Thread执行器 - 使用Java 21的现代化写法
	 */
	@Bean(name = "virtualThreadExecutor")
	public TaskExecutor virtualThreadExecutor() {
		return task -> Thread.ofVirtual()
			.name("animaweave-virtual-", 0)
			.uncaughtExceptionHandler((thread, exception) -> 
				log.error("Uncaught exception in virtual thread {}: {}", 
					thread.getName(), exception.getMessage(), exception))
			.start(task);
	}

	/**
	 * 配置事件多播器使用Virtual Threads
	 */
	@Bean
	public ApplicationEventMulticaster applicationEventMulticaster() {
		var eventMulticaster = new SimpleApplicationEventMulticaster();
		eventMulticaster.setTaskExecutor(virtualThreadExecutor());
		eventMulticaster.setErrorHandler(throwable -> 
			log.error("Event processing error: {}", throwable.getMessage(), throwable));
		return eventMulticaster;
	}

	/**
	 * 图执行专用的Virtual Thread池 - 优化为结构化并发
	 */
	@Bean(name = "graphExecutionThreadPool") 
	public TaskExecutor graphExecutionThreadPool() {
		return task -> Thread.ofVirtual()
			.name("graph-execution-", 0)
			.uncaughtExceptionHandler((thread, exception) -> 
				log.error("Graph execution error in thread {}: {}", 
					thread.getName(), exception.getMessage(), exception))
			.start(task);
	}

	/**
	 * 通用的并行处理执行器
	 */
	@Bean(name = "parallelExecutor")
	public TaskExecutor parallelExecutor() {
		return Executors.newVirtualThreadPerTaskExecutor()::execute;
	}
}
