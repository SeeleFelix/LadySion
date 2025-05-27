<template>
  <div class="context-preset-manager">
    <div class="preset-header">
      <h2>上下文模板预设</h2>
      <el-button 
        type="primary" 
        size="small" 
        @click="createNewPreset"
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
      <el-table-column label="使用停止字符串" width="130" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.useStopStrings" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="名称作为停止字符串" width="150" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.namesAsStopStrings" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
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
      :title="isNewPreset ? '新建上下文模板预设' : '编辑上下文模板预设'"
      width="800px"
    >
      <el-form :model="editingPreset" label-width="180px">
        <el-form-item label="预设名称" required>
          <el-input v-model="editingPreset.name" placeholder="请输入预设名称" />
        </el-form-item>
        
        <el-form-item label="预设描述">
          <el-input v-model="editingPreset.description" placeholder="请输入预设描述" />
        </el-form-item>
        
        <el-divider content-position="center">上下文模板内容</el-divider>
        
        <el-form-item label="故事字符串">
          <el-input 
            v-model="editingPreset.storyString" 
            type="textarea" 
            :rows="5"
            placeholder="角色和故事背景的描述模板" 
          />
          <div class="form-item-help">
            角色与故事背景模板，支持使用 {{char}}, {{persona}}, {{scenario}} 等宏
          </div>
        </el-form-item>
        
        <el-form-item label="对话开始标记">
          <el-input 
            v-model="editingPreset.chatStart" 
            placeholder="对话开始的标识" 
          />
          <div class="form-item-help">
            对话开始部分的标记，例如 "开始对话:" 等
          </div>
        </el-form-item>
        
        <el-form-item label="示例分隔符">
          <el-input 
            v-model="editingPreset.exampleSeparator" 
            placeholder="示例对话之间的分隔符" 
          />
          <div class="form-item-help">
            示例对话之间的分隔符，如换行符、特殊标记等
          </div>
        </el-form-item>
        
        <el-divider content-position="center">其他设置</el-divider>
        
        <el-form-item label="使用停止字符串">
          <el-switch v-model="editingPreset.useStopStrings" />
          <div class="form-item-help">
            启用时，将使用停止字符串防止AI继续生成不需要的内容
          </div>
        </el-form-item>
        
        <el-form-item label="名称作为停止字符串">
          <el-switch 
            v-model="editingPreset.namesAsStopStrings"
            :disabled="!editingPreset.useStopStrings" 
          />
          <div class="form-item-help">
            启用时，将角色名称作为停止字符串，如 "用户:"、"角色:" 等
          </div>
        </el-form-item>
        
        <el-form-item label="允许越狱">
          <el-switch v-model="editingPreset.allowJailbreak" />
          <div class="form-item-help">
            允许使用越狱提示词绕过AI的安全限制（请谨慎使用）
          </div>
        </el-form-item>
        
        <el-divider content-position="center">格式示例</el-divider>
        
        <div class="format-preview">
          <div class="preview-story">
            <h4>角色背景部分</h4>
            <pre>{{ getFormattedStory() }}</pre>
          </div>
          
          <div class="preview-chat">
            <h4>对话开始部分</h4>
            <pre>{{ getFormattedChatStart() }}</pre>
          </div>
          
          <div class="preview-examples" v-if="editingPreset.exampleSeparator">
            <h4>示例分隔方式</h4>
            <pre>用户: 你好！
角色: 你好，很高兴见到你！{{ editingPreset.exampleSeparator }}用户: 今天天气怎么样？
角色: 今天天气很好，阳光明媚！</pre>
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
import { ContextPreset } from '../../types/preset';
import * as presetStore from '../../store/presetStore';

// 预设列表
const presets = computed(() => presetStore.state.contextPresets.value);
const selectedPreset = computed(() => presetStore.state.selectedContextPreset.value);
const loading = computed(() => presetStore.state.loading.value.context);

// 预设编辑
const editDialogVisible = ref(false);
const isNewPreset = ref(false);
const editingPreset = ref<Partial<ContextPreset>>({
  storyString: '',
  chatStart: '',
  exampleSeparator: '',
  useStopStrings: true,
  allowJailbreak: false,
  namesAsStopStrings: true
});

// 删除确认
const deleteDialogVisible = ref(false);
const presetToDelete = ref<ContextPreset | null>(null);

// 获取行样式
const getRowClassName = ({ row }: { row: ContextPreset }) => {
  return selectedPreset.value && row.id === selectedPreset.value.id ? 'selected-row' : '';
};

// 选择预设
const selectPreset = async (preset: ContextPreset) => {
  try {
    await presetStore.selectContextPreset(preset.id);
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
    storyString: '{{char}}的人物设定: {{persona}}\n\n{{#if scenario}}场景: {{scenario}}{{/if}}\n{{#if personality}}{{char}}的性格: {{personality}}{{/if}}\n\n',
    chatStart: '<开始对话>',
    exampleSeparator: '\n---\n',
    useStopStrings: true,
    allowJailbreak: false,
    namesAsStopStrings: true
  };
  editDialogVisible.value = true;
};

// 编辑预设
const editPreset = (preset: ContextPreset) => {
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
    await presetStore.saveContextPreset(editingPreset.value);
    editDialogVisible.value = false;
    ElMessage.success('预设保存成功');
  } catch (error) {
    ElMessage.error('保存预设失败');
  }
};

// 确认删除
const confirmDelete = (preset: ContextPreset) => {
  presetToDelete.value = preset;
  deleteDialogVisible.value = true;
};

// 删除预设
const deletePreset = async () => {
  if (!presetToDelete.value) return;
  
  try {
    await presetStore.deleteContextPreset(presetToDelete.value.id);
    deleteDialogVisible.value = false;
    ElMessage.success('预设删除成功');
  } catch (error) {
    ElMessage.error('删除预设失败');
  }
};

// 格式化示例
const getFormattedStory = () => {
  const storyString = editingPreset.value.storyString || '';
  
  // 替换宏示例
  return storyString
    .replace(/{{char}}/g, '小红')
    .replace(/{{persona}}/g, '小红是一个活泼开朗的女孩，喜欢帮助他人。')
    .replace(/{{#if scenario}}(.*?){{\/if}}/g, '$1')
    .replace(/{{scenario}}/g, '春天的公园里，小红正在散步。')
    .replace(/{{#if personality}}(.*?){{\/if}}/g, '$1')
    .replace(/{{personality}}/g, '活泼、善良、热心');
};

const getFormattedChatStart = () => {
  const chatStart = editingPreset.value.chatStart || '';
  
  if (!chatStart) return '用户: 你好，小红！';
  
  return `${chatStart}\n\n用户: 你好，小红！`;
};

// 加载预设
onMounted(async () => {
  await presetStore.loadContextPresets();
});
</script>

<style scoped>
.context-preset-manager {
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

.preview-story,
.preview-chat,
.preview-examples {
  background: #e6f7ff;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.preview-story h4,
.preview-chat h4,
.preview-examples h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
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