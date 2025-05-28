<template>
  <div class="settings-container">
    <h1>设置</h1>
    
    <el-tabs v-model="activeTab" tab-position="left" class="settings-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="模型设置" name="model">
        <router-view v-if="activeTab === 'model'" />
      </el-tab-pane>
      <el-tab-pane label="系统设置" name="system">
        <router-view v-if="activeTab === 'system'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const activeTab = ref('model');

// 处理标签页变化
function handleTabChange(tab: string) {
  router.push({ name: `${tab}-settings` });
}

// 根据当前路由设置活动标签页
onMounted(() => {
  const currentRoute = route.name as string;
  if (currentRoute.includes('-settings')) {
    activeTab.value = currentRoute.replace('-settings', '');
  }
});

// 监听路由变化，更新激活的标签
watch(() => route.name, (newRouteName) => {
  if (typeof newRouteName === 'string' && newRouteName.includes('-settings')) {
    activeTab.value = newRouteName.replace('-settings', '');
  }
});
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.settings-tabs {
  min-height: 500px;
}

:deep(.el-tabs__item) {
  height: 50px;
  line-height: 50px;
  font-size: 16px;
}

:deep(.el-tabs__nav) {
  min-width: 150px;
}
</style> 