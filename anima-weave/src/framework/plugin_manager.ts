// AnimaWeave 插件管理器
// 负责插件的发现、加载、路径解析等功能

import type { IAnimaPlugin, PluginRegistry } from "./core.ts";

/**
 * 插件管理器 - 处理插件的动态发现和加载
 */
export class PluginManager {
  constructor(private registry: PluginRegistry) {}

  /**
   * 动态发现和加载插件
   */
  async discoverAndLoadPlugins(): Promise<void> {
    console.log("🔍 动态发现插件...");

    // 扫描plugins目录，发现TypeScript插件实现
    await this.scanPluginModules();

    // 自动生成anima文件（给AI看的元数据）
    await this.generateAnimaFiles();

    console.log(`📊 已加载插件: ${this.registry.listPlugins().join(", ")}`);
  }

  /**
   * 确保所需插件已加载
   */
  async ensureRequiredPluginsLoaded(requiredPlugins: Set<string>, sanctumPath: string): Promise<void> {
    // 检查并加载缺失的插件
    for (const pluginName of requiredPlugins) {
      if (!this.registry.getPlugin(pluginName)) {
        await this.loadPlugin(pluginName, sanctumPath);
      }
    }
  }

  /**
   * 扫描插件目录，加载TypeScript插件实现
   */
  private async scanPluginModules(): Promise<void> {
    try {
      const pluginsPath = await this.resolvePluginsPath();

      // 读取plugins目录
      for await (const dirEntry of Deno.readDir(pluginsPath)) {
        if (dirEntry.isDirectory) {
          const pluginName = dirEntry.name;
          console.log(`🔍 发现插件模块: ${pluginName}`);

          try {
            // 尝试加载插件的TypeScript实现
            await this.loadPluginModule(pluginName);
          } catch (error) {
            console.warn(
              `⚠️ 无法加载插件 ${pluginName}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ 无法扫描plugins目录:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * 智能解析插件目录路径
   */
  private async resolvePluginsPath(): Promise<string> {
    const possiblePaths = [
      "src/plugins",                    // 从anima-weave目录运行
      "anima-weave/src/plugins",        // 从根目录运行
      "../anima-weave/src/plugins",     // 从其他子目录运行
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
    return "src/plugins";
  }

  /**
   * 智能解析插件模块路径
   */
  private async resolvePluginModulePath(pluginName: string): Promise<string> {
    const cwd = Deno.cwd();
    const possiblePaths = [
      `${cwd}/src/plugins/${pluginName}/plugin.ts`,           // 从anima-weave目录运行
      `${cwd}/anima-weave/src/plugins/${pluginName}/plugin.ts`, // 从根目录运行
      `${cwd}/../anima-weave/src/plugins/${pluginName}/plugin.ts`, // 从其他子目录运行
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
    return `file://${cwd}/src/plugins/${pluginName}/plugin.ts`;
  }

  /**
   * 加载单个插件模块
   */
  private async loadPluginModule(pluginName: string): Promise<void> {
    console.log(`🔌 加载插件模块: ${pluginName}`);

    try {
      // 动态导入插件的TypeScript实现 - 修复路径问题
      const modulePath = await this.resolvePluginModulePath(pluginName);
      const pluginModule = await import(modulePath);

      // 创建插件实例 - 插件自己知道自己的定义
      const PluginClass =
        pluginModule[`${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}Plugin`];
      if (!PluginClass) {
        throw new Error(`Plugin class not found in module: ${modulePath}`);
      }

      // 插件自己提供定义，不需要外部anima文件
      const plugin = new PluginClass();
      this.registry.register(plugin);

      console.log(`✅ 成功加载插件: ${pluginName}`);
    } catch (error) {
      throw new Error(
        `Failed to load plugin ${pluginName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 动态加载插件
   */
  private async loadPlugin(pluginName: string, sanctumPath: string): Promise<void> {
    console.log(`🔌 动态加载插件: ${pluginName}`);

    try {
      // 直接导入插件的TypeScript实现（插件自己定义能力）
      const modulePath = await this.resolvePluginModulePath(pluginName);
      const pluginModule = await import(modulePath);

      // 创建插件实例 - 插件自己知道自己的定义
      const PluginClass =
        pluginModule[`${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}Plugin`];
      if (!PluginClass) {
        throw new Error(`Plugin class not found in module: ${modulePath}`);
      }

      const plugin = new PluginClass();
      this.registry.register(plugin);

      console.log(`✅ 成功动态加载插件: ${pluginName}`);
    } catch (error) {
      throw new Error(
        `Failed to load plugin ${pluginName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 根据已加载的插件自动生成anima文件（给AI看的）
   */
  private async generateAnimaFiles(): Promise<void> {
    console.log("📝 自动生成anima文件...");

    for (const pluginName of this.registry.listPlugins()) {
      try {
        const plugin = this.registry.getPlugin(pluginName);
        if (!plugin) continue;

        // 生成anima文件内容
        const animaContent = this.generateAnimaContent(plugin);

        // 确保sanctums目录存在
        try {
          await Deno.mkdir("sanctums", { recursive: true });
        } catch {
          // 目录可能已存在，忽略错误
        }

        // 写入anima文件
        const animaPath = `sanctums/${pluginName}.anima`;
        await Deno.writeTextFile(animaPath, animaContent);

        console.log(`📄 生成anima文件: ${animaPath}`);
      } catch (error) {
        console.warn(
          `⚠️ 无法生成${pluginName}的anima文件:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  /**
   * 生成anima文件内容
   */
  private generateAnimaContent(plugin: IAnimaPlugin): string {
    let content = "-- types\n";

    // 生成类型定义（从Label类获取）
    const supportedLabels = plugin.getSupportedLabels();
    for (const LabelClass of supportedLabels) {
      const labelInstance = new LabelClass(null);
      content += `${labelInstance.labelName}\n`;
    }

    content += "--\n\n-- nodes\n";

    // 生成节点定义（从Node类获取）
    const supportedNodes = plugin.getSupportedNodes();
    for (const NodeClass of supportedNodes) {
      const nodeInstance = new NodeClass();
      content += `${nodeInstance.nodeName} {\n`;
      content += `    mode Concurrent\n`; // 默认模式
      content += `    in {\n`;
      
      // 输入端口
      for (const inputPort of nodeInstance.inputs) {
        const labelInstance = new inputPort.label(null);
        content += `        ${inputPort.name} ${plugin.name}.${labelInstance.labelName}\n`;
      }
      
      content += `    }\n`;
      content += `    out {\n`;
      
      // 输出端口
      for (const outputPort of nodeInstance.outputs) {
        const labelInstance = new outputPort.label(null);
        content += `        ${outputPort.name} ${plugin.name}.${labelInstance.labelName}\n`;
      }
      
      content += `    }\n`;
      content += "}\n\n";
    }

    content += "--\n";

    return content;
  }
} 