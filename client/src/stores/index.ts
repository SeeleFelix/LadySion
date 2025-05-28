import { createPinia } from 'pinia'

// 创建 Pinia 实例
export const pinia = createPinia()

// 导出所有 stores
export { useCharacterStore } from '@/stores/modules/character'
export { useConversationStore } from '@/stores/modules/conversation'
export { useUIStore } from '@/stores/modules/ui'

// 导出composables中的preset store
export { usePresetStore } from '@/composables/usePresets' 