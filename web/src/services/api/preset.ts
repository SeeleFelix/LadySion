import { BaseApiService } from "@/services/api";
import type {
  ApiResponse,
  ContextPreset,
  InstructPreset,
  MacroDescription,
  MasterPreset,
  Preset,
  PRESET_TYPE_LABELS,
  PresetConfiguration,
  PresetOperationResult,
  PresetQueryParams,
  PresetType,
  PresetTypeString,
  PresetValidationResult,
  SystemPromptPreset,
} from "@/types/preset";

// 重新导出类型供其他模块使用
export type {
  ContextPreset,
  InstructPreset,
  MasterPreset,
  Preset,
  PresetConfiguration,
  PresetQueryParams,
  PresetType,
  PresetTypeString,
  SystemPromptPreset,
};

export { PRESET_TYPE_LABELS, PresetType };

/**
 * 预设API服务类
 * 提供与后端预设相关API的交互方法
 */
class PresetService extends BaseApiService {
  // ================================
  // 基础CRUD操作
  // ================================

  /**
   * 获取指定类型的所有预设
   */
  async getAll(
    type: PresetType,
    params?: PresetQueryParams,
  ): Promise<Preset[]> {
    const queryString = params ? this.buildQueryString(params) : "";
    return this.get<Preset[]>(`/presets/${type}${queryString}`);
  }

  /**
   * 根据ID获取预设
   */
  async getById(type: PresetType, id: string): Promise<Preset | null> {
    try {
      return await this.get<Preset>(`/presets/${type}/${id}`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 根据名称获取预设
   */
  async getByName(type: PresetType, name: string): Promise<Preset | null> {
    try {
      return await this.get<Preset>(
        `/presets/${type}/name/${encodeURIComponent(name)}`,
      );
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 创建新预设
   */
  async create(
    type: PresetType,
    preset: Omit<Preset, "id" | "createdAt" | "updatedAt">,
  ): Promise<Preset> {
    return this.post<Preset>(`/presets/${type}`, preset);
  }

  /**
   * 更新预设
   */
  async update(
    type: PresetType,
    id: string,
    preset: Partial<Preset>,
  ): Promise<Preset> {
    return this.put<Preset>(`/presets/${type}/${id}`, preset);
  }

  /**
   * 删除预设
   */
  async delete(type: PresetType, id: string): Promise<void> {
    return this.delete(`/presets/${type}/${id}`);
  }

  /**
   * 保存预设（创建或更新的便捷方法）
   */
  async save(type: PresetType, preset: Preset): Promise<Preset> {
    if (preset.id) {
      return this.update(type, preset.id, preset);
    } else {
      return this.create(type, preset);
    }
  }

  // ================================
  // 预设验证
  // ================================

  /**
   * 验证预设数据
   */
  async validate(
    type: PresetType,
    preset: Partial<Preset>,
  ): Promise<PresetValidationResult> {
    return this.post<PresetValidationResult>(
      `/presets/${type}/validate`,
      preset,
    );
  }

  // ================================
  // 配置管理
  // ================================

  /**
   * 获取预设配置
   */
  async getConfiguration(): Promise<PresetConfiguration> {
    return this.get<PresetConfiguration>("/presets/config");
  }

  /**
   * 更新预设配置
   */
  async updateConfiguration(
    config: Partial<PresetConfiguration>,
  ): Promise<PresetConfiguration> {
    return this.put<PresetConfiguration>("/presets/config", config);
  }

  // ================================
  // 预设选择操作
  // ================================

  /**
   * 选择指令模式预设
   */
  async selectInstructPreset(id: string): Promise<PresetOperationResult> {
    return this.post<PresetOperationResult>(
      `/presets/${PresetType.INSTRUCT}/select/${id}`,
    );
  }

  /**
   * 选择上下文模板预设
   */
  async selectContextPreset(id: string): Promise<PresetOperationResult> {
    return this.post<PresetOperationResult>(
      `/presets/${PresetType.CONTEXT}/select/${id}`,
    );
  }

  /**
   * 选择系统提示词预设
   */
  async selectSystemPromptPreset(id: string): Promise<PresetOperationResult> {
    return this.post<PresetOperationResult>(
      `/presets/${PresetType.SYSTEM_PROMPT}/select/${id}`,
    );
  }

  /**
   * 获取当前选中的预设
   */
  async getSelectedPreset(type: PresetType): Promise<Preset | null> {
    try {
      return await this.get<Preset>(`/presets/${type}/selected`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // ================================
  // 宏操作
  // ================================

  /**
   * 获取宏描述列表
   */
  async getMacroDescriptions(): Promise<MacroDescription[]> {
    return this.get<MacroDescription[]>(`/presets/${PresetType.MACROS}`);
  }

  /**
   * 获取宏分类
   */
  async getMacroCategories(): Promise<string[]> {
    return this.get<string[]>(`/presets/${PresetType.MACROS}/categories`);
  }

  // ================================
  // 主预设操作
  // ================================

  /**
   * 获取所有主预设
   */
  async getAllMasterPresets(): Promise<MasterPreset[]> {
    return this.get<MasterPreset[]>("/presets/master");
  }

  /**
   * 导入主预设
   */
  async importMasterPreset(masterPreset: MasterPreset): Promise<MasterPreset> {
    return this.post<MasterPreset>("/presets/master/import", masterPreset);
  }

  /**
   * 导出主预设
   */
  async exportMasterPreset(name: string): Promise<MasterPreset> {
    return this.get<MasterPreset>(
      `/presets/master/export/${encodeURIComponent(name)}`,
    );
  }

  /**
   * 创建主预设
   */
  async createMasterPreset(
    masterPreset: Omit<MasterPreset, "exportedAt" | "importedAt">,
  ): Promise<MasterPreset> {
    return this.post<MasterPreset>("/presets/master", masterPreset);
  }

  // ================================
  // 批量操作
  // ================================

  /**
   * 批量删除预设
   */
  async deleteBatch(type: PresetType, ids: string[]): Promise<ApiResponse> {
    return this.post<ApiResponse>(`/presets/${type}/batch/delete`, { ids });
  }

  /**
   * 批量导出预设
   */
  async exportBatch(type: PresetType, ids: string[]): Promise<Preset[]> {
    return this.post<Preset[]>(`/presets/${type}/batch/export`, { ids });
  }

  /**
   * 批量导入预设
   */
  async importBatch(
    type: PresetType,
    presets: Preset[],
  ): Promise<ApiResponse<Preset[]>> {
    return this.post<ApiResponse<Preset[]>>(`/presets/${type}/batch/import`, {
      presets,
    });
  }

  // ================================
  // 搜索和筛选
  // ================================

  /**
   * 搜索预设
   */
  async search(query: string, types?: PresetType[]): Promise<Preset[]> {
    const params: Record<string, any> = { query };
    if (types && types.length > 0) {
      params.types = types.join(",");
    }
    return this.get<Preset[]>(
      `/presets/search${this.buildQueryString(params)}`,
    );
  }

  /**
   * 获取预设标签
   */
  async getTags(type?: PresetType): Promise<string[]> {
    const endpoint = type ? `/presets/${type}/tags` : "/presets/tags";
    return this.get<string[]>(endpoint);
  }

  /**
   * 获取预设分类
   */
  async getCategories(type?: PresetType): Promise<string[]> {
    const endpoint = type ? `/presets/${type}/categories` : "/presets/categories";
    return this.get<string[]>(endpoint);
  }

  // ================================
  // 统计信息
  // ================================

  /**
   * 获取预设统计信息
   */
  async getStats(): Promise<Record<string, number>> {
    return this.get<Record<string, number>>("/presets/stats");
  }

  /**
   * 记录预设使用
   */
  async recordUsage(type: PresetType, id: string): Promise<void> {
    return this.post(`/presets/${type}/${id}/usage`);
  }

  // ================================
  // 工具方法
  // ================================

  /**
   * 构建查询字符串
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, String(item)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  /**
   * 获取预设类型的显示名称
   */
  getTypeLabel(type: PresetType): string {
    return PRESET_TYPE_LABELS[type] || type;
  }

  /**
   * 检查预设类型是否有效
   */
  isValidType(type: string): type is PresetType {
    return Object.values(PresetType).includes(type as PresetType);
  }
}

export const presetApi = new PresetService();
