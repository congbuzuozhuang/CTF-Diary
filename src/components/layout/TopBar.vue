<template>
  <header
    class="topbar fixed top-0 right-0 z-20 flex items-center justify-between px-4 h-[var(--topbar-height)] border-b border-[var(--border-color)] transition-all duration-300"
    :style="{ left: collapsed ? '64px' : '240px' }"
  >
    <!-- Left: Draggable title area -->
    <div class="flex-1 flex items-center gap-3 drag-region">
      <h1 class="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
        {{ currentTitle }}
      </h1>
    </div>

    <!-- Right: Checkin status + Window controls -->
    <div class="flex items-center gap-1 no-drag">
      <!-- Today's checkin status -->
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-xs mr-2">
        <span class="w-2 h-2 rounded-full" :class="checkedIn ? 'bg-green-500' : 'bg-slate-400'"></span>
        <span class="text-[var(--text-secondary)]">{{ checkedIn ? '今日已打卡' : '今日未打卡' }}</span>
      </div>

      <!-- Window controls -->
      <button
        class="win-btn group"
        @click="minimize"
        title="最小化"
      >
        <svg class="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" viewBox="0 0 12 12">
          <rect x="1" y="5.5" width="10" height="1" fill="currentColor"/>
        </svg>
      </button>
      <button
        class="win-btn group"
        @click="toggleMaximize"
        :title="isMax ? '还原' : '最大化'"
      >
        <svg v-if="!isMax" class="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" viewBox="0 0 12 12">
          <rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <svg v-else class="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" viewBox="0 0 12 12">
          <rect x="2" y="0.5" width="8" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <rect x="0.5" y="2" width="8" height="8" rx="1" fill="var(--bg-primary)" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </button>
      <button
        class="win-btn win-btn-close group"
        @click="closeWindow"
        title="关闭"
      >
        <svg class="w-3 h-3 text-[var(--text-muted)] group-hover:text-white" viewBox="0 0 12 12">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted, type Ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed', ref(false))
const checkedIn = ref(false)
const isMax = ref(false)

const currentTitle = computed(() => {
  return (route.meta?.title as string) || 'CTF Diary'
})

async function minimize() {
  await window.api.window.minimize()
}

async function toggleMaximize() {
  await window.api.window.maximize()
  checkMaxState()
}

async function closeWindow() {
  await window.api.window.close()
}

async function checkMaxState() {
  try {
    isMax.value = await window.api.window.isMaximized()
  } catch { /* ignore */ }
}

// Poll maximize state since Electron doesn't emit events for it reliably
let interval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  checkMaxState()
  interval = setInterval(checkMaxState, 500)
})
onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.topbar {
  background: var(--card-bg);
  backdrop-filter: blur(16px);
}

.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}

.win-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-md transition-colors;
}

.win-btn:hover {
  background: var(--bg-tertiary);
}

.win-btn-close:hover {
  background: #ef4444;
}
</style>
