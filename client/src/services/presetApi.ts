import { 
  Preset, 
  PresetType, 
  CreatePresetData, 
  UpdatePresetData,
  PresetOperationResult,
  PresetSortOptions,
  PresetFilters
} from '@/types/preset'

const API_BASE = '/api'

class PresetApiService {
  // 获取所有预设
  async getAllPresets(): Promise<Preset[]> {
    const response = await fetch(`${API_BASE}/presets`)
    if (!response.ok) {
      throw new Error('获取预设列表失败')
    }
    return response.json()
  }

  // 根据类型获取预设
  async getPresetsByType(type: PresetType): Promise<Preset[]> {
    const response = await fetch(`${API_BASE}/presets/type/${type}`)
    if (!response.ok) {
      throw new Error(`获取${type}类型预设失败`)
    }
    return response.json()
  }

  // 获取单个预设
  async getPresetById(id: string): Promise<Preset> {
    const response = await fetch(`${API_BASE}/presets/${id}`)
    if (!response.ok) {
      throw new Error('获取预设详情失败')
    }
    return response.json()
  }

  // 创建新预设
  async createPreset(data: CreatePresetData): Promise<PresetOperationResult> {
    const response = await fetch(`${API_BASE}/presets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '创建预设失败')
    }
    
    return result
  }

  // 更新预设
  async updatePreset(id: string, data: UpdatePresetData): Promise<PresetOperationResult> {
    const response = await fetch(`${API_BASE}/presets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '更新预设失败')
    }
    
    return result
  }

  // 删除预设
  async deletePreset(id: string): Promise<PresetOperationResult> {
    const response = await fetch(`${API_BASE}/presets/${id}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '删除预设失败')
    }
    
    return result
  }

  // 批量删除预设
  async batchDeletePresets(ids: string[]): Promise<PresetOperationResult> {
    const response = await fetch(`${API_BASE}/presets/batch`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '批量删除预设失败')
    }
    
    return result
  }

  // 复制预设
  async duplicatePreset(id: string, newName?: string): Promise<PresetOperationResult> {
    const response = await fetch(`${API_BASE}/presets/${id}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newName })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '复制预设失败')
    }
    
    return result
  }

  // 启用/禁用预设
  async togglePresetStatus(id: string, enabled: boolean): Promise<PresetOperationResult> {
    const response = await fetch(`${API_BASE}/presets/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '更新预设状态失败')
    }
    
    return result
  }

  // 批量启用/禁用预设
  async batchTogglePresets(ids: string[], enabled: boolean): Promise<PresetOperationResult> {
    const response = await fetch(`${API_BASE}/presets/batch/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids, enabled })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '批量更新预设状态失败')
    }
    
    return result
  }

  // 搜索预设
  async searchPresets(query: string, type?: PresetType): Promise<Preset[]> {
    const params = new URLSearchParams({ q: query })
    if (type) {
      params.append('type', type)
    }
    
    const response = await fetch(`${API_BASE}/presets/search?${params}`)
    if (!response.ok) {
      throw new Error('搜索预设失败')
    }
    return response.json()
  }

  // 获取预设排序
  async getSortedPresets(options: PresetSortOptions, type?: PresetType): Promise<Preset[]> {
    const params = new URLSearchParams({
      sortBy: options.sortBy,
      sortOrder: options.sortOrder
    })
    if (type) {
      params.append('type', type)
    }
    
    const response = await fetch(`${API_BASE}/presets/sorted?${params}`)
    if (!response.ok) {
      throw new Error('获取排序预设失败')
    }
    return response.json()
  }

  // 过滤预设
  async filterPresets(filters: PresetFilters, type?: PresetType): Promise<Preset[]> {
    const response = await fetch(`${API_BASE}/presets/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filters, type })
    })
    
    if (!response.ok) {
      throw new Error('过滤预设失败')
    }
    return response.json()
  }

  // 导出预设
  async exportPresets(scope: 'current' | 'type' | 'all', options: {
    format: 'json' | 'yaml'
    includeMetadata?: boolean
    includeTimestamps?: boolean
    type?: PresetType
    presetId?: string
  }): Promise<Blob> {
    const response = await fetch(`${API_BASE}/presets/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ scope, ...options })
    })
    
    if (!response.ok) {
      throw new Error('导出预设失败')
    }
    
    return response.blob()
  }

  // 导入预设
  async importPresets(file: File, options: {
    conflictResolution: 'skip' | 'overwrite' | 'rename'
    strictValidation: boolean
  }): Promise<PresetOperationResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('options', JSON.stringify(options))
    
    const response = await fetch(`${API_BASE}/presets/import`, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '导入预设失败')
    }
    
    return result
  }

  // 获取默认预设
  async getDefaultPresets(type: PresetType): Promise<Preset[]> {
    const response = await fetch(`${API_BASE}/presets/defaults/${type}`)
    if (!response.ok) {
      throw new Error('获取默认预设失败')
    }
    return response.json()
  }

  // 重置预设为默认值
  async resetToDefaults(type: PresetType): Promise<PresetOperationResult> {
    const response = await fetch(`${API_BASE}/presets/reset/${type}`, {
      method: 'POST'
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '重置预设失败')
    }
    
    return result
  }

  // 获取预设统计信息
  async getPresetStats(): Promise<{
    total: number
    byType: Record<PresetType, number>
    enabled: number
    disabled: number
  }> {
    const response = await fetch(`${API_BASE}/presets/stats`)
    if (!response.ok) {
      throw new Error('获取预设统计失败')
    }
    return response.json()
  }

  // 验证预设数据
  async validatePreset(data: CreatePresetData | UpdatePresetData): Promise<{
    valid: boolean
    errors: Array<{ field: string; message: string }>
  }> {
    const response = await fetch(`${API_BASE}/presets/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('验证预设数据失败')
    }
    return response.json()
  }

  // 获取可用的宏变量
  async getMacroVariables(): Promise<Array<{
    name: string
    description: string
    category: string
    example?: string
  }>> {
    const response = await fetch(`${API_BASE}/presets/macros`)
    if (!response.ok) {
      throw new Error('获取宏变量失败')
    }
    return response.json()
  }

  // 测试预设
  async testPreset(id: string, testData?: any): Promise<{
    success: boolean
    result: string
    performance: {
      processingTime: number
      tokensUsed: number
    }
  }> {
    const response = await fetch(`${API_BASE}/presets/${id}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData || {})
    })
    
    if (!response.ok) {
      throw new Error('测试预设失败')
    }
    return response.json()
  }
}

export const presetApi = new PresetApiService()
export default presetApi 