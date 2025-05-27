<template>
  <div class="system-settings">
    <h1>系统设置</h1>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>应用偏好设置</span>
        </div>
      </template>

      <el-form :model="appSettings" label-position="top">
        <el-form-item label="主题">
          <el-radio-group v-model="appSettings.theme">
            <el-radio-button label="light">浅色</el-radio-button>
            <el-radio-button label="dark">深色</el-radio-button>
            <el-radio-button label="system">跟随系统</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="语言">
          <el-select v-model="appSettings.language" placeholder="选择语言">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
            <el-option label="日本語" value="ja-JP" />
          </el-select>
        </el-form-item>

        <el-form-item label="字体大小">
          <el-radio-group v-model="appSettings.fontSize">
            <el-radio-button label="small">小</el-radio-button>
            <el-radio-button label="medium">中</el-radio-button>
            <el-radio-button label="large">大</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>数据设置</span>
        </div>
      </template>

      <el-form :model="dataSettings" label-position="top">
        <el-form-item label="本地数据存储位置">
          <el-input 
            v-model="dataSettings.localStoragePath" 
            placeholder="数据存储路径"
            disabled
          >
            <template #append>
              <el-button @click="changeStoragePath">更改</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="自动备份">
          <el-switch v-model="dataSettings.autoBackup" />
        </el-form-item>

        <el-form-item label="备份频率" v-if="dataSettings.autoBackup">
          <el-select v-model="dataSettings.backupFrequency" placeholder="选择备份频率">
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
          </el-select>
        </el-form-item>

        <el-divider />

        <el-form-item>
          <el-button type="primary" @click="backupData">备份数据</el-button>
          <el-button type="warning" @click="restoreData">恢复数据</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>隐私设置</span>
        </div>
      </template>

      <el-form :model="privacySettings" label-position="top">
        <el-form-item label="本地记录对话历史">
          <el-switch v-model="privacySettings.saveConversations" />
        </el-form-item>

        <el-form-item label="使用分析数据收集">
          <el-switch v-model="privacySettings.analytics" />
        </el-form-item>

        <el-form-item label="清除所有对话历史">
          <el-button type="danger" @click="confirmClearHistory">清除历史</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="form-actions">
      <el-button type="primary" @click="saveAllSettings">保存所有设置</el-button>
      <el-button @click="resetAllSettings">重置所有设置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 应用设置
const appSettings = ref({
  theme: 'system',
  language: 'zh-CN',
  fontSize: 'medium'
});

// 数据设置
const dataSettings = ref({
  localStoragePath: '/home/user/LadySion/data',
  autoBackup: true,
  backupFrequency: 'weekly'
});

// 隐私设置
const privacySettings = ref({
  saveConversations: true,
  analytics: false
});

// 保存所有设置
function saveAllSettings() {
  // 实际项目中，这里会调用API保存设置到服务器或本地存储
  ElMessage.success('所有设置已保存');
}

// 重置所有设置
function resetAllSettings() {
  appSettings.value = {
    theme: 'system',
    language: 'zh-CN',
    fontSize: 'medium'
  };
  
  dataSettings.value = {
    localStoragePath: '/home/user/LadySion/data',
    autoBackup: true,
    backupFrequency: 'weekly'
  };
  
  privacySettings.value = {
    saveConversations: true,
    analytics: false
  };
  
  ElMessage.info('所有设置已重置');
}

// 更改存储路径
function changeStoragePath() {
  // 实际项目中，这里会打开文件夹选择对话框
  ElMessage.info('此功能在实际部署环境中会打开文件夹选择对话框');
}

// 备份数据
function backupData() {
  // 实际项目中，这里会触发数据备份流程
  ElMessage.success('数据已成功备份');
}

// 恢复数据
function restoreData() {
  // 实际项目中，这里会打开备份恢复对话框
  ElMessage.info('此功能在实际部署环境中会打开备份恢复对话框');
}

// 确认清除历史
function confirmClearHistory() {
  ElMessageBox.confirm(
    '确定要清除所有对话历史吗？此操作不可逆。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 实际项目中，这里会调用API清除所有对话历史
    ElMessage.success('所有对话历史已清除');
  }).catch(() => {
    ElMessage.info('已取消操作');
  });
}
</script>

<style scoped>
.system-settings {
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