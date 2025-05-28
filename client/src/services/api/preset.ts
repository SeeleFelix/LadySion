import { BaseApiService } from '@/services/api'

export type PresetType = 'instruct' | 'context' | 'sysprompt' | 'master'

// 预设基础接口
export interface BasePreset {
  id?: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

// 指令模式预设
export interface InstructPreset extends BasePreset {
  type: 'instruct'
  template: string
  parameters: Record<string, any>
}

// 上下文模板预设
export interface ContextPreset extends BasePreset {
  type: 'context'
  template: string
  variables: Record<string, any>
}

// 系统提示词预设
export interface SystemPromptPreset extends BasePreset {
  type: 'sysprompt'
  content: string
  parameters: Record<string, any>
}

// 主预设
export interface MasterPreset extends BasePreset {
  type: 'master'
  data: Record<string, any>
}

export type Preset = InstructPreset | ContextPreset | SystemPromptPreset | MasterPreset

class PresetService extends BaseApiService {
  /**
   * 获取所有预设
   */
  async getAll(type: PresetType): Promise<Preset[]> {
    return this.get<Preset[]>(`/presets/${type}`)
  }

  /**
   * 根据ID获取预设
   */
  async getById(type: PresetType, id: string): Promise<Preset> {
    return this.get<Preset>(`/presets/${type}/${id}`)
  }

  /**
   * 保存预设（创建或更新）
   */
  async save(type: PresetType, preset: Preset): Promise<Preset> {
    if (preset.id) {
      return this.put<Preset>(`/presets/${type}/${preset.id}`, preset)
    } else {
      return this.post<Preset>(`/presets/${type}`, preset)
    }
  }

  /**
   * 删除预设
   */
  async remove(type: PresetType, id: string): Promise<void> {
    return this.delete(`/presets/${type}/${id}`)
  }

  /**
   * 选择指令模式预设
   */
  async selectInstructPreset(id: string): Promise<void> {
    return this.post(`/presets/instruct/select/${id}`)
  }

  /**
   * 选择上下文模板预设
   */
  async selectContextPreset(id: string): Promise<void> {
    return this.post(`/presets/context/select/${id}`)
  }

  /**
   * 选择系统提示词预设
   */
  async selectSystemPromptPreset(id: string): Promise<void> {
    return this.post(`/presets/sysprompt/select/${id}`)
  }

  /**
   * 更新指令模式配置
   */
  async updateInstructModeConfig(config: Record<string, any>): Promise<void> {
    return this.post('/presets/instruct/config', config)
  }

  /**
   * 更新上下文模板配置
   */
  async updateContextTemplateConfig(config: Record<string, any>): Promise<void> {
    return this.post('/presets/context/config', config)
  }

  /**
   * 更新系统提示词配置
   */
  async updateSystemPromptConfig(config: Record<string, any>): Promise<void> {
    return this.post('/presets/sysprompt/config', config)
  }

  /**
   * 获取宏描述
   */
  async getMacroDescriptions(): Promise<any[]> {
    return this.get<any[]>('/presets/macros')
  }

  /**
   * 获取所有主预设
   */
  async getAllMasterPresets(): Promise<MasterPreset[]> {
    return this.get<MasterPreset[]>('/presets/master')
  }

  /**
   * 导入主预设
   */
  async importMasterPreset(masterPreset: MasterPreset): Promise<MasterPreset> {
    return this.post<MasterPreset>('/presets/master/import', masterPreset)
  }

  /**
   * 导出主预设
   */
  async exportMasterPreset(name: string): Promise<any> {
    return this.get(`/presets/master/export/${name}`)
  }
}

export const presetApi = new PresetService() 