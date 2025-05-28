<template>
  <div class="system-prompt-editor">
    <el-form :model="localPreset" label-width="140px" class="preset-form">
      <!-- 基本信息 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>
        
        <el-form-item label="预设名称" required>
          <el-input 
            v-model="localPreset.name" 
            placeholder="请输入预设名称"
            @input="emitChange"
          />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="localPreset.description" 
            type="textarea"
            placeholder="请输入预设描述"
            :rows="2"
            @input="emitChange"
          />
        </el-form-item>
        
        <el-form-item label="启用状态">
          <el-switch 
            v-model="localPreset.enabled" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否启用此系统提示词</div>
        </el-form-item>
      </el-card>

      <!-- 提示词内容 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <div class="section-header">
            <span class="section-title">提示词内容</span>
            <el-button type="text" size="small" @click="showTemplates = !showTemplates">
              <el-icon><Collection /></el-icon>
              模板
            </el-button>
          </div>
        </template>
        
        <el-form-item label="系统提示词" required>
          <el-input 
            v-model="localPreset.content" 
            type="textarea"
            placeholder="请输入系统提示词内容"
            :rows="10"
            show-word-limit
            maxlength="4000"
            @input="emitChange"
          />
          <div class="field-hint">
            定义AI助手的角色、行为和回应风格。可以使用宏，如 {{char}}、{{user}} 等。
          </div>
        </el-form-item>
        
        <!-- 模板选择 -->
        <el-collapse-transition>
          <div v-if="showTemplates" class="template-section">
            <div class="template-title">常用模板：</div>
            <div class="template-list">
              <el-button 
                v-for="template in templates" 
                :key="template.name"
                size="small" 
                type="text"
                @click="applyTemplate(template)"
              >
                {{ template.name }}
              </el-button>
            </div>
          </div>
        </el-collapse-transition>
      </el-card>

      <!-- 格式设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">格式设置</span>
        </template>
        
        <el-form-item label="上下文前格式化">
          <el-switch 
            v-model="localPreset.formatBeforeContext" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">在上下文模板之前插入系统提示词</div>
        </el-form-item>
        
        <el-form-item label="上下文后格式化">
          <el-switch 
            v-model="localPreset.formatAfterContext" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">在上下文模板之后插入系统提示词</div>
        </el-form-item>
        
        <el-form-item label="启用宏">
          <el-switch 
            v-model="localPreset.enableMacros" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否处理提示词中的宏标记</div>
        </el-form-item>
      </el-card>

      <!-- 高级设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">高级设置</span>
        </template>
        
        <el-form-item label="优先级">
          <el-input-number 
            v-model="localPreset.priority" 
            :min="0"
            :max="100"
            placeholder="0"
            @change="emitChange"
          />
          <div class="field-hint">激活优先级（数字越大优先级越高）</div>
        </el-form-item>
        
        <el-form-item label="激活正则表达式">
          <el-input 
            v-model="localPreset.activationRegex" 
            placeholder="例如: gpt|claude"
            @input="emitChange"
          />
          <div class="field-hint">匹配模型名称的正则表达式</div>
        </el-form-item>
        
        <el-form-item label="启用模型">
          <el-select 
            v-model="localPreset.enabledFor" 
            multiple
            filterable
            allow-create
            placeholder="选择或输入模型名称"
            class="full-width"
            @change="emitChange"
          >
            <el-option label="ChatGPT" value="gpt" />
            <el-option label="Claude" value="claude" />
            <el-option label="Llama" value="llama" />
            <el-option label="Vicuna" value="vicuna" />
          </el-select>
          <div class="field-hint">限制此预设只能用于特定模型</div>
        </el-form-item>
      </el-card>

      <!-- 预览区域 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">预览效果</span>
        </template>
        
        <div class="preview-content">
          <div class="preview-label">处理后的提示词内容：</div>
          <div class="preview-text">
            {{ processedContent }}
          </div>
          
          <div class="preview-stats">
            <span>字符数: {{ localPreset.content.length }}</span>
            <span>预计Token数: {{ estimatedTokens }}</span>
          </div>
        </div>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from 'vue'
import { Collection } from '@element-plus/icons-vue'

interface SystemPromptPreset {
  id?: string
  name: string
  description?: string
  content: string
  enabled: boolean
  priority?: number
  activationRegex?: string
  enabledFor?: string[]
  formatBeforeContext?: boolean
  formatAfterContext?: boolean
  enableMacros?: boolean
  [key: string]: any
}

interface Props {
  modelValue: SystemPromptPreset
}

interface Emits {
  (e: 'update:modelValue', value: SystemPromptPreset): void
  (e: 'change'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const showTemplates = ref(false)

// 预设模板
const templates = ref([
  {
    name: '通用助手',
    content: '你是一个乐于助人、无害且诚实的AI助手。请始终提供有用、准确和安全的信息。如果你不确定某个问题的答案，请诚实地说"我不知道"。'
  },
  {
    name: '角色扮演',
    content: `你将扮演角色{{char}}。请完全沉浸在这个角色中，使用该角色的说话方式、思维模式和行为习惯。

重要指导原则:
1. 始终保持角色一致性
2. 根据角色背景和设定做出回应  
3. 展现角色的独特个性和特点
4. 在对话中自然地表达角色的情感和想法
5. 避免脱离角色设定

当前时间: {{date}} {{time}}
当前用户: {{user}}`
  },
  {
    name: '创意写作',
    content: '你是一个富有创意的写作助手。帮助用户创作故事、诗歌、剧本和其他创意内容。鼓励想象力，提供具体的写作建议，并保持内容的创新性和吸引力。'
  },
  {
    name: '技术专家',
    content: '你是一个技术专家，具有深厚的编程、工程和技术知识。请提供准确的技术信息，包含具体的代码示例和最佳实践。在回答技术问题时要详细且实用。'
  },
  {
    name: '教育助手',
    content: '你是一个教育助手，专门帮助用户学习新知识和技能。请用清晰、易懂的方式解释概念，提供实际例子，并鼓励用户思考和提问。根据用户的理解水平调整解释的深度。'
  }
])

// 本地副本
const localPreset = reactive<SystemPromptPreset>({
  name: '',
  description: '',
  content: '',
  enabled: true,
  priority: 0,
  activationRegex: '',
  enabledFor: [],
  formatBeforeContext: true,
  formatAfterContext: false,
  enableMacros: true,
  ...props.modelValue
})

// 计算属性
const processedContent = computed(() => {
  if (!localPreset.content) return '（暂无内容）'
  
  // 简单的宏预览处理
  let content = localPreset.content
  const sampleMacros = {
    '{{char}}': '角色名称',
    '{{user}}': '用户名称',
    '{{date}}': new Date().toLocaleDateString('zh-CN'),
    '{{time}}': new Date().toLocaleTimeString('zh-CN')
  }
  
  if (localPreset.enableMacros) {
    Object.entries(sampleMacros).forEach(([macro, value]) => {
      content = content.replace(new RegExp(macro.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
  }
  
  return content
})

const estimatedTokens = computed(() => {
  // 粗略估计Token数（中文约2-3字符=1Token，英文约4字符=1Token）
  const content = localPreset.content
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = content.length - chineseChars
  return Math.ceil(chineseChars / 2.5 + otherChars / 4)
})

// 监听 props 变化
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localPreset, newValue)
  },
  { deep: true }
)

// 方法
const emitChange = () => {
  emit('update:modelValue', { ...localPreset })
  emit('change')
}

const applyTemplate = (template: { name: string; content: string }) => {
  localPreset.content = template.content
  emitChange()
  showTemplates.value = false
}
</script>

<style scoped>
.system-prompt-editor {
  height: 100%;
  overflow-y: auto;
}

.preset-form {
  max-width: none;
}

.form-section {
  margin-bottom: 20px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-weight: 500;
  font-size: 14px;
}

.field-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.full-width {
  width: 100%;
}

.template-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  margin-top: 12px;
}

.template-title {
  font-weight: 500;
  font-size: 13px;
  color: #495057;
  margin-bottom: 8px;
}

.template-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-list .el-button {
  margin: 0;
  padding: 4px 8px;
  font-size: 12px;
  background-color: white;
  border: 1px solid #d0d7de;
}

.template-list .el-button:hover {
  background-color: #f6f8fa;
  border-color: #1890ff;
  color: #1890ff;
}

.preview-content {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
}

.preview-label {
  font-size: 13px;
  font-weight: 500;
  color: #495057;
  margin-bottom: 8px;
}

.preview-text {
  font-size: 13px;
  line-height: 1.5;
  color: #212529;
  white-space: pre-wrap;
  word-break: break-word;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  padding: 8px;
  min-height: 80px;
  margin-bottom: 8px;
}

.preview-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6c757d;
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
  margin-bottom: 18px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

:deep(.el-input__inner) {
  transition: all 0.2s;
}

:deep(.el-input__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 滚动条样式 */
.system-prompt-editor::-webkit-scrollbar {
  width: 6px;
}

.system-prompt-editor::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.system-prompt-editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.system-prompt-editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 