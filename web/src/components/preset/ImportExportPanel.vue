<template>
  <el-card class="import-export-panel">
    <template #header>
      <div class="card-header">
        <span>导入/导出预设</span>
      </div>
    </template>
    
    <div class="panel-content">
      <!-- 导入区域 -->
      <div class="import-section">
        <h4>导入预设</h4>
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept=".json"
          :on-change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">只能上传 JSON 文件</div>
          </template>
        </el-upload>
        
        <div class="import-actions">
          <el-button type="primary" @click="handleImport" :disabled="!selectedFile">
            导入预设
          </el-button>
        </div>
      </div>
      
      <!-- 导出区域 -->
      <div class="export-section">
        <h4>导出预设</h4>
        <el-form :model="exportForm" label-width="120px">
          <el-form-item label="导出类型">
            <el-radio-group v-model="exportForm.type">
              <el-radio value="single">单个预设</el-radio>
              <el-radio value="master">主预设</el-radio>
              <el-radio value="all">全部预设</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item v-if="exportForm.type === 'single'" label="选择预设">
            <el-select v-model="exportForm.presetId" placeholder="请选择预设">
              <el-option
                v-for="preset in availablePresets"
                :key="preset.id"
                :label="preset.name"
                :value="preset.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item v-if="exportForm.type === 'master'" label="主预设名称">
            <el-input v-model="exportForm.masterName" placeholder="请输入主预设名称" />
          </el-form-item>
        </el-form>
        
        <div class="export-actions">
          <el-button type="success" @click="handleExport">
            导出预设
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, UploadFilled } from 'element-plus'
import type { UploadFile } from 'element-plus'

interface Props {
  presets?: any[]
}

interface Emits {
  (e: 'import', data: any): void
  (e: 'export', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const uploadRef = ref()
const selectedFile = ref<File | null>(null)

const exportForm = reactive({
  type: 'single',
  presetId: '',
  masterName: ''
})

const availablePresets = computed(() => {
  return props.presets || []
})

const handleFileChange = (file: UploadFile) => {
  selectedFile.value = file.raw || null
}

const handleImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  try {
    const text = await selectedFile.value.text()
    const data = JSON.parse(text)
    
    emit('import', data)
    ElMessage.success('导入成功')
    selectedFile.value = null
  } catch (error) {
    ElMessage.error('文件格式错误')
    console.error('Import error:', error)
  }
}

const handleExport = () => {
  if (exportForm.type === 'single' && !exportForm.presetId) {
    ElMessage.warning('请选择要导出的预设')
    return
  }
  
  if (exportForm.type === 'master' && !exportForm.masterName) {
    ElMessage.warning('请输入主预设名称')
    return
  }
  
  emit('export', { ...exportForm })
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.import-export-panel {
  margin: 20px 0;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.import-section,
.export-section {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.import-section h4,
.export-section h4 {
  margin: 0 0 20px 0;
  color: #303133;
}

.import-actions,
.export-actions {
  margin-top: 20px;
  text-align: center;
}

.upload-demo {
  margin-bottom: 20px;
}
</style> 