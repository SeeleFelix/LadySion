<template>
  <el-dialog
    v-model="visible"
    title="创建预设"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="预设类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择预设类型" style="width: 100%">
          <el-option label="指令预设" value="instruct" />
          <el-option label="上下文预设" value="context" />
          <el-option label="系统提示词" value="systemPrompt" />
          <el-option label="历史后指令" value="postHistoryInstructions" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="预设名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入预设名称" />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入预设描述（可选）"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', preset: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const visible = ref(false)

const form = reactive({
  type: '',
  name: '',
  description: ''
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择预设类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入预设名称', trigger: 'blur' }]
}

watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
  },
  { immediate: true }
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  form.type = ''
  form.name = ''
  form.description = ''
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      const preset = {
        type: form.type,
        name: form.name,
        description: form.description,
        content: '',
        id: `${Date.now()}`
      }
      
      emit('created', preset)
      ElMessage.success('预设创建成功')
      handleClose()
    }
  })
}
</script> 