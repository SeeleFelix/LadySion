import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(".", "src"),
      "@web": resolve(".", "src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  optimizeDeps: {
    include: [
      "vue",
      "vue-router", 
      "pinia",
      "element-plus",
      "@element-plus/icons-vue",
      "@fortawesome/fontawesome-svg-core",
      "@fortawesome/free-solid-svg-icons", 
      "@fortawesome/vue-fontawesome",
      "axios"
    ],
  },
}); 