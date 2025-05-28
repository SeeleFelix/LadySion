<template>
  <div class="system-prompt-manager">
    <div class="preset-header">
      <h2>系统提示词预设</h2>
      <el-switch
        v-model="systemPromptEnabled"
        active-text="启用系统提示词"
        inactive-text="禁用"
        @change="toggleSystemPrompt"
      />
    </div>
    
    <div class="preset-options">
      <el-select 
        v-model="filterCategory" 
        placeholder="按分类筛选" 
        clearable
        @change="handleFilterChange"
        :disabled="!systemPromptEnabled"
      >
        <el-option
          v-for="item in categories"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
      
      <el-button 
        type="primary" 
        size="small" 
        @click="createNewPreset"
        :disabled="!systemPromptEnabled"
      >
        新建提示词
      </el-button>
    </div>
    
    <el-table
      v-loading="loading"
      :data="filteredPresets"
      style="width: 100%"
      :row-class-name="getRowClassName"
    >
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="category" label="分类" min-width="100" />
      <el-table-column prop="description" label="描述" min-width="180" />
      <el-table-column label="标签" min-width="150">
        <template #default="scope">
          <el-tag
            v-for="tag in scope.row.tags"
            :key="tag"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <span v-if="!scope.row.tags || scope.row.tags.length === 0">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
            :disabled="!systemPromptEnabled"
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
      :title="isNewPreset ? '新建系统提示词' : '编辑系统提示词'"
      width="800px"
    >
      <el-form :model="editingPreset" label-width="120px">
        <el-form-item label="提示词名称" required>
          <el-input v-model="editingPreset.name" placeholder="请输入提示词名称" />
        </el-form-item>
        
        <el-form-item label="提示词描述">
          <el-input v-model="editingPreset.description" placeholder="请输入提示词描述" />
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select 
            v-model="editingPreset.category" 
            placeholder="选择分类"
            filterable
            allow-create
          >
            <el-option
              v-for="item in categories"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <div class="form-item-help">
            可以选择现有分类或输入新的分类
          </div>
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select
            v-model="editingPreset.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入标签"
          >
            <el-option
              v-for="item in allTags"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <div class="form-item-help">
            可以添加多个标签，按回车确认
          </div>
        </el-form-item>
        
        <el-divider content-position="center">提示词内容</el-divider>
        
        <el-form-item label="提示词内容" required>
          <el-input 
            v-model="editingPreset.content" 
            type="textarea" 
            :rows="10" 
            placeholder="请输入系统提示词内容..." 
          />
          <div class="form-item-help">
            支持使用宏，如 {{user}}, {{char}} 等
          </div>
        </el-form-item>
        
        <el-divider content-position="center">可用宏</el-divider>
        
        <div class="macro-list">
          <el-tag
            v-for="macro in macros"
            :key="macro.name"
            class="macro-tag"
            @click="insertMacro(macro.name)"
          >
            {{ macro.name }}
          </el-tag>
        </div>
        <div class="form-item-help" v-if="macros.length > 0">
          点击宏标签将其插入到提示词内容中
        </div>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="savePreset" :disabled="!editingPreset.name || !editingPreset.content">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除系统提示词 "{{ presetToDelete?.name }}" 吗？此操作不可恢复。</p>
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
import { SystemPromptPreset } from '../../types/preset';
import * as presetStore from '../../store/presetStore';

// 预设列表
const presets = computed(() => presetStore.state.systemPromptPresets.value);
const selectedPreset = computed(() => presetStore.state.selectedSystemPromptPreset.value);
const loading = computed(() => presetStore.state.loading.value.systemPrompt);
const macros = computed(() => presetStore.state.macroDescriptions.value);
const systemPromptEnabled = computed({
  get: () => presetStore.state.systemPromptConfig.enabled,
  set: (val) => presetStore.state.systemPromptConfig.enabled = val
});

// 筛选
const filterCategory = ref('');
const filteredPresets = computed(() => {
  if (!filterCategory.value) return presets.value;
  return presets.value.filter(preset => preset.category === filterCategory.value);
});

// 分类和标签
const categories = computed(() => {
  const categorySet = new Set<string>();
  presets.value.forEach(preset => {
    if (preset.category) categorySet.add(preset.category);
  });
  return Array.from(categorySet);
});

const allTags = computed(() => {
  const tagSet = new Set<string>();
  presets.value.forEach(preset => {
    if (preset.tags) preset.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet);
});

// 预设编辑
const editDialogVisible = ref(false);
const isNewPreset = ref(false);
const editingPreset = ref<Partial<SystemPromptPreset>>({
  name: '',
  description: '',
  content: '',
  category: '',
  tags: []
});

// 删除确认
const deleteDialogVisible = ref(false);
const presetToDelete = ref<SystemPromptPreset | null>(null);

// 获取行样式
const getRowClassName = ({ row }: { row: SystemPromptPreset }) => {
  return selectedPreset.value && row.id === selectedPreset.value.id ? 'selected-row' : '';
};

// 切换系统提示词
const toggleSystemPrompt = async () => {
  try {
    await presetStore.updateSystemPromptConfig({ enabled: systemPromptEnabled.value });
    ElMessage.success(`系统提示词已${systemPromptEnabled.value ? '启用' : '禁用'}`);
  } catch (error) {
    ElMessage.error('更新配置失败');
  }
};

// 处理筛选变更
const handleFilterChange = () => {
  // 无需额外处理，filteredPresets计算属性会自动更新
};

// 选择预设
const selectPreset = async (preset: SystemPromptPreset) => {
  try {
    await presetStore.selectSystemPromptPreset(preset.id);
    ElMessage.success(`已选择系统提示词: ${preset.name}`);
  } catch (error) {
    ElMessage.error('选择系统提示词失败');
  }
};

// 创建新预设
const createNewPreset = () => {
  isNewPreset.value = true;
  editingPreset.value = {
    name: '',
    description: '',
    content: '用自然、真实的方式回复{{user}}。你是{{char}}，创造性地回答所有问题。',
    category: '通用',
    tags: []
  };
  editDialogVisible.value = true;
};

// 编辑预设
const editPreset = (preset: SystemPromptPreset) => {
  isNewPreset.value = false;
  editingPreset.value = { ...preset };
  editDialogVisible.value = true;
};

// 取消编辑
const cancelEdit = () => {
  editDialogVisible.value = false;
};

// 插入宏
const insertMacro = (macroName: string) => {
  if (!editingPreset.value.content) {
    editingPreset.value.content = '';
  }
  const content = editingPreset.value.content;
  const textArea = document.querySelector('.el-textarea__inner') as HTMLTextAreaElement;
  
  if (textArea && textArea === document.activeElement) {
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const macroText = `{{${macroName}}}`;
    
    editingPreset.value.content = content.substring(0, start) + macroText + content.substring(end);
    
    // 设置光标位置
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(start + macroText.length, start + macroText.length);
    }, 0);
  } else {
    // 如果文本区域没有焦点，则追加到末尾
    editingPreset.value.content += `{{${macroName}}}`;
  }
};

// 保存预设
const savePreset = async () => {
  if (!editingPreset.value.name) {
    ElMessage.warning('提示词名称不能为空');
    return;
  }
  
  if (!editingPreset.value.content) {
    ElMessage.warning('提示词内容不能为空');
    return;
  }
  
  try {
    await presetStore.saveSystemPromptPreset(editingPreset.value);
    editDialogVisible.value = false;
    ElMessage.success('系统提示词保存成功');
  } catch (error) {
    ElMessage.error('保存系统提示词失败');
  }
};

// 确认删除
const confirmDelete = (preset: SystemPromptPreset) => {
  presetToDelete.value = preset;
  deleteDialogVisible.value = true;
};

// 删除预设
const deletePreset = async () => {
  if (!presetToDelete.value) return;
  
  try {
    await presetStore.deleteSystemPromptPreset(presetToDelete.value.id);
    deleteDialogVisible.value = false;
    ElMessage.success('系统提示词删除成功');
  } catch (error) {
    ElMessage.error('删除系统提示词失败');
  }
};

// 加载预设
onMounted(async () => {
  await Promise.all([
    presetStore.loadSystemPromptPresets(),
    presetStore.loadMacroDescriptions()
  ]);
});
</script>

<style scoped>
.system-prompt-manager {
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

.tag-item {
  margin-right: 5px;
  margin-bottom: 5px;
}

.macro-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.macro-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.macro-tag:hover {
  transform: scale(1.05);
  background-color: #ecf5ff;
}

:deep(.selected-row) {
  background-color: #f0f9eb;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style> 