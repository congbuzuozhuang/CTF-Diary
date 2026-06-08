import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // ... routes (same as before)
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { title: '仪表盘', icon: 'home' }
    },
    {
      path: '/competitions',
      name: 'competitions',
      component: () => import('@/views/Competitions.vue'),
      meta: { title: '比赛管理', icon: 'trophy' }
    },
    {
      path: '/competitions/:id',
      name: 'competition-detail',
      component: () => import('@/views/CompetitionDetail.vue'),
      meta: { title: '比赛详情', icon: 'trophy' }
    },
    {
      path: '/files',
      name: 'files',
      component: () => import('@/views/FileManager.vue'),
      meta: { title: '文件管理', icon: 'folder' }
    },
    {
      path: '/cves',
      name: 'cves',
      component: () => import('@/views/Cves.vue'),
      meta: { title: 'CVE 复现', icon: 'bug' }
    },
    {
      path: '/cves/:id',
      name: 'cve-detail',
      component: () => import('@/views/CveDetail.vue'),
      meta: { title: 'CVE 详情', icon: 'bug' }
    },
    {
      path: '/editor/:type/:id?',
      name: 'editor',
      component: () => import('@/views/Editor.vue'),
      meta: { title: '编辑器', icon: 'edit' }
    },
    {
      path: '/diary',
      name: 'diary',
      component: () => import('@/views/Diary.vue'),
      meta: { title: '日志打卡', icon: 'calendar' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置', icon: 'settings' }
    }
  ]
})

// Unsaved tabs guard
router.beforeEach((to, from) => {
  // Only guard when navigating away from editor
  if (from.name === 'editor' && to.name !== 'editor') {
    try {
      const { useEditorTabsStore } = require('@/stores/editorTabs')
      const store = useEditorTabsStore()
      if (store.hasUnsaved()) {
        return window.confirm('有未保存的编辑器标签页，确定离开吗？')
      }
    } catch { /* store not available yet, allow navigation */ }
  }
  return true
})

export default router
