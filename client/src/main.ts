import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 导入统一的样式系统
import '@/styles/index.css';

import router from './router';
import { pinia } from '@/stores';
import App from './App.vue';

const app = createApp(App);

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 使用 Pinia 状态管理
app.use(pinia);

// 使用 Element Plus
app.use(ElementPlus);

// 使用 Vue Router
app.use(router);

app.mount('#app'); 