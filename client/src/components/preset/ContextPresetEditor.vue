<template>
  <div class="context-preset-editor">
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
      </el-card>

      <!-- 上下文模板 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <div class="section-header">
            <span class="section-title">上下文模板</span>
            <el-button type="text" size="small" @click="showMacroHelp = !showMacroHelp">
              <el-icon><QuestionFilled /></el-icon>
              宏帮助
            </el-button>
          </div>
        </template>
        
        <el-form-item label="上下文模板" required>
          <el-input 
            v-model="localPreset.contextTemplate" 
            type="textarea"
            placeholder="请输入上下文模板"
            :rows="12"
            show-word-limit
            maxlength="4000"
            @input="emitChange"
          />
          <div class="field-hint">
            定义角色信息和对话结构的模板。支持使用宏变量，如 {{char}}、{{user}}、{{scenario}} 等。
          </div>
        </el-form-item>
        
        <!-- 宏帮助面板 -->
        <el-collapse-transition>
          <div v-if="showMacroHelp" class="macro-help">
            <div class="macro-title">常用宏变量：</div>
            <div class="macro-grid">
              <div class="macro-category">
                <div class="macro-category-title">角色信息</div>
                <div class="macro-item"><code>{{char}}</code> - 角色名称</div>
                <div class="macro-item"><code>{{char_personality}}</code> - 角色人格</div>
                <div class="macro-item"><code>{{char_appearance}}</code> - 角色外观</div>
                <div class="macro-item"><code>{{char_background}}</code> - 角色背景</div>
                <div class="macro-item"><code>{{char_speaking_style}}</code> - 说话风格</div>
              </div>
              <div class="macro-category">
                <div class="macro-category-title">场景信息</div>
                <div class="macro-item"><code>{{user}}</code> - 用户名称</div>
                <div class="macro-item"><code>{{scenario}}</code> - 场景描述</div>
                <div class="macro-item"><code>{{systemPrompt}}</code> - 系统提示词</div>
                <div class="macro-item"><code>{{chatStart}}</code> - 对话开始标记</div>
              </div>
              <div class="macro-category">
                <div class="macro-category-title">时间信息</div>
                <div class="macro-item"><code>{{date}}</code> - 当前日期</div>
                <div class="macro-item"><code>{{time}}</code> - 当前时间</div>
                <div class="macro-item"><code>{{datetime}}</code> - 日期时间</div>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </el-card>

      <!-- 对话设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">对话设置</span>
        </template>
        
        <el-form-item label="示例分隔符">
          <el-input 
            v-model="localPreset.exampleSeparator" 
            placeholder="例如: \n\n"
            @input="emitChange"
          />
          <div class="field-hint">示例对话之间的分隔符</div>
        </el-form-item>
        
        <el-form-item label="对话开始标记">
          <el-input 
            v-model="localPreset.chatStart" 
            placeholder="例如: 对话开始"
            @input="emitChange"
          />
          <div class="field-hint">标记对话正式开始的文本</div>
        </el-form-item>
      </el-card>

      <!-- 内容选项 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">内容选项</span>
        </template>
        
        <el-form-item label="使用故事字符串">
          <el-switch 
            v-model="localPreset.useStoryString" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否在上下文中包含故事背景信息</div>
        </el-form-item>
        
        <el-form-item label="使用人格描述">
          <el-switch 
            v-model="localPreset.usePersonality" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否在上下文中包含角色人格描述</div>
        </el-form-item>
        
        <el-form-item label="使用场景描述">
          <el-switch 
            v-model="localPreset.useScenario" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否在上下文中包含场景描述</div>
        </el-form-item>
        
        <el-form-item label="使用系统指令">
          <el-switch 
            v-model="localPreset.useSystemInstruction" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否在上下文中包含系统指令</div>
        </el-form-item>
        
        <el-form-item label="启用宏">
          <el-switch 
            v-model="localPreset.enableMacros" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否处理模板中的宏变量</div>
        </el-form-item>
      </el-card>

      <!-- 高级设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">高级设置</span>
        </template>
        
        <el-form-item label="最大上下文长度">
          <el-input-number 
            v-model="localPreset.maxContextLength" 
            :min="1000"
            :max="100000"
            :step="1000"
            placeholder="8000"
            @change="emitChange"
          />
          <div class="field-hint">上下文的最大字符长度</div>
        </el-form-item>
        
        <el-form-item label="Token预算">
          <el-input-number 
            v-model="localPreset.tokenBudget" 
            :min="100"
            :max="10000"
            :step="100"
            placeholder="2000"
            @change="emitChange"
          />
          <div class="field-hint">分配给上下文模板的Token数量</div>
        </el-form-item>
        
        <el-form-item label="插入深度">
          <el-input-number 
            v-model="localPreset.insertionDepth" 
            :min="0"
            :max="100"
            placeholder="0"
            @change="emitChange"
          />
          <div class="field-hint">在对话历史中插入上下文的深度</div>
        </el-form-item>
        
        <el-form-item label="激活正则表达式">
          <el-input 
            v-model="localPreset.activationRegex" 
            placeholder="例如: gpt|claude"
            @input="emitChange"
          />
          <div class="field-hint">匹配模型名称的正则表达式</div>
        </el-form-item>
      </el-card>

      <!-- 示例对话 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <div class="section-header">
            <span class="section-title">示例对话</span>
            <el-button type="primary" size="small" @click="addExampleDialogue">
              <el-icon><Plus /></el-icon>
              添加示例
            </el-button>
          </div>
        </template>
        
        <div v-if="localPreset.exampleDialogues && localPreset.exampleDialogues.length > 0">
          <div 
            v-for="(dialogue, index) in localPreset.exampleDialogues" 
            :key="dialogue.id || index"
            class="dialogue-item"
          >
            <div class="dialogue-header">
              <span class="dialogue-title">示例 {{ index + 1 }}</span>
              <el-button 
                type="text" 
                size="small" 
                @click="removeExampleDialogue(index)"
                class="remove-btn"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            
            <el-form-item label="用户消息">
              <el-input 
                v-model="dialogue.user" 
                type="textarea"
                placeholder="用户说的话"
                :rows="2"
                @input="emitChange"
              />
            </el-form-item>
            
            <el-form-item label="助手回复">
              <el-input 
                v-model="dialogue.assistant" 
                type="textarea"
                placeholder="助手的回复"
                :rows="3"
                @input="emitChange"
              />
            </el-form-item>
          </div>
        </div>
        
        <div v-else class="empty-dialogues">
          <el-empty description="暂无示例对话" size="small" />
        </div>
      </el-card>

      <!-- 预览区域 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">预览效果</span>
        </template>
        
        <div class="preview-content">
          <div class="preview-label">处理后的上下文模板：</div>
          <div class="preview-text">
            {{ processedTemplate }}
          </div>
        </div>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from 'vue'
import { QuestionFilled, Plus, Close } from '@element-plus/icons-vue'

interface ExampleDialogue {
  id: string
  user: string
  assistant: string
  order?: number
}

interface ContextPreset {
  id?: string
  name: string
  description?: string
  contextTemplate: string
  exampleSeparator: string
  chatStart: string
  exampleDialogues?: ExampleDialogue[]
  useStoryString?: boolean
  usePersonality?: boolean
  useScenario?: boolean
  useSystemInstruction?: boolean
  maxContextLength?: number
  tokenBudget?: number
  insertionDepth?: number
  enableMacros?: boolean
  activationRegex?: string
  [key: string]: any
}

interface Props {
  modelValue: ContextPreset
}

interface Emits {
  (e: 'update:modelValue', value: ContextPreset): void
  (e: 'change'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const showMacroHelp = ref(false)

// 本地副本
const localPreset = reactive<ContextPreset>({
  name: '',
  description: '',
  contextTemplate: '',
  exampleSeparator: '\n\n',
  chatStart: '',
  exampleDialogues: [],
  useStoryString: true,
  usePersonality: true,
  useScenario: true,
  useSystemInstruction: true,
  maxContextLength: 8000,
  tokenBudget: 2000,
  insertionDepth: 0,
  enableMacros: true,
  activationRegex: '',
  ...props.modelValue
})

// 计算属性
const processedTemplate = computed(() => {
  if (!localPreset.contextTemplate) return '（暂无模板内容）'
  
  // 简单的宏预览处理
  let template = localPreset.contextTemplate
  const sampleMacros = {
    '{{systemPrompt}}': '系统提示词内容',
    '{{char}}': '角色名称',
    '{{char_personality}}': '角色人格描述',
    '{{char_appearance}}': '角色外观描述',
    '{{char_background}}': '角色背景故事',
    '{{char_speaking_style}}': '角色说话风格',
    '{{user}}': '用户名称',
    '{{scenario}}': '当前场景描述',
    '{{chatStart}}': localPreset.chatStart || '对话开始',
    '{{date}}': new Date().toLocaleDateString('zh-CN'),
    '{{time}}': new Date().toLocaleTimeString('zh-CN'),
    '{{datetime}}': new Date().toLocaleString('zh-CN')
  }
  
  if (localPreset.enableMacros) {
    Object.entries(sampleMacros).forEach(([macro, value]) => {
      template = template.replace(new RegExp(macro.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
  }
  
  return template
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

const addExampleDialogue = () => {
  if (!localPreset.exampleDialogues) {
    localPreset.exampleDialogues = []
  }
  
  localPreset.exampleDialogues.push({
    id: Date.now().toString(),
    user: '',
    assistant: '',
    order: localPreset.exampleDialogues.length
  })
  
  emitChange()
}

const removeExampleDialogue = (index: number) => {
  if (localPreset.exampleDialogues && localPreset.exampleDialogues.length > index) {
    localPreset.exampleDialogues.splice(index, 1)
    emitChange()
  }
}
</script>

<style scoped>
.context-preset-editor {
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

.macro-help {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  margin-top: 12px;
}

.macro-title {
  font-weight: 500;
  font-size: 13px;
  color: #495057;
  margin-bottom: 12px;
}

.macro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.macro-category-title {
  font-weight: 500;
  font-size: 12px;
  color: #495057;
  margin-bottom: 6px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 2px;
}

.macro-item {
  font-size: 11px;
  color: #6c757d;
  margin-bottom: 4px;
}

.macro-item code {
  background-color: #e9ecef;
  padding: 1px 3px;
  border-radius: 2px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #495057;
  font-size: 11px;
}

.dialogue-item {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}

.dialogue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dialogue-title {
  font-weight: 500;
  font-size: 13px;
  color: #495057;
}

.remove-btn {
  color: #f56c6c !important;
  padding: 4px !important;
}

.empty-dialogues {
  text-align: center;
  padding: 20px;
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
  min-height: 100px;
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
.context-preset-editor::-webkit-scrollbar {
  width: 6px;
}

.context-preset-editor::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.context-preset-editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.context-preset-editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 