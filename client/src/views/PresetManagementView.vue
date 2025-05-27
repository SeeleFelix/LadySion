<template>
  <div class="preset-management-container">
    <h1>对话补全预设管理</h1>
    
    <div class="preset-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="指令模式预设" name="instruct">
          <InstructPresetManager />
        </el-tab-pane>
        <el-tab-pane label="上下文模板" name="context">
          <ContextPresetManager />
        </el-tab-pane>
        <el-tab-pane label="系统提示词" name="systemPrompt">
          <SystemPromptManager />
        </el-tab-pane>
        <el-tab-pane label="主预设" name="master">
          <MasterPresetManager />
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 导入导出区域 -->
    <div class="preset-import-export">
      <h2>导入/导出预设</h2>
      <div class="import-export-buttons">
        <el-button @click="importPreset" type="primary">
          导入预设
        </el-button>
        <el-button @click="exportPreset" type="success">
          导出预设
        </el-button>
      </div>
      <input 
        ref="fileInput"
        type="file" 
        accept=".json"
        style="display: none"
        @change="handleFileUpload" 
      />
    </div>
    
    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入预设" width="500px">
      <div v-if="importedPreset">
        <p>预设名称: {{ importedPreset.name }}</p>
        <p>包含组件:</p>
        <ul>
          <li v-if="importedPreset.instruct">指令模式预设: {{ importedPreset.instruct.name }}</li>
          <li v-if="importedPreset.context">上下文模板: {{ importedPreset.context.name }}</li>
          <li v-if="importedPreset.systemPrompt">系统提示词: {{ importedPreset.systemPrompt.name }}</li>
        </ul>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmImport">确认导入</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导出对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出预设" width="500px">
      <el-form :model="exportForm">
        <el-form-item label="预设名称" required>
          <el-input v-model="exportForm.name" placeholder="请输入预设名称"></el-input>
        </el-form-item>
        <el-form-item label="包含组件">
          <el-checkbox v-model="exportForm.includeInstruct">当前指令模式预设</el-checkbox>
          <el-checkbox v-model="exportForm.includeContext">当前上下文模板</el-checkbox>
          <el-checkbox v-model="exportForm.includeSystemPrompt">当前系统提示词</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmExport" :disabled="!exportForm.name || !hasSelectedComponents">确认导出</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import InstructPresetManager from '../components/preset/InstructPresetManager.vue';
import ContextPresetManager from '../components/preset/ContextPresetManager.vue';
import SystemPromptManager from '../components/preset/SystemPromptManager.vue';
import MasterPresetManager from '../components/preset/MasterPresetManager.vue';
import * as presetStore from '../store/presetStore';

// 标签页
const activeTab = ref('instruct');

// 导入导出
const fileInput = ref<HTMLInputElement | null>(null);
const importDialogVisible = ref(false);
const exportDialogVisible = ref(false);
const importedPreset = ref(null);

// 导出表单
const exportForm = ref({
  name: '',
  includeInstruct: true,
  includeContext: true,
  includeSystemPrompt: true
});

const hasSelectedComponents = computed(() => 
  exportForm.value.includeInstruct || 
  exportForm.value.includeContext || 
  exportForm.value.includeSystemPrompt
);

// 导入预设
const importPreset = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      importedPreset.value = JSON.parse(content);
      importDialogVisible.value = true;
    } catch (error) {
      ElMessage.error('无效的预设文件');
      console.error('解析预设文件出错:', error);
    } finally {
      // 清空文件输入，以便可以再次选择相同的文件
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    }
  };
  reader.readAsText(file);
};

// 确认导入
const confirmImport = async () => {
  if (!importedPreset.value) return;
  
  try {
    await presetStore.importMasterPreset(importedPreset.value);
    ElMessage.success('预设导入成功');
    importDialogVisible.value = false;
  } catch (error) {
    ElMessage.error('预设导入失败');
    console.error('导入预设出错:', error);
  }
};

// 导出预设
const exportPreset = () => {
  exportForm.value.name = '';
  exportForm.value.includeInstruct = true;
  exportForm.value.includeContext = true;
  exportForm.value.includeSystemPrompt = true;
  exportDialogVisible.value = true;
};

// 确认导出
const confirmExport = async () => {
  if (!exportForm.value.name) {
    ElMessage.warning('请输入预设名称');
    return;
  }
  
  if (!hasSelectedComponents.value) {
    ElMessage.warning('请至少选择一个组件');
    return;
  }
  
  try {
    // 获取当前活跃预设的ID
    const instructId = exportForm.value.includeInstruct && presetStore.state.instructConfig.selectedPresetId;
    const contextId = exportForm.value.includeContext && presetStore.state.contextConfig.selectedPresetId;
    const systemPromptId = exportForm.value.includeSystemPrompt && presetStore.state.systemPromptConfig.selectedPresetId;
    
    // 从服务器获取主预设
    const masterPreset = await presetStore.presetApi.exportMasterPreset(exportForm.value.name);
    
    // 下载预设文件
    const data = JSON.stringify(masterPreset, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportForm.value.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    exportDialogVisible.value = false;
    ElMessage.success('预设导出成功');
  } catch (error) {
    ElMessage.error('预设导出失败');
    console.error('导出预设出错:', error);
  }
};

// 加载预设
presetStore.loadAllPresets();
</script>

<style scoped>
.preset-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
}

.preset-tabs {
  margin-bottom: 30px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.preset-import-export {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.preset-import-export h2 {
  font-size: 18px;
  margin-bottom: 15px;
}

.import-export-buttons {
  display: flex;
  gap: 10px;
}
</style> 