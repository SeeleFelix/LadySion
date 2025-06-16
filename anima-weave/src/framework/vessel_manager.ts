// AnimaWeave 容器管理器
// 负责容器的发现、加载、路径解析等功能

import type { AnimaVessel, VesselRegistry } from "./core.ts";

/**
 * 容器管理器 - 处理容器的动态发现和加载
 */
export class VesselManager {
  constructor(private registry: VesselRegistry) {}

  /**
   * 动态发现和加载容器
   */
  async discoverAndLoadVessels(): Promise<void> {
    console.log("🔍 动态发现容器...");

    // 扫描vessels目录，发现TypeScript容器实现
    await this.scanVesselModules();

    // 自动生成anima文件（给AI看的元数据）
    await this.generateAnimaFiles();

    console.log(`📊 已加载容器: ${this.registry.listVessels().join(", ")}`);
  }

  /**
   * 确保所需容器已加载
   */
  async ensureRequiredVesselsLoaded(
    requiredVessels: Set<string>,
    sanctumPath: string,
  ): Promise<void> {
    // 检查并加载缺失的容器
    for (const vesselName of requiredVessels) {
      if (!this.registry.getVessel(vesselName)) {
        await this.loadVessel(vesselName, sanctumPath);
      }
    }
  }

  /**
   * 扫描容器目录，加载TypeScript容器实现
   */
  private async scanVesselModules(): Promise<void> {
    try {
      const vesselsPath = await this.resolveVesselsPath();

      // 读取vessels目录
      for await (const dirEntry of Deno.readDir(vesselsPath)) {
        if (dirEntry.isDirectory) {
          const vesselName = dirEntry.name;
          console.log(`🔍 发现容器模块: ${vesselName}`);

          try {
            // 尝试加载容器的TypeScript实现
            await this.loadVesselModule(vesselName);
          } catch (error) {
            console.warn(
              `⚠️ 无法加载容器 ${vesselName}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ 无法扫描vessels目录:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * 智能解析容器目录路径
   */
  private async resolveVesselsPath(): Promise<string> {
    const possiblePaths = [
      "src/vessels", // 从anima-weave目录运行
      "anima-weave/src/vessels", // 从根目录运行
      "../anima-weave/src/vessels", // 从其他子目录运行
    ];

    for (const path of possiblePaths) {
      try {
        const fullPath = `${Deno.cwd()}/${path}`;
        await Deno.stat(fullPath);
        return path;
      } catch {
        // 路径不存在，尝试下一个
      }
    }

    // 如果所有路径都不存在，返回默认路径
    return "src/vessels";
  }

  /**
   * 智能解析容器模块路径
   */
  private async resolveVesselModulePath(vesselName: string): Promise<string> {
    const cwd = Deno.cwd();
    const possiblePaths = [
      `${cwd}/src/vessels/${vesselName}/vessel.ts`, // 从anima-weave目录运行
      `${cwd}/anima-weave/src/vessels/${vesselName}/vessel.ts`, // 从根目录运行
      `${cwd}/../anima-weave/src/vessels/${vesselName}/vessel.ts`, // 从其他子目录运行
    ];

    for (const path of possiblePaths) {
      try {
        await Deno.stat(path);
        // 返回file:// URL格式的绝对路径
        return `file://${path}`;
      } catch {
        // 路径不存在，尝试下一个
      }
    }

    // 如果所有路径都不存在，返回默认路径
    return `file://${cwd}/src/vessels/${vesselName}/vessel.ts`;
  }

  /**
   * 加载单个容器模块
   */
  private async loadVesselModule(vesselName: string): Promise<void> {
    console.log(`🔌 加载容器模块: ${vesselName}`);

    try {
      // 动态导入容器的TypeScript实现 - 修复路径问题
      const modulePath = await this.resolveVesselModulePath(vesselName);
      const vesselModule = await import(modulePath);

      // 创建容器实例 - 容器自己知道自己的定义
      const VesselClass =
        vesselModule[`${vesselName.charAt(0).toUpperCase() + vesselName.slice(1)}Vessel`];
      if (!VesselClass) {
        throw new Error(`Vessel class not found in module: ${modulePath}`);
      }

      // 容器自己提供定义，不需要外部anima文件
      const vessel = new VesselClass();
      this.registry.register(vessel);

      console.log(`✅ 成功加载容器: ${vesselName}`);
    } catch (error) {
      throw new Error(
        `Failed to load vessel ${vesselName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 动态加载容器
   */
  private async loadVessel(vesselName: string, sanctumPath: string): Promise<void> {
    console.log(`🔌 动态加载容器: ${vesselName}`);

    try {
      // 直接导入容器的TypeScript实现（容器自己定义能力）
      const modulePath = await this.resolveVesselModulePath(vesselName);
      const vesselModule = await import(modulePath);

      // 创建容器实例 - 容器自己知道自己的定义
      const VesselClass =
        vesselModule[`${vesselName.charAt(0).toUpperCase() + vesselName.slice(1)}Vessel`];
      if (!VesselClass) {
        throw new Error(`Vessel class not found in module: ${modulePath}`);
      }

      const vessel = new VesselClass();
      this.registry.register(vessel);

      console.log(`✅ 成功动态加载容器: ${vesselName}`);
    } catch (error) {
      throw new Error(
        `Failed to load vessel ${vesselName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 根据已加载的容器自动生成anima文件（给AI看的）
   */
  private async generateAnimaFiles(): Promise<void> {
    console.log("📝 自动生成anima文件...");

    for (const vesselName of this.registry.listVessels()) {
      try {
        const vessel = this.registry.getVessel(vesselName);
        if (!vessel) continue;

        // 生成anima文件内容
        const animaContent = this.generateAnimaContent(vessel);

        // 确保sanctums目录存在
        try {
          await Deno.mkdir("sanctums", { recursive: true });
        } catch {
          // 目录可能已存在，忽略错误
        }

        // 写入anima文件
        const animaPath = `sanctums/${vesselName}.anima`;
        await Deno.writeTextFile(animaPath, animaContent);

        console.log(`📄 生成anima文件: ${animaPath}`);
      } catch (error) {
        console.warn(
          `⚠️ 无法生成${vesselName}的anima文件:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  /**
   * 生成anima文件内容
   */
  private generateAnimaContent(vessel: AnimaVessel): string {
    let content = "-- types\n";

    // 生成类型定义（从Label类获取）
    const supportedLabels = vessel.getSupportedLabels();
    for (const LabelClass of supportedLabels) {
      const labelInstance = new LabelClass(null);
      const convertibleLabels = labelInstance.getConvertibleLabels();

      if (convertibleLabels.length > 0) {
        content += `${labelInstance.labelName} {\n`;
        for (const targetLabel of convertibleLabels) {
          content += `    ${targetLabel}\n`;
        }
        content += `}\n`;
      } else {
        content += `${labelInstance.labelName}\n`;
      }
    }

    content += "--\n\n-- nodes\n";

    // 生成节点定义（从Node类获取）
    const supportedNodes = vessel.getSupportedNodes();
    for (const NodeClass of supportedNodes) {
      const nodeInstance = new NodeClass();
      content += `${nodeInstance.nodeName} {\n`;
      content += `    mode Concurrent\n`; // 默认模式
      
      // 配置参数
      const configSchema = nodeInstance.getConfigSchema();
      if (Object.keys(configSchema).length > 0) {
        content += `    config {\n`;
        for (const [key, type] of Object.entries(configSchema)) {
          content += `        ${key} ${type}\n`;
        }
        content += `    }\n`;
      }
      
      content += `    in {\n`;

      // 输入端口
      for (const inputPort of nodeInstance.inputs) {
        const labelInstance = new inputPort.label(null);
        const fullTypeName = this.registry.getLabelFullTypeName(labelInstance);
        content += `        ${inputPort.name} ${fullTypeName}\n`;
      }

      content += `    }\n`;
      content += `    out {\n`;

      // 输出端口
      for (const outputPort of nodeInstance.outputs) {
        const labelInstance = new outputPort.label(null);
        const fullTypeName = this.registry.getLabelFullTypeName(labelInstance);
        content += `        ${outputPort.name} ${fullTypeName}\n`;
      }

      content += `    }\n`;
      content += "}\n\n";
    }

    content += "--\n";

    return content;
  }
}
