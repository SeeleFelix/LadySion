<template>
  <div class="preset-preview">
    <div v-if="preset" class="preview-content">
      <div class="preview-header">
        <h4>{{ preset.name }}</h4>
        <el-tag size="small" :type="getTypeColor(presetType)">
          {{ getTypeLabel(presetType) }}
        </el-tag>
      </div>
      
      <div class="preview-body">
        <div class="preview-section" v-if="preset.description">
          <div class="section-title">描述</div>
          <div class="section-content">{{ preset.description }}</div>
        </div>
        
        <!-- 指令模式预设预览 -->
        <template v-if="presetType === 'instruct'">
          <div class="preview-section">
            <div class="section-title">输入格式</div>
            <div class="section-content code">
              {{ preset.inputSequence }}[用户消息]{{ preset.inputSuffix }}
            </div>
          </div>
          <div class="preview-section">
            <div class="section-title">输出格式</div>
            <div class="section-content code">
              {{ preset.outputSequence }}[助手回复]{{ preset.outputSuffix }}
            </div>
          </div>
        </template>
        
        <!-- 系统提示词预设预览 -->
        <template v-else-if="presetType === 'systemPrompt'">
          <div class="preview-section">
            <div class="section-title">提示词内容</div>
            <div class="section-content">{{ processContent(preset.content) }}</div>
          </div>
        </template>
        
        <!-- 后历史指令预设预览 -->
        <template v-else-if="presetType === 'postHistoryInstructions'">
          <div class="preview-section">
            <div class="section-title">指令内容</div>
            <div class="section-content">{{ processContent(preset.content) }}</div>
          </div>
          <div class="preview-section">
            <div class="section-title">插入位置</div>
            <div class="section-content">
              {{ getInsertionPositionLabel(preset.insertionPosition) }}
            </div>
          </div>
        </template>
        
        <!-- 上下文模板预设预览 -->
        <template v-else-if="presetType === 'context'">
          <div class="preview-section">
            <div class="section-title">模板内容</div>
            <div class="section-content">{{ processContent(preset.contextTemplate) }}</div>
          </div>
        </template>
        
        <!-- 通用设置 -->
        <div class="preview-section" v-if="preset.enabled !== undefined">
          <div class="section-title">状态</div>
          <div class="section-content">
            <el-tag :type="preset.enabled ? 'success' : 'danger'" size="small">
              {{ preset.enabled ? '已启用' : '已禁用' }}
            </el-tag>
          </div>
        </div>
        
        <div class="preview-section" v-if="preset.priority">
          <div class="section-title">优先级</div>
          <div class="section-content">{{ preset.priority }}</div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-preview">
      <el-empty description="请选择一个预设查看预览" size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  preset: any
  presetType: string
  macros?: any[]
}

const props = defineProps<Props>()

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labels = {
    instruct: '指令模式',
    context: '上下文模板', 
    systemPrompt: '系统提示词',
    postHistoryInstructions: '后历史指令'
  }
  return labels[type as keyof typeof labels] || type
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colors = {
    instruct: 'primary',
    context: 'success',
    systemPrompt: 'warning', 
    postHistoryInstructions: 'info'
  }
  return colors[type as keyof typeof colors] || 'default'
}

// 获取插入位置标签
const getInsertionPositionLabel = (position: string) => {
  const labels = {
    end: '末尾',
    before_last: '倒数第二条消息前',
    custom: '自定义位置'
  }
  return labels[position as keyof typeof labels] || position
}

// 处理内容（简单的宏预览）
const processContent = (content: string) => {
  if (!content) return '（暂无内容）'
  
  // 如果内容太长，截断显示
  if (content.length > 200) {
    return content.substring(0, 200) + '...'
  }
  
  return content
}
</script>

<style scoped>
.preset-preview {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.preview-content {
  background: white;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.preview-body {
  space-y: 16px;
}

.preview-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 6px;
}

.section-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
  word-break: break-word;
}

.section-content.code {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
}

.empty-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 滚动条样式 */
.preset-preview::-webkit-scrollbar {
  width: 6px;
}

.preset-preview::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.preset-preview::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.preset-preview::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 