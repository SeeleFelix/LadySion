<template>
  <div class="instruct-preset-editor">
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

      <!-- 序列配置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">序列配置</span>
        </template>
        
        <el-form-item label="输入序列">
          <el-input 
            v-model="localPreset.inputSequence" 
            placeholder="例如: ### Instruction:\n"
            type="textarea"
            :rows="2"
            @input="emitChange"
          />
          <div class="field-hint">用户消息前的序列</div>
        </el-form-item>
        
        <el-form-item label="输入后缀">
          <el-input 
            v-model="localPreset.inputSuffix" 
            placeholder="例如: \n\n### Response:\n"
            type="textarea"
            :rows="2"
            @input="emitChange"
          />
          <div class="field-hint">用户消息后的序列</div>
        </el-form-item>
        
        <el-form-item label="输出序列">
          <el-input 
            v-model="localPreset.outputSequence" 
            placeholder="助手消息前的序列（通常为空）"
            type="textarea"
            :rows="1"
            @input="emitChange"
          />
        </el-form-item>
        
        <el-form-item label="输出后缀">
          <el-input 
            v-model="localPreset.outputSuffix" 
            placeholder="助手消息后的序列"
            type="textarea"
            :rows="1"
            @input="emitChange"
          />
        </el-form-item>
        
        <el-form-item label="系统序列">
          <el-input 
            v-model="localPreset.systemSequence" 
            placeholder="例如: ### System:\n"
            type="textarea"
            :rows="2"
            @input="emitChange"
          />
          <div class="field-hint">系统消息前的序列</div>
        </el-form-item>
        
        <el-form-item label="系统后缀">
          <el-input 
            v-model="localPreset.systemSuffix" 
            placeholder="例如: \n\n"
            type="textarea"
            :rows="2"
            @input="emitChange"
          />
          <div class="field-hint">系统消息后的序列</div>
        </el-form-item>
      </el-card>

      <!-- 特殊序列 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">特殊序列</span>
        </template>
        
        <el-form-item label="首个输入序列">
          <el-input 
            v-model="localPreset.firstInputSequence" 
            placeholder="第一条用户消息的序列"
            type="textarea"
            :rows="2"
            @input="emitChange"
          />
        </el-form-item>
        
        <el-form-item label="首个输出序列">
          <el-input 
            v-model="localPreset.firstOutputSequence" 
            placeholder="第一条助手消息的序列"
            type="textarea"
            :rows="1"
            @input="emitChange"
          />
        </el-form-item>
        
        <el-form-item label="最后输入序列">
          <el-input 
            v-model="localPreset.lastInputSequence" 
            placeholder="最后一条用户消息的序列（可选）"
            type="textarea"
            :rows="2"
            @input="emitChange"
          />
        </el-form-item>
        
        <el-form-item label="最后输出序列">
          <el-input 
            v-model="localPreset.lastOutputSequence" 
            placeholder="最后一条助手消息的序列（可选）"
            type="textarea"
            :rows="1"
            @input="emitChange"
          />
        </el-form-item>
        
        <el-form-item label="最后系统序列">
          <el-input 
            v-model="localPreset.lastSystemSequence" 
            placeholder="最后一条系统消息的序列（可选）"
            type="textarea"
            :rows="2"
            @input="emitChange"
          />
        </el-form-item>
      </el-card>

      <!-- 停止和对齐 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">停止和对齐</span>
        </template>
        
        <el-form-item label="停止序列">
          <el-input 
            v-model="localPreset.stopSequence" 
            placeholder="例如: \n### "
            @input="emitChange"
          />
          <div class="field-hint">模型生成时的停止标记</div>
        </el-form-item>
        
        <el-form-item label="用户对齐消息">
          <el-input 
            v-model="localPreset.userAlignmentMessage" 
            placeholder="用户对齐消息（可选）"
            type="textarea"
            :rows="2"
            @input="emitChange"
          />
        </el-form-item>
      </el-card>

      <!-- 选项设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">选项设置</span>
        </template>
        
        <el-form-item label="包装消息">
          <el-switch 
            v-model="localPreset.wrap" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否在对话周围添加包装</div>
        </el-form-item>
        
        <el-form-item label="启用宏">
          <el-switch 
            v-model="localPreset.macro" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否处理宏标记</div>
        </el-form-item>
        
        <el-form-item label="绑定到上下文">
          <el-switch 
            v-model="localPreset.bindToContext" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">是否绑定到特定的上下文模板</div>
        </el-form-item>
        
        <el-form-item label="系统指令前缀">
          <el-switch 
            v-model="localPreset.systemInstruction" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">系统消息是否作为指令前缀</div>
        </el-form-item>
        
        <el-form-item label="系统同用户">
          <el-switch 
            v-model="localPreset.systemSameAsUser" 
            active-text="启用"
            inactive-text="禁用"
            @change="emitChange"
          />
          <div class="field-hint">系统消息使用与用户相同的格式</div>
        </el-form-item>
      </el-card>

      <!-- 高级设置 -->
      <el-card class="form-section" shadow="never">
        <template #header>
          <span class="section-title">高级设置</span>
        </template>
        
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
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'

interface InstructPreset {
  id?: string
  name: string
  description?: string
  inputSequence: string
  inputSuffix: string
  outputSequence: string
  outputSuffix: string
  systemSequence: string
  systemSuffix: string
  firstInputSequence: string
  firstOutputSequence: string
  lastInputSequence?: string
  lastOutputSequence?: string
  lastSystemSequence?: string
  stopSequence: string
  userAlignmentMessage?: string
  wrap: boolean
  macro: boolean
  activationRegex: string
  bindToContext?: boolean
  systemInstruction?: boolean
  systemSameAsUser?: boolean
  enabledFor?: string[]
  priority?: number
  [key: string]: any
}

interface Props {
  modelValue: InstructPreset
}

interface Emits {
  (e: 'update:modelValue', value: InstructPreset): void
  (e: 'change'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地副本，避免直接修改 props
const localPreset = reactive<InstructPreset>({
  name: '',
  description: '',
  inputSequence: '',
  inputSuffix: '',
  outputSequence: '',
  outputSuffix: '',
  systemSequence: '',
  systemSuffix: '',
  firstInputSequence: '',
  firstOutputSequence: '',
  lastInputSequence: '',
  lastOutputSequence: '',
  lastSystemSequence: '',
  stopSequence: '',
  userAlignmentMessage: '',
  wrap: false,
  macro: true,
  activationRegex: '',
  bindToContext: false,
  systemInstruction: false,
  systemSameAsUser: false,
  enabledFor: [],
  priority: 0,
  ...props.modelValue
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
.instruct-preset-editor {
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
.instruct-preset-editor::-webkit-scrollbar {
  width: 6px;
}

.instruct-preset-editor::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.instruct-preset-editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.instruct-preset-editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 