<template>
  <div class="post-history-instructions-editor">
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
          <div class="field-hint">是否启用此后历史指令</div>
        </el-form-item>
      </el-card>

      <!-- 指令内容 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <div class="section-header">
            <span class="section-title">指令内容</span>
            <el-button type="text" size="small" @click="showMacroHelp = !showMacroHelp">
              <el-icon><QuestionFilled /></el-icon>
              宏帮助
            </el-button>
          </div>
        </template>
        
        <el-form-item label="指令内容" required>
          <el-input 
            v-model="localPreset.content" 
            type="textarea"
            placeholder="请输入后历史指令内容"
            :rows="8"
            show-word-limit
            maxlength="2000"
            @input="emitChange"
          />
          <div class="field-hint">
            在对话历史之后插入的指令。可以使用宏，如 {{char}}、{{user}}、{{original}} 等。
          </div>
        </el-form-item>
        
        <!-- 宏帮助面板 -->
        <el-collapse-transition>
          <div v-if="showMacroHelp" class="macro-help">
            <div class="macro-title">常用宏：</div>
            <div class="macro-list">
              <div class="macro-item">
                <code>{{char}}</code> - 角色名称
              </div>
              <div class="macro-item">
                <code>{{user}}</code> - 用户名称
              </div>
              <div class="macro-item">
                <code>{{original}}</code> - 原始全局指令（仅在角色覆盖时使用）
              </div>
              <div class="macro-item">
                <code>{{char_personality}}</code> - 角色人格
              </div>
              <div class="macro-item">
                <code>{{char_speaking_style}}</code> - 角色说话风格
              </div>
              <div class="macro-item">
                <code>{{char_background}}</code> - 角色背景
              </div>
              <div class="macro-item">
                <code>{{date}}</code> - 当前日期
              </div>
              <div class="macro-item">
                <code>{{time}}</code> - 当前时间
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </el-card>

      <!-- 角色特定设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">角色特定设置</span>
        </template>
        
        <el-form-item label="优先角色指令">
          <el-switch 
            v-model="localPreset.preferCharacterInstructions" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">当角色有特定的后历史指令时，优先使用角色指令</div>
        </el-form-item>
        
        <el-form-item label="允许角色覆盖">
          <el-switch 
            v-model="localPreset.allowCharacterOverride" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">允许角色的后历史指令完全替换全局指令</div>
        </el-form-item>
      </el-card>

      <!-- 插入设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">插入设置</span>
        </template>
        
        <el-form-item label="插入位置">
          <el-select 
            v-model="localPreset.insertionPosition" 
            placeholder="选择插入位置"
            @change="emitChange"
          >
            <el-option label="末尾" value="end" />
            <el-option label="倒数第二条消息前" value="before_last" />
            <el-option label="自定义位置" value="custom" />
          </el-select>
          <div class="field-hint">选择在对话中的插入位置</div>
        </el-form-item>
        
        <el-form-item 
          v-if="localPreset.insertionPosition === 'custom'" 
          label="自定义位置"
        >
          <el-input-number 
            v-model="localPreset.customPosition" 
            :min="0"
            placeholder="0"
            @change="emitChange"
          />
          <div class="field-hint">从对话开始计数的位置（0为开头）</div>
        </el-form-item>
      </el-card>

      <!-- 高级设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">高级设置</span>
        </template>
        
        <el-form-item label="启用宏">
          <el-switch 
            v-model="localPreset.enableMacros" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否处理指令中的宏标记</div>
        </el-form-item>
        
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
          <div class="preview-label">处理后的指令内容：</div>
          <div class="preview-text">
            {{ processedContent }}
          </div>
        </div>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'

interface PostHistoryInstructionsPreset {
  id?: string
  name: string
  description?: string
  content: string
  enabled: boolean
  priority?: number
  activationRegex?: string
  enabledFor?: string[]
  preferCharacterInstructions?: boolean
  allowCharacterOverride?: boolean
  enableMacros?: boolean
  insertionPosition?: 'end' | 'before_last' | 'custom'
  customPosition?: number
  [key: string]: any
}

interface Props {
  modelValue: PostHistoryInstructionsPreset
}

interface Emits {
  (e: 'update:modelValue', value: PostHistoryInstructionsPreset): void
  (e: 'change'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const showMacroHelp = ref(false)

// 本地副本
const localPreset = reactive<PostHistoryInstructionsPreset>({
  name: '',
  description: '',
  content: '',
  enabled: true,
  priority: 0,
  activationRegex: '',
  enabledFor: [],
  preferCharacterInstructions: false,
  allowCharacterOverride: false,
  enableMacros: true,
  insertionPosition: 'end',
  customPosition: 0,
  ...props.modelValue
})

// 计算属性 - 预览处理后的内容
const processedContent = computed(() => {
  if (!localPreset.content) return '（暂无内容）'
  
  // 简单的宏预览处理
  let content = localPreset.content
  const sampleMacros = {
    '{{char}}': '角色名称',
    '{{user}}': '用户名称',
    '{{char_personality}}': '角色人格描述',
    '{{char_speaking_style}}': '角色说话风格',
    '{{char_background}}': '角色背景设定',
    '{{date}}': new Date().toLocaleDateString('zh-CN'),
    '{{time}}': new Date().toLocaleTimeString('zh-CN'),
    '{{original}}': '(原始全局指令)'
  }
  
  if (localPreset.enableMacros) {
    Object.entries(sampleMacros).forEach(([macro, value]) => {
      content = content.replace(new RegExp(macro.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
  }
  
  return content
})

// 监听 props 变化
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localPreset, newValue)
  },
  { deep: true }
)

// 发出变化事件
const emitChange = () => {
  emit('update:modelValue', { ...localPreset })
  emit('change')
}
</script>

<style scoped>
.post-history-instructions-editor {
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
  margin-bottom: 8px;
}

.macro-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.macro-item {
  font-size: 12px;
  color: #6c757d;
}

.macro-item code {
  background-color: #e9ecef;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #495057;
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
  min-height: 60px;
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
.post-history-instructions-editor::-webkit-scrollbar {
  width: 6px;
}

.post-history-instructions-editor::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.post-history-instructions-editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.post-history-instructions-editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 