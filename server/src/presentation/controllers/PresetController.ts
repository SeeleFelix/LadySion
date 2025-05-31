import { Context, RouterContext } from "oak/mod.ts";
import { PresetApplicationService } from "@/application/services/PresetApplicationService.ts";
import { Preset, PresetType } from "@/domain/entities/Preset.ts";
import { BaseController } from "@/presentation/controllers/BaseController.ts";

/**
 * 预设控制器
 * 处理预设相关的HTTP请求
 */
export class PresetController extends BaseController {
  constructor(private presetApplicationService: PresetApplicationService) {
    super();
  }

  /**
   * 获取所有预设（所有类型）
   */
  getAllPresetsWithoutType = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const allPresets: Preset[] = [];

      // 获取所有类型的预设
      for (const presetType of Object.values(PresetType)) {
        const presets = await this.presetApplicationService.getAllPresets(
          presetType,
        );
        // 给每个预设添加类型信息
        const presetsWithType = presets.map((preset) => ({
          ...preset,
          type: presetType,
        }));
        allPresets.push(...presetsWithType);
      }

      return { presets: allPresets };
    }, ctx);
  };

  /**
   * 获取指定类型的所有预设
   */
  getAllPresets = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const { type } = ctx.params;
      const presetType = type as PresetType;

      if (!Object.values(PresetType).includes(presetType)) {
        return { error: "无效的预设类型" };
      }

      const presets = await this.presetApplicationService.getAllPresets(
        presetType,
      );
      return { presets };
    }, ctx);
  };

  /**
   * 根据ID获取预设
   */
  getPreset = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const { type, id } = ctx.params;
      const presetType = type as PresetType;

      if (!Object.values(PresetType).includes(presetType)) {
        return { error: "无效的预设类型" };
      }

      const preset = await this.presetApplicationService.getPresetById(
        presetType,
        id!,
      );

      if (!preset) {
        return { error: "预设不存在" };
      }

      return { preset };
    }, ctx);
  };

  /**
   * 保存预设
   */
  savePreset = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const { type } = ctx.params;
      const presetType = type as PresetType;

      if (!Object.values(PresetType).includes(presetType)) {
        return { error: "无效的预设类型" };
      }

      const preset = await ctx.request.body.json() as Preset;

      if (!preset.name) {
        return { error: "预设名称是必需的" };
      }

      const savedPreset = await this.presetApplicationService.savePreset(
        presetType,
        preset,
      );
      return { message: "Preset saved", savedPreset };
    }, ctx);
  };

  /**
   * 删除预设
   */
  deletePreset = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const { type, id } = ctx.params;
      const presetType = type as PresetType;

      if (!Object.values(PresetType).includes(presetType)) {
        return { error: "无效的预设类型" };
      }

      await this.presetApplicationService.deletePreset(presetType, id!);
      return { message: "Preset deleted" };
    }, ctx);
  };

  /**
   * 导入主预设
   */
  importMasterPreset = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const masterPreset = await ctx.request.body.json();

      if (!masterPreset.name) {
        return { error: "预设名称是必需的" };
      }

      await this.presetApplicationService.importMasterPreset(masterPreset);
      return { message: "主预设导入成功" };
    }, ctx);
  };

  /**
   * 导出主预设
   */
  exportMasterPreset = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const url = ctx.request.url;
      const name = url.searchParams.get("name")!;
      const instructId = url.searchParams.get("instructId")!;
      const contextId = url.searchParams.get("contextId")!;
      const systemPromptId = url.searchParams.get("systemPromptId")!;
      const postHistoryId = url.searchParams.get("postHistoryId")!;

      if (!name) {
        return { error: "预设名称是必需的" };
      }

      const masterPreset = await this.presetApplicationService
        .exportMasterPreset(
          name,
          instructId,
          contextId,
          systemPromptId,
          postHistoryId,
        );

      return { masterPreset };
    }, ctx);
  };

  /**
   * 获取配置
   */
  getConfiguration = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const key = ctx.params.key!;

      if (!key) {
        return { error: "配置键是必需的" };
      }

      const configuration = await this.presetApplicationService
        .getConfiguration(key);
      return { configuration };
    }, ctx);
  };

  /**
   * 保存配置
   */
  saveConfiguration = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const key = ctx.params.key!;
      const configuration = await ctx.request.body.json();

      if (!key) {
        return { error: "配置键是必需的" };
      }

      await this.presetApplicationService.saveConfiguration(key, configuration);
      return { message: "配置保存成功" };
    }, ctx);
  };

  /**
   * 获取宏描述列表
   */
  getMacroDescriptions = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const descriptions = this.presetApplicationService.getMacroDescriptions();
      return { descriptions };
    }, ctx);
  };

  /**
   * 处理宏
   */
  processMacros = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const body = await ctx.request.body.json();
      const { text, context } = body;

      if (!text) {
        return { error: "文本是必需的" };
      }

      const processedText = this.presetApplicationService.processMacros(
        text,
        context,
      );
      return { processedText };
    }, ctx);
  };

  /**
   * 验证宏语法
   */
  validateMacroSyntax = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const body = await ctx.request.body.json();
      const { text } = body;

      if (!text) {
        return { error: "文本是必需的" };
      }

      const result = this.presetApplicationService.validateMacroSyntax(text);
      return { result };
    }, ctx);
  };

  /**
   * 获取文本中使用的宏列表
   */
  getUsedMacros = async (ctx: any): Promise<void> => {
    await this.handleRequest(async () => {
      const body = await ctx.request.body.json();
      const { text } = body;

      if (!text) {
        return { error: "文本是必需的" };
      }

      const usedMacros = this.presetApplicationService.getUsedMacros(text);
      return { usedMacros };
    }, ctx);
  };
}
