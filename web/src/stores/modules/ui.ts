import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useUIStore = defineStore("ui", () => {
  // 状态
  const theme = ref<"light" | "dark">("light");
  const sidebarCollapsed = ref(false);
  const loading = ref(false);

  // 计算属性
  const isDark = computed(() => theme.value === "dark");
  const isLight = computed(() => theme.value === "light");

  // 操作方法
  /**
   * 切换主题
   */
  const toggleTheme = () => {
    theme.value = theme.value === "light" ? "dark" : "light";
    // 可以在这里添加本地存储逻辑
    localStorage.setItem("theme", theme.value);
  };

  /**
   * 设置主题
   */
  const setTheme = (newTheme: "light" | "dark") => {
    theme.value = newTheme;
    localStorage.setItem("theme", newTheme);
  };

  /**
   * 切换侧边栏状态
   */
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.value.toString());
  };

  /**
   * 设置侧边栏状态
   */
  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed;
    localStorage.setItem("sidebarCollapsed", collapsed.toString());
  };

  /**
   * 设置全局加载状态
   */
  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
  };

  /**
   * 初始化UI状态（从本地存储恢复）
   */
  const initializeUI = () => {
    // 恢复主题设置
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      theme.value = savedTheme;
    }

    // 恢复侧边栏状态
    const savedSidebarState = localStorage.getItem("sidebarCollapsed");
    if (savedSidebarState) {
      sidebarCollapsed.value = savedSidebarState === "true";
    }
  };

  return {
    // 状态
    theme,
    sidebarCollapsed,
    loading,
    // 计算属性
    isDark,
    isLight,
    // 方法
    toggleTheme,
    setTheme,
    toggleSidebar,
    setSidebarCollapsed,
    setLoading,
    initializeUI,
  };
});
