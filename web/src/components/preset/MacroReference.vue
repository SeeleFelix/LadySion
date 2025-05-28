<template>
  <div class="macro-reference">
    <div class="macro-search">
      <el-input
        v-model="searchText"
        placeholder="搜索宏..."
        size="small"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    
    <div class="macro-categories">
      <div v-for="category in filteredCategories" :key="category.name" class="macro-category">
        <div class="category-header">
          <h4>{{ category.name }}</h4>
          <span class="category-count">{{ category.macros.length }}</span>
        </div>
        
        <div class="macro-list">
          <div v-for="macro in category.macros" :key="macro.name" class="macro-item">
            <div class="macro-header">
              <code class="macro-name">{{ macro.name }}</code>
              <el-button 
                type="text" 
                size="small" 
                @click="copyMacro(macro.name)"
                class="copy-btn"
              >
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
            <div class="macro-description">{{ macro.description }}</div>
            <div v-if="macro.example" class="macro-example">
              <div class="example-label">示例：</div>
              <code class="example-code">{{ macro.example }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, DocumentCopy } from '@element-plus/icons-vue'

interface MacroDescription {
  name: string
  description: string
  syntax?: string
  example?: string
  category?: string
}

interface Props {
  macros?: MacroDescription[]
}

const props = withDefaults(defineProps<Props>(), {
  macros: () => []
})

// 默认宏列表
const defaultMacros = [
  // 基础宏
  { name: '{{char}}', description: '角色名称', example: 'Alice', category: '基础信息' },
  { name: '{{user}}', description: '用户名称', example: 'Bob', category: '基础信息' },
  { name: '{{char_personality}}', description: '角色人格描述', example: '开朗活泼的女孩', category: '角色信息' },
  { name: '{{char_appearance}}', description: '角色外观描述', example: '长发飘飘的美女', category: '角色信息' },
  { name: '{{char_background}}', description: '角色背景故事', example: '来自魔法学院的学生', category: '角色信息' },
  { name: '{{char_speaking_style}}', description: '角色说话风格', example: '温柔且充满关怀', category: '角色信息' },
  
  // 场景信息
  { name: '{{scenario}}', description: '当前场景描述', example: '在图书馆的安静角落', category: '场景信息' },
  { name: '{{systemPrompt}}', description: '系统提示词', example: '你是一个有帮助的助手', category: '场景信息' },
  { name: '{{chatStart}}', description: '对话开始标记', example: '对话开始', category: '场景信息' },
  
  // 时间宏
  { name: '{{date}}', description: '当前日期', example: '2024/01/15', category: '时间信息' },
  { name: '{{time}}', description: '当前时间', example: '14:30:25', category: '时间信息' },
  { name: '{{datetime}}', description: '日期时间', example: '2024/01/15 14:30:25', category: '时间信息' },
  { name: '{{weekday}}', description: '星期几', example: '星期一', category: '时间信息' },
  
  // 随机宏
  { name: '{{random:1,10}}', description: '生成1到10的随机数', example: '7', category: '随机生成' },
  { name: '{{random:选项1,选项2,选项3}}', description: '随机选择一个选项', example: '选项2', category: '随机生成' },
  
  // 系统宏
  { name: '{{model}}', description: '当前模型名称', example: 'gpt-3.5-turbo', category: '系统信息' },
  { name: '{{temperature}}', description: '当前温度设置', example: '0.7', category: '系统信息' },
  
  // 特殊宏
  { name: '{{original}}', description: '原始全局指令（仅在角色覆盖时使用）', example: '原始指令内容', category: '特殊宏' }
]

const searchText = ref('')

// 计算属性
const allMacros = computed(() => {
  return props.macros.length > 0 ? props.macros : defaultMacros
})

const macroCategories = computed(() => {
  const categories = new Map()
  
  allMacros.value.forEach(macro => {
    const categoryName = macro.category || '其他'
    if (!categories.has(categoryName)) {
      categories.set(categoryName, {
        name: categoryName,
        macros: []
      })
    }
    categories.get(categoryName).macros.push(macro)
  })
  
  return Array.from(categories.values())
})

const filteredCategories = computed(() => {
  if (!searchText.value) {
    return macroCategories.value
  }
  
  const query = searchText.value.toLowerCase()
  return macroCategories.value.map(category => ({
    ...category,
    macros: category.macros.filter(macro => 
      macro.name.toLowerCase().includes(query) ||
      macro.description.toLowerCase().includes(query)
    )
  })).filter(category => category.macros.length > 0)
})

// 方法
const copyMacro = async (macroName: string) => {
  try {
    await navigator.clipboard.writeText(macroName)
    ElMessage.success('宏已复制到剪贴板')
  } catch (error) {
    // 兼容性处理
    const textArea = document.createElement('textarea')
    textArea.value = macroName
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('宏已复制到剪贴板')
  }
}
</script>

<style scoped>
.macro-reference {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.macro-search {
  margin-bottom: 16px;
}

.macro-categories {
  flex: 1;
  overflow-y: auto;
}

.macro-category {
  margin-bottom: 20px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid #e4e7ed;
}

.category-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.category-count {
  background-color: #f0f2f5;
  color: #606266;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
}

.macro-list {
  space-y: 12px;
}

.macro-item {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.macro-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.macro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.macro-name {
  background-color: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 500;
}

.copy-btn {
  padding: 4px !important;
  min-height: auto !important;
  color: #409eff !important;
}

.copy-btn:hover {
  background-color: rgba(64, 158, 255, 0.1) !important;
}

.macro-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 6px;
}

.macro-example {
  margin-top: 6px;
}

.example-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}

.example-code {
  background-color: #fff;
  border: 1px solid #d0d7de;
  color: #24292f;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
}

/* 滚动条样式 */
.macro-categories::-webkit-scrollbar {
  width: 6px;
}

.macro-categories::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.macro-categories::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.macro-categories::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 