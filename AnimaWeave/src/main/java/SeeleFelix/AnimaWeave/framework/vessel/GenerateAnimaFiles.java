package SeeleFelix.AnimaWeave.framework.vessel;

import java.nio.file.Paths;

/**
 * 独立的.anima文件生成工具
 * 不依赖Spring，直接运行生成文件
 */
public class GenerateAnimaFiles {
    
    public static void main(String[] args) {
        try {
            System.out.println("🔨 开始生成vessel .anima文件...");
            
            // 确定输出目录
            var currentDir = Paths.get("").toAbsolutePath();
            var sanctumsDir = currentDir.resolve("sanctums");
            
            System.out.println("📁 输出目录: " + sanctumsDir);
            
            // 生成BasicVessel的.anima文件
            var basicVessel = new BasicVessel();
            var basicAnimaPath = sanctumsDir.resolve("basic_generated.anima");
            
            AnimaFileGenerator.saveToFile(basicVessel, basicAnimaPath);
            
            System.out.println("✅ 成功生成basic vessel的.anima文件: " + basicAnimaPath);
            
            // 显示生成的内容
            System.out.println("\n📄 生成的.anima文件内容:");
            System.out.println("=".repeat(50));
            var content = AnimaFileGenerator.generateAnimaContent(basicVessel);
            System.out.println(content);
            System.out.println("=" .repeat(50));
            
        } catch (Exception e) {
            System.err.println("❌ 生成失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 