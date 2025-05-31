import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

// 导入FontAwesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCog,
  faComments,
  faDownload,
  faEdit,
  faPalette,
  faPaperPlane,
  faRedo,
  faSlidersH,
  faTrash,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

// 添加图标到库
library.add(
  faPalette,
  faChevronDown,
  faCheck,
  faSlidersH,
  faChevronLeft,
  faChevronRight,
  faCog,
  faDownload,
  faTrash,
  faComments,
  faEdit,
  faRedo,
  faPaperPlane,
  faUser,
);

// 导入统一的样式系统
import "@/styles/index.css";

import router from "./router";
import { pinia } from "@/stores";
import App from "./App.vue";

const app = createApp(App);

// 注册FontAwesome组件
app.component("font-awesome-icon", FontAwesomeIcon);

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

app.mount("#app");
