<template>
  <aside
    class="sidebar fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300"
    :class="collapsed ? 'w-[64px]' : 'w-[240px]'"
  >
    <!-- Logo -->
    <div class="flex items-center h-[var(--topbar-height)] px-4 border-b border-[var(--border-color)] shrink-0">
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <span class="text-white font-bold text-sm">C</span>
        </div>
        <span
          class="font-bold text-sm whitespace-nowrap transition-opacity duration-300"
          :class="collapsed ? 'opacity-0 w-0' : 'opacity-100'"
        >CTF Diary</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
               text-[var(--text-secondary)] hover:text-[var(--text-primary)]
               hover:bg-[var(--bg-tertiary)] transition-all duration-200"
        :class="{ 'router-link-active': isActive(item) }"
        :title="collapsed ? item.title : ''"
      >
        <span class="icon w-5 h-5 flex items-center justify-center shrink-0" v-html="item.icon"></span>
        <span
          class="whitespace-nowrap transition-opacity duration-300"
          :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
        >{{ item.title }}</span>
      </router-link>
    </nav>

    <!-- Collapse toggle -->
    <div class="border-t border-[var(--border-color)] p-2">
      <button
        class="w-full flex items-center justify-center p-2 rounded-lg
               text-[var(--text-muted)] hover:text-[var(--text-primary)]
               hover:bg-[var(--bg-tertiary)] transition-all duration-200"
        @click="toggleCollapse"
      >
        <svg class="w-4 h-4 transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, provide, readonly } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const collapsed = ref(false)

// Expose collapsed state to parent and TopBar
provide('sidebarCollapsed', readonly(collapsed))

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

const navItems = [
  { path: '/', title: '仪表盘', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>' },
  { path: '/competitions', title: '比赛管理', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>' },
  { path: '/files', title: '文件管理', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>' },
  { path: '/cves', title: 'CVE 复现', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' },
  { path: '/diary', title: '日志打卡', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' },
  { path: '/settings', title: '设置', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' }
]

function isActive(item: typeof navItems[0]): boolean {
  if (item.path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(item.path)
}
</script>

<style scoped>
.sidebar {
  background: var(--card-bg);
  backdrop-filter: blur(16px);
  border-right: 1px solid var(--border-color);
}

.router-link-active {
  background: rgba(59, 130, 246, 0.12) !important;
  color: #3b82f6 !important;
}
</style>
