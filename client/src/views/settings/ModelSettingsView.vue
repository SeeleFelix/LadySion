<template>
  <div class="model-settings">
    <h1>模型设置</h1>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>AI模型配置</span>
        </div>
      </template>

      <el-form :model="modelSettings" label-position="top">
        <el-form-item label="模型提供商">
          <el-select v-model="modelSettings.provider" placeholder="选择模型提供商">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="本地模型" value="local" />
          </el-select>
        </el-form-item>

        <el-form-item label="API密钥" v-if="['openai', 'anthropic'].includes(modelSettings.provider)">
          <el-input 
            v-model="modelSettings.apiKey" 
            placeholder="输入API密钥" 
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item label="模型" v-if="modelSettings.provider === 'openai'">
          <el-select v-model="modelSettings.modelName" placeholder="选择模型">
            <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
            <el-option label="GPT-4o" value="gpt-4o" />
            <el-option label="GPT-4 Turbo" value="gpt-4-turbo" />
          </el-select>
        </el-form-item>

        <el-form-item label="模型" v-else-if="modelSettings.provider === 'anthropic'">
          <el-select v-model="modelSettings.modelName" placeholder="选择模型">
            <el-option label="Claude 3 Haiku" value="claude-3-haiku-20240307" />
            <el-option label="Claude 3 Sonnet" value="claude-3-sonnet-20240229" />
            <el-option label="Claude 3 Opus" value="claude-3-opus-20240229" />
          </el-select>
        </el-form-item>

        <el-form-item label="模型地址" v-else-if="modelSettings.provider === 'local'">
          <el-input 
            v-model="modelSettings.endpoint" 
            placeholder="例如: http://localhost:1234/v1/chat/completions"
          ></el-input>
        </el-form-item>

        <el-form-item label="模型名称" v-if="modelSettings.provider === 'local'">
          <el-input 
            v-model="modelSettings.modelName" 
            placeholder="例如: llama3:8b"
          ></el-input>
        </el-form-item>
      </el-form>

      <el-divider>生成参数</el-divider>

      <el-form :model="generationParams" label-position="top">
        <el-form-item label="温度">
          <el-slider 
            v-model="generationParams.temperature" 
            :min="0" 
            :max="2" 
            :step="0.1" 
            show-input
          ></el-slider>
        </el-form-item>

        <el-form-item label="Top-P (核采样)">
          <el-slider 
            v-model="generationParams.topP" 
            :min="0" 
            :max="1" 
            :step="0.05" 
            show-input
          ></el-slider>
        </el-form-item>

        <el-form-item label="随机性">
          <el-radio-group v-model="generationParams.creativity">
            <el-radio-button label="low">低</el-radio-button>
            <el-radio-button label="medium">中</el-radio-button>
            <el-radio-button label="high">高</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="最大回复长度">
          <el-input-number 
            v-model="generationParams.maxTokens" 
            :min="100" 
            :max="16000" 
            :step="100"
          ></el-input-number>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
        <el-button @click="resetSettings">重置</el-button>
        <el-button type="success" @click="testConnection">测试连接</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 模型设置
const modelSettings = ref({
  provider: 'openai',
  apiKey: '',
  modelName: 'gpt-3.5-turbo',
  endpoint: 'http://localhost:1234/v1/chat/completions'
});

// 生成参数
const generationParams = ref({
  temperature: 0.7,
  topP: 0.9,
  creativity: 'medium',
  maxTokens: 2000
});

// 保存设置
function saveSettings() {
  // 实际项目中，这里会调用API保存设置到服务器
  ElMessage.success('设置已保存');
}

// 重置设置
function resetSettings() {
  modelSettings.value = {
    provider: 'openai',
    apiKey: '',
    modelName: 'gpt-3.5-turbo',
    endpoint: 'http://localhost:1234/v1/chat/completions'
  };
  
  generationParams.value = {
    temperature: 0.7,
    topP: 0.9,
    creativity: 'medium',
    maxTokens: 2000
  };
  
  ElMessage.info('设置已重置');
}

// 测试连接
function testConnection() {
  // 实际项目中，这里会调用API测试与AI服务提供商的连接
  if (!modelSettings.value.apiKey && ['openai', 'anthropic'].includes(modelSettings.value.provider)) {
    ElMessage.error('请输入API密钥');
    return;
  }
  
  ElMessage.success('连接测试成功');
}
</script>

<style scoped>
.model-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.settings-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style> 