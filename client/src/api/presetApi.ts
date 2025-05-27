import axios from 'axios';
import { PresetType, MasterPreset } from '../types/preset';

const API_BASE_URL = '/api';

/**
 * 获取所有预设
 * @param type 预设类型
 * @returns 预设列表
 */
export async function getAllPresets(type: PresetType) {
  return axios.get(`${API_BASE_URL}/presets/${type}`);
}

/**
 * 获取特定预设
 * @param type 预设类型
 * @param id 预设ID
 * @returns 预设
 */
export async function getPreset(type: PresetType, id: string) {
  return axios.get(`${API_BASE_URL}/presets/${type}/${id}`);
}

/**
 * 保存预设
 * @param type 预设类型
 * @param preset 预设对象
 * @returns 保存后的预设
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
 * @param type 预设类型
 * @param id 预设ID
 */
export async function deletePreset(type: PresetType, id: string) {
  return axios.delete(`${API_BASE_URL}/presets/${type}/${id}`);
}

/**
 * 获取所有主预设
 * @returns 主预设列表
 */
export async function getAllMasterPresets() {
  return axios.get(`${API_BASE_URL}/presets/master`);
}

/**
 * 获取主预设
 * @param id 主预设ID
 * @returns 主预设
 */
export async function getMasterPreset(id: string) {
  return axios.get(`${API_BASE_URL}/presets/master/${id}`);
}

/**
 * 保存主预设
 * @param masterPreset 主预设
 * @returns 保存后的主预设
 */
export async function saveMasterPreset(masterPreset: MasterPreset) {
  if (masterPreset.id) {
    return axios.put(`${API_BASE_URL}/presets/master/${masterPreset.id}`, masterPreset);
  } else {
    return axios.post(`${API_BASE_URL}/presets/master`, masterPreset);
  }
}

/**
 * 删除主预设
 * @param id 主预设ID
 */
export async function deleteMasterPreset(id: string) {
  return axios.delete(`${API_BASE_URL}/presets/master/${id}`);
}

/**
 * 导入主预设
 * @param masterPreset 主预设
 * @returns 导入结果
 */
export async function importMasterPreset(masterPreset: MasterPreset) {
  return axios.post(`${API_BASE_URL}/presets/master/import`, masterPreset);
}

/**
 * 导出主预设
 * @param masterPreset 要导出的主预设
 * @returns 导出的主预设数据
 */
export async function exportMasterPreset(masterPreset: MasterPreset) {
  return axios.post(`${API_BASE_URL}/presets/master/export`, masterPreset);
}

/**
 * 选择指令模式预设
 * @param id 预设ID
 */
export async function selectInstructPreset(id: string) {
  return axios.post(`${API_BASE_URL}/presets/instruct/select/${id}`);
}

/**
 * 选择上下文模板预设
 * @param id 预设ID
 */
export async function selectContextPreset(id: string) {
  return axios.post(`${API_BASE_URL}/presets/context/select/${id}`);
}

/**
 * 选择系统提示词预设
 * @param id 预设ID
 */
export async function selectSystemPromptPreset(id: string) {
  return axios.post(`${API_BASE_URL}/presets/system-prompt/select/${id}`);
}

/**
 * 更新指令模式配置
 * @param config 配置对象
 */
export async function updateInstructModeConfig(config: any) {
  return axios.post(`${API_BASE_URL}/presets/instruct/config`, config);
}

/**
 * 更新上下文模板配置
 * @param config 配置对象
 */
export async function updateContextTemplateConfig(config: any) {
  return axios.post(`${API_BASE_URL}/presets/context/config`, config);
}

/**
 * 更新系统提示词配置
 * @param config 配置对象
 */
export async function updateSystemPromptConfig(config: any) {
  return axios.post(`${API_BASE_URL}/presets/system-prompt/config`, config);
}

/**
 * 获取宏描述
 * @returns 宏描述列表
 */
export async function getMacroDescriptions() {
  return axios.get(`${API_BASE_URL}/presets/macros`);
} 