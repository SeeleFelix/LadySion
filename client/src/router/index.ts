import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/characters',
    name: 'characters',
    component: () => import('../views/CharactersView.vue')
  },
  {
    path: '/conversations',
    name: 'conversations',
    component: () => import('../views/ConversationsView.vue')
  },
  {
    path: '/conversation/:id',
    name: 'conversation',
    component: () => import('../views/ConversationView.vue')
  },
  {
    path: '/presets',
    component: () => import('../views/preset/PresetManagementView.vue'),
    children: [
      {
        path: '',
        name: 'presets',
        redirect: { name: 'master-presets' }
      },
      {
        path: 'master',
        name: 'master-presets',
        component: () => import('../views/preset/PresetManagementView.vue')
      },
      {
        path: 'instruct',
        name: 'instruct-presets',
        component: () => import('../views/preset/PresetManagementView.vue')
      },
      {
        path: 'context',
        name: 'context-presets',
        component: () => import('../views/preset/PresetManagementView.vue')
      },
      {
        path: 'system-prompt',
        name: 'system-prompt-presets',
        component: () => import('../views/preset/PresetManagementView.vue')
      }
    ]
  },
  {
    path: '/settings',
    component: () => import('../views/settings/SettingsView.vue'),
    children: [
      {
        path: '',
        name: 'settings',
        redirect: { name: 'model-settings' }
      },
      {
        path: 'model',
        name: 'model-settings',
        component: () => import('../views/settings/ModelSettingsView.vue')
      },
      {
        path: 'system',
        name: 'system-settings',
        component: () => import('../views/settings/SystemSettingsView.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router; 