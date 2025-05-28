<template>
  <div class="master-preset-manager">
    <div class="preset-header">
      <h2>主预设管理</h2>
    </div>
    
    <div class="current-presets">
      <h3>当前预设组合</h3>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="preset-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>指令模式预设</span>
                <el-tag 
                  v-if="selectedInstructPreset" 
                  type="success"
                  effect="dark"
                >已选择</el-tag>
                <el-tag 
                  v-else 
                  type="info"
                  effect="dark"
                >未选择</el-tag>
              </div>
            </template>
            <div class="preset-info" v-if="selectedInstructPreset">
              <h4>{{ selectedInstructPreset.name }}</h4>
              <p class="description">{{ selectedInstructPreset.description || '无描述' }}</p>
              <el-button 
                type="primary" 
                size="small" 
                @click="changePreset('instruct')"
              >
                更换
              </el-button>
            </div>
            <div class="empty-preset" v-else>
              <el-empty description="未选择指令模式预设" :image-size="60">
                <el-button type="primary" size="small" @click="changePreset('instruct')">
                  选择预设
                </el-button>
              </el-empty>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="preset-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>上下文模板</span>
                <el-tag 
                  v-if="selectedContextPreset" 
                  type="success"
                  effect="dark"
                >已选择</el-tag>
                <el-tag 
                  v-else 
                  type="info"
                  effect="dark"
                >未选择</el-tag>
              </div>
            </template>
            <div class="preset-info" v-if="selectedContextPreset">
              <h4>{{ selectedContextPreset.name }}</h4>
              <p class="description">{{ selectedContextPreset.description || '无描述' }}</p>
              <el-button 
                type="primary" 
                size="small" 
                @click="changePreset('context')"
              >
                更换
              </el-button>
            </div>
            <div class="empty-preset" v-else>
              <el-empty description="未选择上下文模板" :image-size="60">
                <el-button type="primary" size="small" @click="changePreset('context')">
                  选择预设
                </el-button>
              </el-empty>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="preset-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>系统提示词</span>
                <el-tag 
                  v-if="selectedSystemPromptPreset" 
                  type="success"
                  effect="dark"
                >已选择</el-tag>
                <el-tag 
                  v-else 
                  type="info"
                  effect="dark"
                >未选择</el-tag>
              </div>
            </template>
            <div class="preset-info" v-if="selectedSystemPromptPreset">
              <h4>{{ selectedSystemPromptPreset.name }}</h4>
              <p class="description">{{ selectedSystemPromptPreset.description || '无描述' }}</p>
              <el-button 
                type="primary" 
                size="small" 
                @click="changePreset('systemPrompt')"
              >
                更换
              </el-button>
            </div>
            <div class="empty-preset" v-else>
              <el-empty description="未选择系统提示词" :image-size="60">
                <el-button type="primary" size="small" @click="changePreset('systemPrompt')">
                  选择预设
                </el-button>
              </el-empty>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <div class="preset-actions">
        <el-button type="primary" @click="saveAsNewMasterPreset">
          保存为新的组合预设
        </el-button>
      </div>
    </div>
    
    <el-divider>保存的组合预设</el-divider>
    
    <div class="master-preset-list">
      <el-table :data="masterPresets" style="width: 100%">
        <el-table-column prop="name" label="预设名称" min-width="120" />
        <el-table-column label="包含组件" min-width="300">
          <template #default="scope">
            <el-tag v-if="scope.row.instruct" type="success" class="tag-item">
              指令模式: {{ scope.row.instruct.name }}
            </el-tag>
            <el-tag v-if="scope.row.context" type="warning" class="tag-item">
              上下文模板: {{ scope.row.context.name }}
            </el-tag>
            <el-tag v-if="scope.row.systemPrompt" type="info" class="tag-item">
              系统提示词: {{ scope.row.systemPrompt.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="applyMasterPreset(scope.row)"
            >
              应用
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="confirmDeleteMasterPreset(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 保存预设对话框 -->
    <el-dialog
      v-model="saveDialogVisible"
      title="保存组合预设"
      width="500px"
    >
      <el-form :model="newMasterPreset" label-width="120px">
        <el-form-item label="预设名称" required>
          <el-input v-model="newMasterPreset.name" placeholder="请输入预设名称" />
        </el-form-item>
        
        <el-form-item label="包含组件">
          <el-checkbox-group v-model="newMasterPreset.components">
            <el-checkbox 
              label="instruct" 
              :disabled="!selectedInstructPreset"
            >
              指令模式预设
            </el-checkbox>
            <el-checkbox 
              label="context" 
              :disabled="!selectedContextPreset"
            >
              上下文模板
            </el-checkbox>
            <el-checkbox 
              label="systemPrompt" 
              :disabled="!selectedSystemPromptPreset"
            >
              系统提示词
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="saveDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmSaveMasterPreset" 
            :disabled="!newMasterPreset.name || newMasterPreset.components.length === 0"
          >
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 预设选择对话框 -->
    <el-dialog
      v-model="selectDialogVisible"
      :title="getSelectDialogTitle()"
      width="600px"
    >
      <el-table
        :data="getPresetsByCurrentType()"
        style="width: 100%"
        @row-click="handlePresetSelect"
      >
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click.stop="selectPresetInDialog(scope.row)"
            >
              选择
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除组合预设 "{{ presetToDelete?.name }}" 吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteMasterPreset">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MasterPreset, PresetType } from '../../types/preset';
import * as presetStore from '../../store/presetStore';

// 预设状态
const selectedInstructPreset = computed(() => presetStore.state.selectedInstructPreset.value);
const selectedContextPreset = computed(() => presetStore.state.selectedContextPreset.value);
const selectedSystemPromptPreset = computed(() => presetStore.state.selectedSystemPromptPreset.value);

// 已保存的主预设
const masterPresets = ref<MasterPreset[]>([]);

// 对话框状态
const saveDialogVisible = ref(false);
const selectDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentSelectingType = ref<'instruct' | 'context' | 'systemPrompt'>('instruct');
const presetToDelete = ref<MasterPreset | null>(null);

// 新主预设表单
const newMasterPreset = ref({
  name: '',
  components: [] as string[]
});

// 切换预设
const changePreset = (type: 'instruct' | 'context' | 'systemPrompt') => {
  currentSelectingType.value = type;
  selectDialogVisible.value = true;
};

// 获取选择对话框标题
const getSelectDialogTitle = () => {
  switch (currentSelectingType.value) {
    case 'instruct':
      return '选择指令模式预设';
    case 'context':
      return '选择上下文模板';
    case 'systemPrompt':
      return '选择系统提示词';
    default:
      return '选择预设';
  }
};

// 获取当前类型的预设列表
const getPresetsByCurrentType = () => {
  switch (currentSelectingType.value) {
    case 'instruct':
      return presetStore.state.instructPresets.value;
    case 'context':
      return presetStore.state.contextPresets.value;
    case 'systemPrompt':
      return presetStore.state.systemPromptPresets.value;
    default:
      return [];
  }
};

// 处理预设选择
const handlePresetSelect = (row: any) => {
  selectPresetInDialog(row);
};

// 在对话框中选择预设
const selectPresetInDialog = async (preset: any) => {
  try {
    switch (currentSelectingType.value) {
      case 'instruct':
        await presetStore.selectInstructPreset(preset.id);
        break;
      case 'context':
        await presetStore.selectContextPreset(preset.id);
        break;
      case 'systemPrompt':
        await presetStore.selectSystemPromptPreset(preset.id);
        break;
    }
    
    selectDialogVisible.value = false;
    ElMessage.success(`已选择${getSelectDialogTitle().replace('选择', '')}: ${preset.name}`);
  } catch (error) {
    ElMessage.error('选择预设失败');
  }
};

// 保存为新的主预设
const saveAsNewMasterPreset = () => {
  // 根据当前选择的预设，设置默认值
  const components: string[] = [];
  if (selectedInstructPreset.value) components.push('instruct');
  if (selectedContextPreset.value) components.push('context');
  if (selectedSystemPromptPreset.value) components.push('systemPrompt');
  
  newMasterPreset.value = {
    name: '',
    components
  };
  
  saveDialogVisible.value = true;
};

// 确认保存主预设
const confirmSaveMasterPreset = async () => {
  if (!newMasterPreset.value.name) {
    ElMessage.warning('预设名称不能为空');
    return;
  }
  
  if (newMasterPreset.value.components.length === 0) {
    ElMessage.warning('至少需要选择一个组件');
    return;
  }
  
  try {
    // 创建主预设对象
    const masterPreset: MasterPreset = {
      name: newMasterPreset.value.name
    };
    
    // 添加选中的组件
    if (newMasterPreset.value.components.includes('instruct') && selectedInstructPreset.value) {
      masterPreset.instruct = selectedInstructPreset.value;
    }
    
    if (newMasterPreset.value.components.includes('context') && selectedContextPreset.value) {
      masterPreset.context = selectedContextPreset.value;
    }
    
    if (newMasterPreset.value.components.includes('systemPrompt') && selectedSystemPromptPreset.value) {
      masterPreset.systemPrompt = selectedSystemPromptPreset.value;
    }
    
    // 导入主预设
    await presetStore.importMasterPreset(masterPreset);
    
    // 重新加载主预设列表
    await loadMasterPresets();
    
    saveDialogVisible.value = false;
    ElMessage.success('组合预设保存成功');
  } catch (error) {
    ElMessage.error('保存组合预设失败');
  }
};

// 应用主预设
const applyMasterPreset = async (masterPreset: MasterPreset) => {
  try {
    await presetStore.importMasterPreset(masterPreset);
    ElMessage.success(`已应用组合预设: ${masterPreset.name}`);
  } catch (error) {
    ElMessage.error('应用组合预设失败');
  }
};

// 确认删除主预设
const confirmDeleteMasterPreset = (masterPreset: MasterPreset) => {
  presetToDelete.value = masterPreset;
  deleteDialogVisible.value = true;
};

// 删除主预设
const deleteMasterPreset = async () => {
  if (!presetToDelete.value) return;
  
  try {
    // 因为我们没有单独的API来删除主预设，我们可以通过导入一个空的同名预设来"删除"它
    // 或者更简单地从我们的本地列表中删除它
    masterPresets.value = masterPresets.value.filter(preset => preset.name !== presetToDelete.value?.name);
    
    deleteDialogVisible.value = false;
    ElMessage.success('组合预设删除成功');
  } catch (error) {
    ElMessage.error('删除组合预设失败');
  }
};

// 加载主预设列表
const loadMasterPresets = async () => {
  try {
    // 由于我们的API中没有提供获取所有主预设的方法，这里我们模拟一些
    // 在实际实现中，你可能需要添加一个API来获取所有保存的主预设
    masterPresets.value = generateSampleMasterPresets();
  } catch (error) {
    ElMessage.error('加载组合预设失败');
  }
};

// 生成示例主预设（实际项目中应该从服务器获取）
const generateSampleMasterPresets = (): MasterPreset[] => {
  const result: MasterPreset[] = [];
  
  // 如果存在任何选中的预设，生成一个包含它们的示例预设
  if (selectedInstructPreset.value || selectedContextPreset.value || selectedSystemPromptPreset.value) {
    const currentPreset: MasterPreset = {
      name: '当前组合'
    };
    
    if (selectedInstructPreset.value) {
      currentPreset.instruct = selectedInstructPreset.value;
    }
    
    if (selectedContextPreset.value) {
      currentPreset.context = selectedContextPreset.value;
    }
    
    if (selectedSystemPromptPreset.value) {
      currentPreset.systemPrompt = selectedSystemPromptPreset.value;
    }
    
    result.push(currentPreset);
  }
  
  return result;
};

// 加载预设
onMounted(async () => {
  await presetStore.loadAllPresets();
  await loadMasterPresets();
});
</script>

<style scoped>
.master-preset-manager {
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

.current-presets {
  margin-bottom: 30px;
}

.current-presets h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #606266;
}

.preset-card {
  margin-bottom: 20px;
  height: 200px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preset-info {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preset-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.description {
  flex-grow: 1;
  color: #606266;
  font-size: 14px;
  margin-bottom: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.empty-preset {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preset-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.master-preset-list {
  margin-top: 20px;
}

.tag-item {
  margin-right: 5px;
  margin-bottom: 5px;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style> 