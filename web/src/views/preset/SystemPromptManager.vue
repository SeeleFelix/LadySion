<template>
  <div class="system-prompt-manager">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="preset-list-card">
          <template #header>
            <div class="card-header">
              <span>系统提示词列表</span>
              <el-button type="primary" @click="handleCreatePreset" size="small">新建</el-button>
            </div>
          </template>
          <el-input v-model="searchQuery" placeholder="搜索提示词..." clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-empty v-if="filteredPresets.length === 0" description="没有找到系统提示词" />
          <div class="preset-list" v-else>
            <div
              v-for="preset in filteredPresets"
              :key="preset.id"
              class="preset-item"
              :class="{ active: selectedPresetId === preset.id }"
              @click="selectPreset(preset.id)"
            >
              <div class="preset-name">{{ preset.name }}</div>
              <div class="preset-description">{{ preset.description || '无描述' }}</div>
              <div class="preset-actions">
                <el-tooltip content="编辑" placement="top">
                  <el-button @click.stop="handleEditPreset(preset)" type="primary" size="small" circle>
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button @click.stop="handleDeletePreset(preset.id)" type="danger" size="small" circle>
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="应用" placement="top">
                  <el-button 
                    @click.stop="handleApplyPreset(preset.id)" 
                    type="success" 
                    size="small" 
                    circle
                    :disabled="selectedPresetId === preset.id"
                  >
                    <el-icon><Select /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card v-if="selectedPreset" class="preset-detail-card">
          <template #header>
            <div class="card-header">
              <span>{{ editing ? (isNewPreset ? '创建系统提示词' : '编辑系统提示词') : '系统提示词详情' }}</span>
              <div v-if="!editing">
                <el-button type="primary" @click="startEditing" size="small">编辑</el-button>
              </div>
              <div v-else>
                <el-button type="success" @click="savePreset" size="small">保存</el-button>
                <el-button @click="cancelEditing" size="small">取消</el-button>
              </div>
            </div>
          </template>
          
          <div v-if="editing" class="preset-edit-form">
            <el-form :model="editingPreset" label-position="top">
              <el-form-item label="名称">
                <el-input v-model="editingPreset.name" placeholder="输入名称"></el-input>
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="editingPreset.description" placeholder="输入描述"></el-input>
              </el-form-item>
              <el-form-item label="分类">
                <el-select v-model="editingPreset.category" placeholder="选择分类" allow-create filterable>
                  <el-option
                    v-for="category in availableCategories"
                    :key="category"
                    :label="category"
                    :value="category"
                  ></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="标签">
                <el-select v-model="editingPreset.tags" multiple placeholder="选择标签" allow-create filterable>
                  <el-option
                    v-for="tag in availableTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  ></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="系统提示词内容">
                <el-input
                  v-model="editingPreset.content"
                  type="textarea"
                  :rows="10"
                  placeholder="输入系统提示词内容"
                ></el-input>
              </el-form-item>
            </el-form>
          </div>
          
          <div v-else class="preset-details">
            <h3>{{ selectedPreset.name }}</h3>
            <p class="description">{{ selectedPreset.description || '无描述' }}</p>
            
            <div class="detail-section">
              <h4>分类</h4>
              <el-tag v-if="selectedPreset.category">{{ selectedPreset.category }}</el-tag>
              <span v-else>无分类</span>
            </div>
            
            <div class="detail-section">
              <h4>标签</h4>
              <div class="tags">
                <el-tag v-for="tag in selectedPreset.tags" :key="tag" class="tag">{{ tag }}</el-tag>
                <span v-if="!selectedPreset.tags || selectedPreset.tags.length === 0">无标签</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>系统提示词内容</h4>
              <pre class="content">{{ selectedPreset.content }}</pre>
            </div>
            
            <div class="detail-section">
              <h4>创建时间</h4>
              <p>{{ formatDate(selectedPreset.createdAt) }}</p>
            </div>
            
            <div class="detail-section">
              <h4>更新时间</h4>
              <p>{{ formatDate(selectedPreset.updatedAt) }}</p>
            </div>
          </div>
        </el-card>
        
        <el-empty v-else description="请选择一个系统提示词查看详情" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit, Select, Search } from '@element-plus/icons-vue';
import type { SystemPromptPreset } from '@/types/preset';
import { presetApi } from '@/services/api/preset';
import type { PresetType } from '@/services/api/preset';

// 预设数据
const presets = ref<SystemPromptPreset[]>([]);
const selectedPresetId = ref<string | null>(null);
const searchQuery = ref('');
const isLoading = ref(false);

// 编辑状态
const editing = ref(false);
const isNewPreset = ref(false);
const editingPreset = ref<SystemPromptPreset>({} as SystemPromptPreset);

// 过滤后的预设列表
const filteredPresets = computed(() => {
  if (!searchQuery.value) return presets.value;
  const query = searchQuery.value.toLowerCase();
  return presets.value.filter(preset => 
    preset.name.toLowerCase().includes(query) || 
    (preset.description && preset.description.toLowerCase().includes(query)) ||
    (preset.category && preset.category.toLowerCase().includes(query)) ||
    (preset.tags && preset.tags.some(tag => tag.toLowerCase().includes(query)))
  );
});

// 选中的预设
const selectedPreset = computed(() => {
  if (!selectedPresetId.value) return null;
  return presets.value.find(preset => preset.id === selectedPresetId.value) || null;
});

// 可用的分类和标签
const availableCategories = computed(() => {
  const categories = presets.value
    .map(preset => preset.category)
    .filter(Boolean) as string[];
  return [...new Set(categories)];
});

const availableTags = computed(() => {
  const tags = presets.value
    .flatMap(preset => preset.tags || [])
    .filter(Boolean);
  return [...new Set(tags)];
});

// 初始化
onMounted(async () => {
  await loadPresets();
});

// 加载系统提示词列表
async function loadPresets() {
  isLoading.value = true;
  try {
    const response = await presetApi.getAll('sysprompt' as PresetType);
    presets.value = response as SystemPromptPreset[];
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败');
  } finally {
    isLoading.value = false;
  }
}

// 选择预设
function selectPreset(id: string) {
  selectedPresetId.value = id;
  editing.value = false;
}

// 开始编辑
function startEditing() {
  if (!selectedPreset.value) return;
  
  editingPreset.value = JSON.parse(JSON.stringify(selectedPreset.value));
  editing.value = true;
  isNewPreset.value = false;
}

// 取消编辑
function cancelEditing() {
  editing.value = false;
  if (isNewPreset.value) {
    selectedPresetId.value = null;
  }
}

// 创建新预设
function handleCreatePreset() {
  isNewPreset.value = true;
  editing.value = true;
  selectedPresetId.value = null;
  
  editingPreset.value = {
    id: '',
    name: '',
    description: '',
    content: '',
    category: '',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// 编辑预设
function handleEditPreset(preset: SystemPromptPreset) {
  selectPreset(preset.id);
  startEditing();
}

// 保存系统提示词
async function savePreset() {
  if (!editingPreset.value.name.trim()) {
    ElMessage.warning('请输入名称');
    return;
  }
  
  try {
    const isNew = !editingPreset.value.id;
    const response = await presetApi.save(
      'sysprompt' as PresetType, 
      editingPreset.value
    );
    
    ElMessage.success(isNew ? '创建系统提示词成功' : '更新系统提示词成功');
    showEditDialog.value = false;
    loadPresets();
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  }
}

// 删除系统提示词
function deletePreset(id: string) {
  ElMessageBox.confirm(
    '确定要删除这个系统提示词吗？此操作不可恢复。',
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await presetApi.remove('sysprompt' as PresetType, id);
      ElMessage.success('删除系统提示词成功');
      
      // 重新加载预设列表
      loadPresets();
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败');
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
}

// 应用系统提示词
async function handleApplyPreset(id: string) {
  try {
    await presetApi.selectSystemPromptPreset(id);
    ElMessage.success('应用系统提示词成功');
    selectedPresetId.value = id;
  } catch (error: any) {
    ElMessage.error(error.message || '应用失败');
  }
}

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}
</script>

<style scoped>
.system-prompt-manager {
  padding: 20px;
}

.preset-list-card,
.preset-detail-card {
  height: calc(100vh - 180px);
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preset-list {
  margin-top: 15px;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.preset-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.3s;
}

.preset-item:hover {
  background-color: #f5f7fa;
}

.preset-item.active {
  background-color: #ecf5ff;
}

.preset-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.preset-description {
  font-size: 0.9em;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.preset-actions {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
}

.preset-details {
  padding: 10px;
}

.preset-details h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin-bottom: 10px;
  color: #606266;
}

.description {
  color: #606266;
  margin-bottom: 20px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.content {
  background-color: #f7f7f7;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.preset-edit-form {
  padding: 10px;
}

:deep(.el-form-item__label) {
  font-weight: bold;
}
</style> 