<template>
  <div class="import-export-tool">
    <!-- 导出功能 -->
    <el-card class="tool-section" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">导出预设</span>
          <el-icon class="header-icon"><Download /></el-icon>
        </div>
      </template>
      
      <div class="export-options">
        <el-form label-width="80px" size="small">
          <el-form-item label="导出格式">
            <el-radio-group v-model="exportFormat">
              <el-radio label="json">JSON格式</el-radio>
              <el-radio label="yaml">YAML格式</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="导出范围">
            <el-radio-group v-model="exportScope">
              <el-radio label="current">当前预设</el-radio>
              <el-radio label="type">当前类型</el-radio>
              <el-radio label="all">全部预设</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="包含设置">
            <el-checkbox-group v-model="exportOptions">
              <el-checkbox label="metadata">元数据</el-checkbox>
              <el-checkbox label="timestamps">时间戳</el-checkbox>
              <el-checkbox label="version">版本信息</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
        
        <div class="export-actions">
          <el-button 
            type="primary" 
            @click="handleExport"
            :disabled="!canExport"
            :loading="exporting"
          >
            <el-icon><Download /></el-icon>
            导出预设
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 导入功能 -->
    <el-card class="tool-section" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">导入预设</span>
          <el-icon class="header-icon"><Upload /></el-icon>
        </div>
      </template>
      
      <div class="import-options">
        <el-upload
          ref="uploadRef"
          class="upload-area"
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept=".json,.yaml,.yml"
          :on-change="handleFileChange"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">点击或拖拽文件到此区域上传</div>
          <div class="upload-hint">支持 .json, .yaml, .yml 格式</div>
        </el-upload>
        
        <div v-if="importFile" class="file-info">
          <div class="file-name">
            <el-icon><Document /></el-icon>
            {{ importFile.name }}
          </div>
          <div class="file-size">
            {{ formatFileSize(importFile.size) }}
          </div>
        </div>
        
        <el-form v-if="importFile" label-width="80px" size="small">
          <el-form-item label="冲突处理">
            <el-radio-group v-model="conflictResolution">
              <el-radio label="skip">跳过</el-radio>
              <el-radio label="overwrite">覆盖</el-radio>
              <el-radio label="rename">重命名</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="验证模式">
            <el-switch 
              v-model="strictValidation" 
              active-text="严格"
              inactive-text="宽松"
            />
            <div class="field-hint">严格模式会验证所有字段格式</div>
          </el-form-item>
        </el-form>
        
        <div v-if="importFile" class="import-actions">
          <el-button @click="clearImportFile">
            <el-icon><Close /></el-icon>
            清除
          </el-button>
          <el-button 
            type="primary" 
            @click="handleImport"
            :loading="importing"
          >
            <el-icon><Upload /></el-icon>
            导入预设
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 批量操作 -->
    <el-card class="tool-section" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">批量操作</span>
          <el-icon class="header-icon"><Operation /></el-icon>
        </div>
      </template>
      
      <div class="batch-operations">
        <el-button 
          size="small" 
          @click="$emit('batch-enable')"
          :disabled="!hasSelection"
        >
          <el-icon><Check /></el-icon>
          批量启用
        </el-button>
        
        <el-button 
          size="small" 
          @click="$emit('batch-disable')"
          :disabled="!hasSelection"
        >
          <el-icon><Close /></el-icon>
          批量禁用
        </el-button>
        
        <el-button 
          size="small" 
          type="danger"
          @click="$emit('batch-delete')"
          :disabled="!hasSelection"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        
        <el-divider direction="vertical" />
        
        <el-button 
          size="small" 
          @click="$emit('export-template')"
        >
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Download, Upload, UploadFilled, Document, Close, 
  Operation, Check, Delete 
} from '@element-plus/icons-vue'

interface Props {
  currentPreset?: any
  currentType?: string
  selectedPresets?: string[]
}

interface Emits {
  (e: 'export', data: any): void
  (e: 'import', data: any): void
  (e: 'batch-enable'): void
  (e: 'batch-disable'): void
  (e: 'batch-delete'): void
  (e: 'export-template'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 导出相关
const exportFormat = ref('json')
const exportScope = ref('current')
const exportOptions = ref(['metadata'])
const exporting = ref(false)

// 导入相关
const importFile = ref<File | null>(null)
const conflictResolution = ref('skip')
const strictValidation = ref(true)
const importing = ref(false)

// 计算属性
const canExport = computed(() => {
  if (exportScope.value === 'current') {
    return !!props.currentPreset
  }
  return true
})

const hasSelection = computed(() => {
  return props.selectedPresets && props.selectedPresets.length > 0
})

// 方法
const handleExport = async () => {
  if (!canExport.value) {
    ElMessage.warning('请先选择要导出的预设')
    return
  }

  exporting.value = true
  
  try {
    const exportData = {
      format: exportFormat.value,
      scope: exportScope.value,
      options: exportOptions.value,
      type: props.currentType,
      preset: props.currentPreset
    }
    
    emit('export', exportData)
    
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error)
  } finally {
    exporting.value = false
  }
}

const handleFileChange = (file: any) => {
  const { raw } = file
  
  // 文件大小检查 (最大10MB)
  if (raw.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过10MB')
    return
  }
  
  // 文件类型检查
  const allowedTypes = ['application/json', 'text/yaml', 'application/x-yaml']
  const allowedExtensions = ['.json', '.yaml', '.yml']
  
  const isTypeAllowed = allowedTypes.some(type => raw.type === type) ||
    allowedExtensions.some(ext => raw.name.toLowerCase().endsWith(ext))
  
  if (!isTypeAllowed) {
    ElMessage.error('只支持 JSON 和 YAML 格式文件')
    return
  }
  
  importFile.value = raw
}

const clearImportFile = () => {
  importFile.value = null
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }

  importing.value = true
  
  try {
    // 读取文件内容
    const content = await readFileContent(importFile.value)
    
    const importData = {
      content,
      fileName: importFile.value.name,
      fileType: getFileType(importFile.value.name),
      conflictResolution: conflictResolution.value,
      strictValidation: strictValidation.value
    }
    
    emit('import', importData)
    
    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('导入成功')
    clearImportFile()
  } catch (error) {
    ElMessage.error('导入失败：' + error)
  } finally {
    importing.value = false
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

const getFileType = (fileName: string): string => {
  if (fileName.toLowerCase().endsWith('.json')) return 'json'
  if (fileName.toLowerCase().endsWith('.yaml') || fileName.toLowerCase().endsWith('.yml')) return 'yaml'
  return 'unknown'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.import-export-tool {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.tool-section {
  margin-bottom: 20px;
}

.tool-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-weight: 500;
  font-size: 14px;
}

.header-icon {
  color: #409eff;
}

.export-options,
.import-options {
  padding: 8px 0;
}

.export-actions,
.import-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.upload-area {
  width: 100%;
  margin-bottom: 16px;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.file-info {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.field-hint {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.batch-operations {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  width: 100%;
  height: 120px;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

:deep(.el-upload-dragger .el-upload__text) {
  margin: 0;
}

/* 滚动条样式 */
.import-export-tool::-webkit-scrollbar {
  width: 6px;
}

.import-export-tool::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.import-export-tool::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.import-export-tool::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 