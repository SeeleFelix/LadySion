<template>
  <div class="master-preset-manager">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>主预设管理</span>
              <div>
                <el-button type="primary" @click="handleCreateMasterPreset" size="small">创建主预设</el-button>
                <el-button type="success" @click="handleImportMasterPreset" size="small">导入预设</el-button>
              </div>
            </div>
          </template>
          
          <el-tabs v-model="activeTab">
            <el-tab-pane label="当前预设" name="current">
              <div class="current-presets">
                <el-card class="preset-section">
                  <template #header>
                    <div class="preset-section-header">
                      <span>指令模式预设</span>
                      <el-button type="primary" @click="navigateToPresetManager('instruct')" size="small">管理</el-button>
                    </div>
                  </template>
                  <div v-if="currentInstructPreset" class="preset-info">
                    <h3>{{ currentInstructPreset.name }}</h3>
                    <p>{{ currentInstructPreset.description || '无描述' }}</p>
                  </div>
                  <el-empty v-else description="未选择指令模式预设" />
                </el-card>
                
                <el-card class="preset-section">
                  <template #header>
                    <div class="preset-section-header">
                      <span>上下文模板预设</span>
                      <el-button type="primary" @click="navigateToPresetManager('context')" size="small">管理</el-button>
                    </div>
                  </template>
                  <div v-if="currentContextPreset" class="preset-info">
                    <h3>{{ currentContextPreset.name }}</h3>
                    <p>{{ currentContextPreset.description || '无描述' }}</p>
                  </div>
                  <el-empty v-else description="未选择上下文模板预设" />
                </el-card>
                
                <el-card class="preset-section">
                  <template #header>
                    <div class="preset-section-header">
                      <span>系统提示词预设</span>
                      <el-button type="primary" @click="navigateToPresetManager('system-prompt')" size="small">管理</el-button>
                    </div>
                  </template>
                  <div v-if="currentSystemPromptPreset" class="preset-info">
                    <h3>{{ currentSystemPromptPreset.name }}</h3>
                    <p>{{ currentSystemPromptPreset.description || '无描述' }}</p>
                  </div>
                  <el-empty v-else description="未选择系统提示词预设" />
                </el-card>
                
                <div class="actions-row">
                  <el-input 
                    v-model="masterPresetName" 
                    placeholder="输入主预设名称"
                    style="width: 300px"
                  ></el-input>
                  <el-button 
                    type="success" 
                    @click="handleExportMasterPreset" 
                    :disabled="!masterPresetName || !hasAllRequiredPresets"
                  >
                    导出当前预设组合
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="所有主预设" name="all">
              <div class="master-presets-list">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索主预设..."
                  clearable
                  class="search-input"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                
                <el-empty v-if="filteredMasterPresets.length === 0" description="没有找到主预设" />
                
                <el-table v-else :data="filteredMasterPresets" style="width: 100%" row-key="id">
                  <el-table-column prop="name" label="名称" />
                  <el-table-column prop="description" label="描述" />
                  <el-table-column label="预设组合">
                    <template #default="{ row }">
                      <div class="preset-combination">
                        <el-tag type="success">{{ row.instructPreset.name }}</el-tag>
                        <el-tag type="warning">{{ row.contextPreset.name }}</el-tag>
                        <el-tag type="info">{{ row.systemPromptPreset.name }}</el-tag>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="200">
                    <template #default="{ row }">
                      <el-button-group>
                        <el-button type="primary" size="small" @click="handleApplyMasterPreset(row)">
                          应用
                        </el-button>
                        <el-button type="danger" size="small" @click="handleDeleteMasterPreset(row.id)">
                          删除
                        </el-button>
                      </el-button-group>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 创建主预设对话框 -->
    <el-dialog
      v-model="createMasterPresetDialogVisible"
      title="创建主预设"
      width="500px"
    >
      <el-form :model="newMasterPreset" label-position="top">
        <el-form-item label="名称" required>
          <el-input v-model="newMasterPreset.name" placeholder="输入名称"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newMasterPreset.description" placeholder="输入描述"></el-input>
        </el-form-item>
        <el-form-item label="指令模式预设" required>
          <el-select v-model="newMasterPreset.instructPresetId" placeholder="选择指令模式预设" filterable>
            <el-option
              v-for="preset in instructPresets"
              :key="preset.id"
              :label="preset.name"
              :value="preset.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="上下文模板预设" required>
          <el-select v-model="newMasterPreset.contextPresetId" placeholder="选择上下文模板预设" filterable>
            <el-option
              v-for="preset in contextPresets"
              :key="preset.id"
              :label="preset.name"
              :value="preset.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="系统提示词预设" required>
          <el-select v-model="newMasterPreset.systemPromptPresetId" placeholder="选择系统提示词预设" filterable>
            <el-option
              v-for="preset in systemPromptPresets"
              :key="preset.id"
              :label="preset.name"
              :value="preset.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createMasterPresetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMasterPreset" :disabled="!isValidMasterPreset">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导入主预设对话框 -->
    <el-dialog
      v-model="importMasterPresetDialogVisible"
      title="导入主预设"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 .json 文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importMasterPresetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="importMasterPreset" :disabled="!selectedFile">
            导入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, UploadFilled } from '@element-plus/icons-vue';
import * as presetApi from '../../api/presetApi';
import { PresetType, InstructPreset, ContextPreset, SystemPromptPreset, MasterPreset } from '../../types/preset';

const router = useRouter();
const activeTab = ref('current');
const searchQuery = ref('');

// 当前预设
const currentInstructPreset = ref<InstructPreset | null>(null);
const currentContextPreset = ref<ContextPreset | null>(null);
const currentSystemPromptPreset = ref<SystemPromptPreset | null>(null);

// 所有预设
const instructPresets = ref<InstructPreset[]>([]);
const contextPresets = ref<ContextPreset[]>([]);
const systemPromptPresets = ref<SystemPromptPreset[]>([]);
const masterPresets = ref<MasterPreset[]>([]);

// 导出相关
const masterPresetName = ref('');

// 创建主预设相关
const createMasterPresetDialogVisible = ref(false);
const newMasterPreset = ref({
  name: '',
  description: '',
  instructPresetId: '',
  contextPresetId: '',
  systemPromptPresetId: ''
});

// 导入相关
const importMasterPresetDialogVisible = ref(false);
const selectedFile = ref<File | null>(null);

// 计算属性
const hasAllRequiredPresets = computed(() => {
  return currentInstructPreset.value && currentContextPreset.value && currentSystemPromptPreset.value;
});

const filteredMasterPresets = computed(() => {
  if (!searchQuery.value) return masterPresets.value;
  const query = searchQuery.value.toLowerCase();
  return masterPresets.value.filter(preset => 
    preset.name.toLowerCase().includes(query) || 
    (preset.description && preset.description.toLowerCase().includes(query)) ||
    preset.instructPreset.name.toLowerCase().includes(query) ||
    preset.contextPreset.name.toLowerCase().includes(query) ||
    preset.systemPromptPreset.name.toLowerCase().includes(query)
  );
});

const isValidMasterPreset = computed(() => {
  return (
    newMasterPreset.value.name &&
    newMasterPreset.value.instructPresetId &&
    newMasterPreset.value.contextPresetId &&
    newMasterPreset.value.systemPromptPresetId
  );
});

// 生命周期钩子
onMounted(async () => {
  await Promise.all([
    loadCurrentPresets(),
    loadAllPresets()
  ]);
});

// 方法
async function loadCurrentPresets() {
  try {
    // 获取当前选中的预设
    const instructResponse = await presetApi.getPreset(PresetType.INSTRUCT, 'current');
    currentInstructPreset.value = instructResponse.data;
    
    const contextResponse = await presetApi.getPreset(PresetType.CONTEXT, 'current');
    currentContextPreset.value = contextResponse.data;
    
    const systemPromptResponse = await presetApi.getPreset(PresetType.SYSTEM_PROMPT, 'current');
    currentSystemPromptPreset.value = systemPromptResponse.data;
  } catch (error) {
    console.error('加载当前预设失败:', error);
    ElMessage.error('加载当前预设失败');
  }
}

async function loadAllPresets() {
  try {
    // 获取所有预设
    const instructResponse = await presetApi.getAllPresets(PresetType.INSTRUCT);
    instructPresets.value = instructResponse.data;
    
    const contextResponse = await presetApi.getAllPresets(PresetType.CONTEXT);
    contextPresets.value = contextResponse.data;
    
    const systemPromptResponse = await presetApi.getAllPresets(PresetType.SYSTEM_PROMPT);
    systemPromptPresets.value = systemPromptResponse.data;
    
    // 获取所有主预设
    const masterPresetsResponse = await presetApi.getAllMasterPresets();
    masterPresets.value = masterPresetsResponse.data;
  } catch (error) {
    console.error('加载预设失败:', error);
    ElMessage.error('加载预设失败');
  }
}

function navigateToPresetManager(type: string) {
  if (type === 'instruct') {
    router.push('/presets/instruct');
  } else if (type === 'context') {
    router.push('/presets/context');
  } else if (type === 'system-prompt') {
    router.push('/presets/system-prompt');
  }
}

function handleCreateMasterPreset() {
  // 重置表单
  newMasterPreset.value = {
    name: '',
    description: '',
    instructPresetId: currentInstructPreset.value?.id || '',
    contextPresetId: currentContextPreset.value?.id || '',
    systemPromptPresetId: currentSystemPromptPreset.value?.id || ''
  };
  
  createMasterPresetDialogVisible.value = true;
}

async function saveMasterPreset() {
  try {
    const masterPreset: Partial<MasterPreset> = {
      name: newMasterPreset.value.name,
      description: newMasterPreset.value.description,
      instructPreset: instructPresets.value.find(p => p.id === newMasterPreset.value.instructPresetId),
      contextPreset: contextPresets.value.find(p => p.id === newMasterPreset.value.contextPresetId),
      systemPromptPreset: systemPromptPresets.value.find(p => p.id === newMasterPreset.value.systemPromptPresetId)
    };
    
    await presetApi.saveMasterPreset(masterPreset as MasterPreset);
    ElMessage.success('创建主预设成功');
    createMasterPresetDialogVisible.value = false;
    await loadAllPresets();
  } catch (error) {
    console.error('创建主预设失败:', error);
    ElMessage.error('创建主预设失败');
  }
}

function handleImportMasterPreset() {
  selectedFile.value = null;
  importMasterPresetDialogVisible.value = true;
}

function handleFileChange(file: any) {
  selectedFile.value = file.raw as File;
}

async function importMasterPreset() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件');
    return;
  }
  
  if (!selectedFile.value.name.endsWith('.json')) {
    ElMessage.error('仅支持导入 JSON 文件');
    return;
  }
  
  try {
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const masterPreset = JSON.parse(content);
        
        await presetApi.importMasterPreset(masterPreset);
        ElMessage.success('导入主预设成功');
        importMasterPresetDialogVisible.value = false;
        await Promise.all([
          loadCurrentPresets(),
          loadAllPresets()
        ]);
      } catch (error) {
        console.error('解析文件失败:', error);
        ElMessage.error('无效的主预设文件');
      }
    };
    
    fileReader.readAsText(selectedFile.value);
  } catch (error) {
    console.error('导入主预设失败:', error);
    ElMessage.error('导入主预设失败');
  }
}

async function handleExportMasterPreset() {
  if (!hasAllRequiredPresets.value || !masterPresetName.value) {
    ElMessage.warning('请确保所有预设都已选择并输入主预设名称');
    return;
  }
  
  try {
    const masterPreset: MasterPreset = {
      id: '',
      name: masterPresetName.value,
      description: '从当前选择的预设导出',
      instructPreset: currentInstructPreset.value!,
      contextPreset: currentContextPreset.value!,
      systemPromptPreset: currentSystemPromptPreset.value!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const response = await presetApi.exportMasterPreset(masterPreset);
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${masterPresetName.value}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ElMessage.success('导出主预设成功');
  } catch (error) {
    console.error('导出主预设失败:', error);
    ElMessage.error('导出主预设失败');
  }
}

async function handleApplyMasterPreset(masterPreset: MasterPreset) {
  try {
    await Promise.all([
      presetApi.selectInstructPreset(masterPreset.instructPreset.id),
      presetApi.selectContextPreset(masterPreset.contextPreset.id),
      presetApi.selectSystemPromptPreset(masterPreset.systemPromptPreset.id)
    ]);
    
    ElMessage.success('应用主预设成功');
    await loadCurrentPresets();
  } catch (error) {
    console.error('应用主预设失败:', error);
    ElMessage.error('应用主预设失败');
  }
}

async function handleDeleteMasterPreset(id: string) {
  ElMessageBox.confirm(
    '确定要删除这个主预设吗？此操作无法撤销。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await presetApi.deleteMasterPreset(id);
      ElMessage.success('删除主预设成功');
      await loadAllPresets();
    } catch (error) {
      console.error('删除主预设失败:', error);
      ElMessage.error('删除主预设失败');
    }
  }).catch(() => {
    // 用户取消删除
  });
}
</script>

<style scoped>
.master-preset-manager {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preset-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-presets {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preset-section {
  margin-bottom: 20px;
}

.preset-info {
  padding: 10px;
}

.preset-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.actions-row {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
}

.search-input {
  margin-bottom: 20px;
}

.preset-combination {
  display: flex;
  gap: 8px;
}

.upload-demo {
  width: 100%;
}
</style> 