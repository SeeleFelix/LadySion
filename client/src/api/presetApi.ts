import axios, { AxiosResponse } from 'axios';
import type { PresetType } from '../types/preset';

const API_BASE_URL = '/api';

// 配置axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API请求失败:', error);
    return Promise.reject(error);
  }
);

/**
 * 获取所有预设
 */
export async function getAllPresets(type: PresetType): Promise<AxiosResponse<any[]>> {
  return apiClient.get(`/presets/${type}`);
}

/**
 * 获取特定预设
 */
export async function getPreset(type: PresetType, id: string): Promise<AxiosResponse<any>> {
  return apiClient.get(`/presets/${type}/${id}`);
}

/**
 * 保存预设
 */
export async function savePreset(type: PresetType, preset: any): Promise<AxiosResponse<any>> {
  if (preset.id) {
    return apiClient.put(`/presets/${type}/${preset.id}`, preset);
  } else {
    return apiClient.post(`/presets/${type}`, preset);
  }
}

/**
 * 删除预设
 */
export async function deletePreset(type: PresetType, id: string): Promise<AxiosResponse<any>> {
  return apiClient.delete(`/presets/${type}/${id}`);
}

/**
 * 选择指令模式预设
 */
export async function selectInstructPreset(id: string): Promise<AxiosResponse<any>> {
  return apiClient.post(`/presets/instruct/select/${id}`);
}

/**
 * 选择上下文模板预设
 */
export async function selectContextPreset(id: string): Promise<AxiosResponse<any>> {
  return apiClient.post(`/presets/context/select/${id}`);
}

/**
 * 选择系统提示词预设
 */
export async function selectSystemPromptPreset(id: string): Promise<AxiosResponse<any>> {
  return apiClient.post(`/presets/sysprompt/select/${id}`);
}

/**
 * 更新指令模式配置
 */
export async function updateInstructModeConfig(config: any): Promise<AxiosResponse<any>> {
  return apiClient.post('/presets/instruct/config', config);
}

/**
 * 更新上下文模板配置
 */
export async function updateContextTemplateConfig(config: any): Promise<AxiosResponse<any>> {
  return apiClient.post('/presets/context/config', config);
}

/**
 * 更新系统提示词配置
 */
export async function updateSystemPromptConfig(config: any): Promise<AxiosResponse<any>> {
  return apiClient.post('/presets/sysprompt/config', config);
}

/**
 * 获取宏描述
 */
export async function getMacroDescriptions(): Promise<AxiosResponse<any[]>> {
  return apiClient.get('/presets/macros');
}

/**
 * 主预设相关API
 */
export async function getAllMasterPresets(): Promise<AxiosResponse<any[]>> {
  return apiClient.get('/presets/master');
}

export async function importMasterPreset(masterPreset: any): Promise<AxiosResponse<any>> {
  return apiClient.post('/presets/master/import', masterPreset);
}

export async function exportMasterPreset(name: string): Promise<AxiosResponse<any>> {
  return apiClient.get(`/presets/master/export/${name}`);
} 