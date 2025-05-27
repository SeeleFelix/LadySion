import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/silly-tavern-theme.css';
import './assets/design-system.css';
import './style.css';
import router from './router';
import { pinia } from './store';
import App from './App.vue';

const app = createApp(App);

// 使用 Pinia 状态管理
app.use(pinia);

// 使用 Element Plus
app.use(ElementPlus);

// 使用 Vue Router
app.use(router);

app.mount('#app'); 