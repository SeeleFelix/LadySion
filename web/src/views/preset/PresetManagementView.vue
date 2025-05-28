<template>
  <div class="preset-management">
    <!-- 左侧：预设列表和分类 -->
    <div class="preset-sidebar">
      <div class="sidebar-header">
        <h3>预设管理</h3>
        <el-button type="primary" size="small" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建预设
        </el-button>
      </div>
      
      <!-- 预设类型标签页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="preset-tabs">
        <el-tab-pane label="指令模式" name="instruct">
          <PresetList 
            :presets="instructPresets" 
            :loading="loading"
            @select="selectPreset"
            @delete="deletePreset"
            @duplicate="duplicatePreset"
          />
        </el-tab-pane>
        
        <el-tab-pane label="上下文模板" name="context">
          <PresetList 
            :presets="contextPresets" 
            :loading="loading"
            @select="selectPreset"
            @delete="deletePreset"
            @duplicate="duplicatePreset"
          />
        </el-tab-pane>
        
        <el-tab-pane label="系统提示词" name="systemPrompt">
          <PresetList 
            :presets="systemPromptPresets" 
            :loading="loading"
            @select="selectPreset"
            @delete="deletePreset"
            @duplicate="duplicatePreset"
          />
        </el-tab-pane>
        
        <el-tab-pane label="后历史指令" name="postHistoryInstructions">
          <PresetList 
            :presets="postHistoryInstructionsPresets" 
            :loading="loading"
            @select="selectPreset"
            @delete="deletePreset"
            @duplicate="duplicatePreset"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 中间：预设详情编辑区 -->
    <div class="preset-editor">
      <div class="editor-header">
        <div class="preset-info" v-if="selectedPreset">
          <h4>{{ selectedPreset.name }}</h4>
          <span class="preset-type">{{ getPresetTypeLabel(activeTab) }}</span>
        </div>
        <div class="editor-actions" v-if="selectedPreset">
          <el-button size="small" @click="savePreset" :loading="saving">
            <el-icon><DocumentCopy /></el-icon>
            保存
          </el-button>
          <el-button size="small" @click="exportPreset">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button size="small" @click="testPreset">
            <el-icon><View /></el-icon>
            测试
          </el-button>
        </div>
      </div>

      <!-- 动态编辑组件 -->
      <div class="editor-content" v-if="selectedPreset">
        <InstructPresetEditor 
          v-if="activeTab === 'instruct'"
          v-model="selectedPreset"
          @change="markDirty"
        />
        <ContextPresetEditor 
          v-else-if="activeTab === 'context'"
          v-model="selectedPreset"
          @change="markDirty"
        />
        <SystemPromptPresetEditor 
          v-else-if="activeTab === 'systemPrompt'"
          v-model="selectedPreset"
          @change="markDirty"
        />
        <PostHistoryInstructionsPresetEditor 
          v-else-if="activeTab === 'postHistoryInstructions'"
          v-model="selectedPreset"
          @change="markDirty"
        />
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <el-empty description="请从左侧选择一个预设进行编辑" />
      </div>
    </div>

    <!-- 右侧：工具面板和预览 -->
    <div class="preset-tools">
      <el-tabs v-model="rightTab" class="tools-tabs">
        <el-tab-pane label="预览" name="preview">
          <PresetPreview 
            :preset="selectedPreset"
            :preset-type="activeTab"
            :macros="availableMacros"
          />
        </el-tab-pane>
        
        <el-tab-pane label="宏参考" name="macros">
          <MacroReference :macros="availableMacros" />
        </el-tab-pane>
        
        <el-tab-pane label="导入导出" name="import-export">
          <ImportExportPanel 
            @import="importPreset"
            @export-all="exportAllPresets"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 创建预设对话框 -->
    <CreatePresetDialog 
      v-model="showCreateDialog"
      :preset-type="activeTab"
      @create="createPreset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, DocumentCopy, Download, View } from '@element-plus/icons-vue'
import PresetList from '@/components/preset/PresetList.vue'
import InstructPresetEditor from '@/components/preset/InstructPresetEditor.vue'
import ContextPresetEditor from '@/components/preset/ContextPresetEditor.vue'
import SystemPromptPresetEditor from '@/components/preset/SystemPromptPresetEditor.vue'
import PostHistoryInstructionsPresetEditor from '@/components/preset/PostHistoryInstructionsPresetEditor.vue'
import PresetPreview from '@/components/preset/PresetPreview.vue'
import MacroReference from '@/components/preset/MacroReference.vue'
import ImportExportPanel from '@/components/preset/ImportExportPanel.vue'
import CreatePresetDialog from '@/components/preset/CreatePresetDialog.vue'

interface Preset {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  [key: string]: any
}

interface MacroDescription {
  name: string
  description: string
  syntax?: string
  example?: string
  category?: string
}

// 响应式数据
const activeTab = ref('instruct')
const rightTab = ref('preview')
const selectedPreset = ref<Preset | null>(null)
const showCreateDialog = ref(false)
const loading = ref(false)
const saving = ref(false)
const isDirty = ref(false)

// 预设数据
const instructPresets = ref<Preset[]>([])
const contextPresets = ref<Preset[]>([])
const systemPromptPresets = ref<Preset[]>([])
const postHistoryInstructionsPresets = ref<Preset[]>([])
const availableMacros = ref<MacroDescription[]>([])

// 计算属性
const currentPresets = computed(() => {
  switch (activeTab.value) {
    case 'instruct': return instructPresets.value
    case 'context': return contextPresets.value
    case 'systemPrompt': return systemPromptPresets.value
    case 'postHistoryInstructions': return postHistoryInstructionsPresets.value
    default: return []
  }
})

// 方法
const getPresetTypeLabel = (type: string) => {
  const labels = {
    instruct: '指令模式预设',
    context: '上下文模板预设',
    systemPrompt: '系统提示词预设',
    postHistoryInstructions: '后历史指令预设'
  }
  return labels[type as keyof typeof labels] || type
}

const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  selectedPreset.value = null
  isDirty.value = false
  loadPresets()
}

const selectPreset = (preset: Preset) => {
  if (isDirty.value) {
    ElMessageBox.confirm(
      '当前预设有未保存的修改，确定要切换吗？',
      '确认切换',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      selectedPreset.value = { ...preset }
      isDirty.value = false
    }).catch(() => {
      // 取消切换
    })
  } else {
    selectedPreset.value = { ...preset }
    isDirty.value = false
  }
}

const markDirty = () => {
  isDirty.value = true
}

const createPreset = async (presetData: any) => {
  try {
    const response = await fetch(`/api/presets/${activeTab.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(presetData),
    })

    if (!response.ok) {
      throw new Error('创建预设失败')
    }

    const newPreset = await response.json()
    currentPresets.value.push(newPreset)
    selectedPreset.value = { ...newPreset }
    ElMessage.success('预设创建成功')
  } catch (error) {
    console.error('创建预设失败:', error)
    ElMessage.error('创建预设失败')
  }
}

const savePreset = async () => {
  if (!selectedPreset.value) return

  try {
    saving.value = true
    const response = await fetch(`/api/presets/${activeTab.value}/${selectedPreset.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(selectedPreset.value),
    })

    if (!response.ok) {
      throw new Error('保存预设失败')
    }

    const updatedPreset = await response.json()
    
    // 更新列表中的预设
    const index = currentPresets.value.findIndex(p => p.id === updatedPreset.id)
    if (index !== -1) {
      currentPresets.value[index] = updatedPreset
    }
    
    selectedPreset.value = { ...updatedPreset }
    isDirty.value = false
    ElMessage.success('预设保存成功')
  } catch (error) {
    console.error('保存预设失败:', error)
    ElMessage.error('保存预设失败')
  } finally {
    saving.value = false
  }
}

const deletePreset = async (preset: Preset) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除预设"${preset.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await fetch(`/api/presets/${activeTab.value}/${preset.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('删除预设失败')
    }

    // 从列表中移除
    const index = currentPresets.value.findIndex(p => p.id === preset.id)
    if (index !== -1) {
      currentPresets.value.splice(index, 1)
    }

    // 如果删除的是当前选中的预设，清空选择
    if (selectedPreset.value?.id === preset.id) {
      selectedPreset.value = null
      isDirty.value = false
    }

    ElMessage.success('预设删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除预设失败:', error)
      ElMessage.error('删除预设失败')
    }
  }
}

const duplicatePreset = async (preset: Preset) => {
  try {
    const newPreset = {
      ...preset,
      id: undefined,
      name: `${preset.name} - 副本`,
      createdAt: undefined,
      updatedAt: undefined
    }

    const response = await fetch(`/api/presets/${activeTab.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPreset),
    })

    if (!response.ok) {
      throw new Error('复制预设失败')
    }

    const duplicatedPreset = await response.json()
    currentPresets.value.push(duplicatedPreset)
    ElMessage.success('预设复制成功')
  } catch (error) {
    console.error('复制预设失败:', error)
    ElMessage.error('复制预设失败')
  }
}

const exportPreset = () => {
  if (!selectedPreset.value) return

  const dataStr = JSON.stringify(selectedPreset.value, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `${selectedPreset.value.name}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

const exportAllPresets = () => {
  const allPresets = {
    instruct: instructPresets.value,
    context: contextPresets.value,
    systemPrompt: systemPromptPresets.value,
    postHistoryInstructions: postHistoryInstructionsPresets.value
  }
  
  const dataStr = JSON.stringify(allPresets, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = 'all_presets.json'
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

const importPreset = async (file: File) => {
  try {
    const text = await file.text()
    const presetData = JSON.parse(text)
    
    // 验证预设数据
    if (!presetData.name) {
      throw new Error('无效的预设文件：缺少name字段')
    }
    
    await createPreset(presetData)
  } catch (error) {
    console.error('导入预设失败:', error)
    ElMessage.error('导入预设失败：文件格式不正确')
  }
}

const testPreset = () => {
  if (!selectedPreset.value) return
  
  // 跳转到聊天页面，应用当前预设进行测试
  // 这里可以实现预设测试功能
  ElMessage.info('预设测试功能开发中...')
}

const loadPresets = async () => {
  try {
    loading.value = true
    const response = await fetch(`/api/presets/${activeTab.value}`)
    
    if (!response.ok) {
      throw new Error('加载预设失败')
    }
    
    const presets = await response.json()
    
    switch (activeTab.value) {
      case 'instruct':
        instructPresets.value = presets
        break
      case 'context':
        contextPresets.value = presets
        break
      case 'systemPrompt':
        systemPromptPresets.value = presets
        break
      case 'postHistoryInstructions':
        postHistoryInstructionsPresets.value = presets
        break
    }
  } catch (error) {
    console.error('加载预设失败:', error)
    ElMessage.error('加载预设失败')
  } finally {
    loading.value = false
  }
}

const loadMacros = async () => {
  try {
    const response = await fetch('/api/macros')
    if (response.ok) {
      availableMacros.value = await response.json()
    }
  } catch (error) {
    console.error('加载宏列表失败:', error)
  }
}

// 生命周期
onMounted(async () => {
  await loadPresets()
  await loadMacros()
})
</script>

<style scoped>
.preset-management {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

.preset-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.preset-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preset-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.preset-editor {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
}

.editor-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
}

.preset-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
}

.preset-type {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-tools {
  width: 300px;
  background: white;
  display: flex;
  flex-direction: column;
}

.tools-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tools-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .preset-tools {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .preset-management {
    flex-direction: column;
    height: auto;
  }
  
  .preset-sidebar,
  .preset-tools {
    width: 100%;
  }
  
  .preset-editor {
    min-height: 500px;
  }
}
</style> 