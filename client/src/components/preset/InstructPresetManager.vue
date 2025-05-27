<template>
  <div class="instruct-preset-manager">
    <div class="preset-header">
      <h2>指令模式预设</h2>
      <el-switch
        v-model="instructEnabled"
        active-text="启用指令模式"
        inactive-text="禁用"
        @change="toggleInstructMode"
      />
    </div>
    
    <div class="preset-options">
      <el-checkbox 
        v-model="bindToContext" 
        :disabled="!instructEnabled"
        @change="toggleBindToContext"
      >
        绑定到匹配的上下文模板
      </el-checkbox>
      
      <el-button 
        type="primary" 
        size="small" 
        @click="createNewPreset"
        :disabled="!instructEnabled"
      >
        新建预设
      </el-button>
    </div>
    
    <el-table
      v-loading="loading"
      :data="presets"
      style="width: 100%"
      :row-class-name="getRowClassName"
    >
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="description" label="描述" min-width="180" />
      <el-table-column label="激活条件" min-width="150">
        <template #default="scope">
          <span>{{ scope.row.activationRegex || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支持宏" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.macro" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
            :disabled="!instructEnabled"
            @click="selectPreset(scope.row)"
          >
            使用
          </el-button>
          <el-button 
            type="warning" 
            size="small" 
            @click="editPreset(scope.row)"
          >
            编辑
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="confirmDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 编辑预设对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isNewPreset ? '新建指令模式预设' : '编辑指令模式预设'"
      width="800px"
    >
      <el-form :model="editingPreset" label-width="120px">
        <el-form-item label="预设名称" required>
          <el-input v-model="editingPreset.name" placeholder="请输入预设名称" />
        </el-form-item>
        
        <el-form-item label="预设描述">
          <el-input v-model="editingPreset.description" placeholder="请输入预设描述" />
        </el-form-item>
        
        <el-form-item label="激活正则表达式">
          <el-input v-model="editingPreset.activationRegex" placeholder="匹配模型名称的正则表达式" />
          <div class="form-item-help">
            用于自动选择预设的正则表达式，匹配模型名称时会自动应用
          </div>
        </el-form-item>
        
        <el-divider content-position="center">格式设置</el-divider>
        
        <el-form-item label="换行包装">
          <el-switch v-model="editingPreset.wrap" />
          <div class="form-item-help">
            开启后会在序列和内容之间添加换行符
          </div>
        </el-form-item>
        
        <el-form-item label="启用宏处理">
          <el-switch v-model="editingPreset.macro" />
          <div class="form-item-help">
            开启后会处理文本中的宏，如 {{user}}, {{char}} 等
          </div>
        </el-form-item>
        
        <el-divider content-position="center">序列设置</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="输入序列">
              <el-input v-model="editingPreset.inputSequence" placeholder="用户输入前的序列" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="输入后缀">
              <el-input v-model="editingPreset.inputSuffix" placeholder="用户输入后的序列" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="输出序列">
              <el-input v-model="editingPreset.outputSequence" placeholder="AI输出前的序列" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="输出后缀">
              <el-input v-model="editingPreset.outputSuffix" placeholder="AI输出后的序列" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="系统序列">
              <el-input v-model="editingPreset.systemSequence" placeholder="系统提示前的序列" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="系统后缀">
              <el-input v-model="editingPreset.systemSuffix" placeholder="系统提示后的序列" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="center">首次对话特殊设置</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="首次输入序列">
              <el-input v-model="editingPreset.firstInputSequence" placeholder="留空则使用普通输入序列" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="首次输出序列">
              <el-input v-model="editingPreset.firstOutputSequence" placeholder="留空则使用普通输出序列" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="停止序列">
          <el-input v-model="editingPreset.stopSequence" placeholder="生成停止的序列" />
          <div class="form-item-help">
            当生成的文本包含此序列时停止生成
          </div>
        </el-form-item>
        
        <el-divider content-position="center">格式示例</el-divider>
        
        <div class="format-preview">
          <div v-if="editingPreset.systemSequence" class="preview-system">
            <pre>{{ getFormattedSystem() }}</pre>
          </div>
          <div class="preview-conversation">
            <div class="preview-input">
              <pre>{{ getFormattedInput() }}</pre>
            </div>
            <div class="preview-output">
              <pre>{{ getFormattedOutput() }}</pre>
            </div>
          </div>
        </div>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="savePreset" :disabled="!editingPreset.name">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除预设 "{{ presetToDelete?.name }}" 吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deletePreset">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { InstructPreset } from '../../types/preset';
import * as presetStore from '../../store/presetStore';

// 预设列表
const presets = computed(() => presetStore.state.instructPresets.value);
const selectedPreset = computed(() => presetStore.state.selectedInstructPreset.value);
const loading = computed(() => presetStore.state.loading.value.instruct);
const instructEnabled = computed({
  get: () => presetStore.state.instructConfig.enabled,
  set: (val) => presetStore.state.instructConfig.enabled = val
});
const bindToContext = computed({
  get: () => presetStore.state.instructConfig.bindToContext,
  set: (val) => presetStore.state.instructConfig.bindToContext = val
});

// 预设编辑
const editDialogVisible = ref(false);
const isNewPreset = ref(false);
const editingPreset = ref<Partial<InstructPreset>>({
  inputSequence: '',
  inputSuffix: '',
  outputSequence: '',
  outputSuffix: '',
  systemSequence: '',
  systemSuffix: '',
  firstInputSequence: '',
  firstOutputSequence: '',
  stopSequence: '',
  wrap: true,
  macro: true,
  activationRegex: ''
});

// 删除确认
const deleteDialogVisible = ref(false);
const presetToDelete = ref<InstructPreset | null>(null);

// 获取行样式
const getRowClassName = ({ row }: { row: InstructPreset }) => {
  return selectedPreset.value && row.id === selectedPreset.value.id ? 'selected-row' : '';
};

// 切换指令模式
const toggleInstructMode = async () => {
  try {
    await presetStore.updateInstructConfig({ enabled: instructEnabled.value });
    ElMessage.success(`指令模式已${instructEnabled.value ? '启用' : '禁用'}`);
  } catch (error) {
    ElMessage.error('更新配置失败');
  }
};

// 切换绑定到上下文模板
const toggleBindToContext = async () => {
  try {
    await presetStore.updateInstructConfig({ bindToContext: bindToContext.value });
    ElMessage.success(`绑定到上下文模板已${bindToContext.value ? '启用' : '禁用'}`);
  } catch (error) {
    ElMessage.error('更新配置失败');
  }
};

// 选择预设
const selectPreset = async (preset: InstructPreset) => {
  try {
    await presetStore.selectInstructPreset(preset.id);
    ElMessage.success(`已选择预设: ${preset.name}`);
  } catch (error) {
    ElMessage.error('选择预设失败');
  }
};

// 创建新预设
const createNewPreset = () => {
  isNewPreset.value = true;
  editingPreset.value = {
    name: '',
    description: '',
    inputSequence: '',
    inputSuffix: '',
    outputSequence: '',
    outputSuffix: '',
    systemSequence: '',
    systemSuffix: '',
    firstInputSequence: '',
    firstOutputSequence: '',
    stopSequence: '',
    wrap: true,
    macro: true,
    activationRegex: ''
  };
  editDialogVisible.value = true;
};

// 编辑预设
const editPreset = (preset: InstructPreset) => {
  isNewPreset.value = false;
  editingPreset.value = { ...preset };
  editDialogVisible.value = true;
};

// 取消编辑
const cancelEdit = () => {
  editDialogVisible.value = false;
};

// 保存预设
const savePreset = async () => {
  if (!editingPreset.value.name) {
    ElMessage.warning('预设名称不能为空');
    return;
  }
  
  try {
    await presetStore.saveInstructPreset(editingPreset.value);
    editDialogVisible.value = false;
    ElMessage.success('预设保存成功');
  } catch (error) {
    ElMessage.error('保存预设失败');
  }
};

// 确认删除
const confirmDelete = (preset: InstructPreset) => {
  presetToDelete.value = preset;
  deleteDialogVisible.value = true;
};

// 删除预设
const deletePreset = async () => {
  if (!presetToDelete.value) return;
  
  try {
    await presetStore.deleteInstructPreset(presetToDelete.value.id);
    deleteDialogVisible.value = false;
    ElMessage.success('预设删除成功');
  } catch (error) {
    ElMessage.error('删除预设失败');
  }
};

// 格式化示例
const getFormattedSystem = () => {
  const preset = editingPreset.value;
  const systemContent = '这是一个系统提示示例';
  
  let result = preset.systemSequence || '';
  if (preset.wrap && result) result += '\n';
  result += systemContent;
  if (preset.wrap && preset.systemSuffix) result += '\n';
  if (preset.systemSuffix) result += preset.systemSuffix;
  
  return result;
};

const getFormattedInput = () => {
  const preset = editingPreset.value;
  const userContent = '这是用户输入示例';
  
  let result = preset.inputSequence || '';
  if (preset.wrap && result) result += '\n';
  result += userContent;
  if (preset.wrap && preset.inputSuffix) result += '\n';
  if (preset.inputSuffix) result += preset.inputSuffix;
  
  return result;
};

const getFormattedOutput = () => {
  const preset = editingPreset.value;
  const aiContent = '这是AI输出示例';
  
  let result = preset.outputSequence || '';
  if (preset.wrap && result) result += '\n';
  result += aiContent;
  if (preset.wrap && preset.outputSuffix) result += '\n';
  if (preset.outputSuffix) result += preset.outputSuffix;
  
  return result;
};

// 加载预设
onMounted(async () => {
  await presetStore.loadInstructPresets();
});
</script>

<style scoped>
.instruct-preset-manager {
  margin-bottom: 20px;
}

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preset-header h2 {
  margin: 0;
}

.preset-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-item-help {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.format-preview {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
  margin-top: 16px;
}

.preview-system {
  background: #e6f7ff;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.preview-conversation {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-input {
  background: #f0f9eb;
  border-radius: 4px;
  padding: 10px;
}

.preview-output {
  background: #fef0f0;
  border-radius: 4px;
  padding: 10px;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.selected-row) {
  background-color: #f0f9eb;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style> 