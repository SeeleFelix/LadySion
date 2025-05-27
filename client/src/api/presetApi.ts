import axios from 'axios';
import type { PresetType } from '../types/preset';

const API_BASE_URL = '/api';

/**
 * 获取所有预设
 */
export async function getAllPresets(type: PresetType) {
  return axios.get(`${API_BASE_URL}/presets/${type}`);
}

/**
 * 获取特定预设
 */
export async function getPreset(type: PresetType, id: string) {
  return axios.get(`${API_BASE_URL}/presets/${type}/${id}`);
}

/**
 * 保存预设
 */
export async function savePreset(type: PresetType, preset: any) {
  if (preset.id) {
    return axios.put(`${API_BASE_URL}/presets/${type}/${preset.id}`, preset);
  } else {
    return axios.post(`${API_BASE_URL}/presets/${type}`, preset);
  }
}

/**
 * 删除预设
 */
export async function deletePreset(type: PresetType, id: string) {
  return axios.delete(`${API_BASE_URL}/presets/${type}/${id}`);
}

/**
 * 选择指令模式预设
 */
export async function selectInstructPreset(id: string) {
  return axios.post(`${API_BASE_URL}/presets/instruct/select/${id}`);
}

/**
 * 选择上下文模板预设
 */
export async function selectContextPreset(id: string) {
  return axios.post(`${API_BASE_URL}/presets/context/select/${id}`);
}

/**
 * 选择系统提示词预设
 */
export async function selectSystemPromptPreset(id: string) {
  return axios.post(`${API_BASE_URL}/presets/sysprompt/select/${id}`);
}

/**
 * 更新指令模式配置
 */
export async function updateInstructModeConfig(config: any) {
  return axios.post(`${API_BASE_URL}/presets/instruct/config`, config);
}

/**
 * 更新上下文模板配置
 */
export async function updateContextTemplateConfig(config: any) {
  return axios.post(`${API_BASE_URL}/presets/context/config`, config);
}

/**
 * 更新系统提示词配置
 */
export async function updateSystemPromptConfig(config: any) {
  return axios.post(`${API_BASE_URL}/presets/sysprompt/config`, config);
}

/**
 * 获取宏描述
 */
export async function getMacroDescriptions() {
  return axios.get(`${API_BASE_URL}/presets/macros`);
}

/**
 * 主预设相关API
 */
export async function getAllMasterPresets() {
  return axios.get(`${API_BASE_URL}/presets/master`);
}

export async function importMasterPreset(masterPreset: any) {
  return axios.post(`${API_BASE_URL}/presets/master/import`, masterPreset);
}

export async function exportMasterPreset(name: string) {
  return axios.get(`${API_BASE_URL}/presets/master/export/${name}`);
} 