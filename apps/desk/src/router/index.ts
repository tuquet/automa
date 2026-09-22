import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/studio',
    },
    {
      path: '/studio',
      name: 'studio',
      component: () => import('../features/studio/StudioView.vue'),
    },
    {
      path: '/browsers',
      name: 'browsers',
      component: () => import('../features/browsers/BrowsersView.vue'),
    },
    {
      path: '/storage',
      name: 'storage',
      component: () => import('../features/storage/StorageView.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../features/history/HistoryView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../features/settings/SettingsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/studio',
    },
  ],
})

export default router
