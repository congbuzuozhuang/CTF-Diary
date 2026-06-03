<template>
  <div class="competitions animate-fade-in space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">🏆 比赛管理</h2>
        <p class="text-[var(--text-secondary)] mt-1 text-sm">管理 CTF 比赛信息，从 CTFtime 获取最新赛事</p>
      </div>
      <button
        class="btn-primary"
        :disabled="store.fetchingCtftime"
        @click="handleFetchCtftime"
      >
        <span class="flex items-center gap-2">
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': store.fetchingCtftime }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ store.fetchingCtftime ? '获取中...' : '从 CTFtime 获取' }}
        </span>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-4 border-b border-[var(--border-color)]">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-[1px]"
        :class="activeTab === tab.key
          ? 'text-blue-400 border-blue-400'
          : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-[var(--bg-tertiary)]"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <svg class="w-6 h-6 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredList.length === 0"
      class="text-sm text-[var(--text-muted)] text-center py-12"
    >
      <template v-if="activeTab === 'ctftime'">
        暂无比赛数据 — 点击上方按钮从 CTFtime 获取最新赛事
      </template>
      <template v-else-if="activeTab === 'participating'">
        还没有参加任何比赛 — 在 CTFtime 赛事中找到感兴趣的比赛并点击「参加」
      </template>
      <template v-else>
        暂无已结束的比赛
      </template>
    </div>

    <!-- Competition cards -->
    <div v-else class="space-y-3">
      <div
        v-for="comp in filteredList"
        :key="comp.id"
        class="card group cursor-pointer hover:border-[var(--border-hover)] transition-colors"
        @click="$router.push(`/competitions/${comp.id}`)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Title row -->
            <div class="flex items-center gap-2 mb-1.5">
              <h3 class="font-semibold text-[15px] truncate">{{ comp.name }}</h3>
              <a
                v-if="comp.url"
                :href="comp.url"
                class="shrink-0 text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                @click.stop
                target="_blank"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>

            <!-- Meta row -->
            <div class="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                {{ formatDate(comp.start_date) }}
              </span>
              <span v-if="comp.end_date" class="text-[var(--text-muted)]">→</span>
              <span v-if="comp.end_date" class="flex items-center gap-1">
                {{ formatDate(comp.end_date) }}
              </span>
            </div>

            <!-- Duration row -->
            <div v-if="comp.start_date && comp.end_date" class="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ getDuration(comp.start_date, comp.end_date) }}
            </div>
          </div>

          <!-- Right side: badges + action -->
          <div class="flex items-center gap-2 shrink-0">
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="formatBadgeClass(comp.format)"
            >
              {{ comp.format || 'Unknown' }}
            </span>
            <span
              v-if="comp.weight > 0"
              class="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/15 text-yellow-400"
            >
              {{ comp.weight.toFixed(1) }}
            </span>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="statusBadgeClass(comp.status)"
            >
              {{ statusLabel(comp.status) }}
            </span>
          </div>
        </div>

        <!-- Action bar -->
        <div
          v-if="comp.status !== 'participating' && comp.status !== 'finished'"
          class="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-2"
        >
          <button
            class="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-500/15 text-blue-400
                   hover:bg-blue-500/25 transition-colors"
            @click.stop="handleParticipate(comp)"
          >
            📋 参加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompetitionsStore } from '@/stores/competitions'
import type { Competition } from '@/types'

const store = useCompetitionsStore()

const activeTab = ref<'ctftime' | 'participating' | 'finished'>('ctftime')

const tabs = computed(() => [
  { key: 'ctftime' as const, label: 'CTFtime 赛事', count: store.competitions.length },
  { key: 'participating' as const, label: '我参加的', count: store.participating.length },
  { key: 'finished' as const, label: '已结束', count: store.finished.length }
])

const filteredList = computed(() => {
  let list: Competition[]
  switch (activeTab.value) {
    case 'participating':
      list = store.participating
      break
    case 'finished':
      list = store.finished
      break
    default:
      // CTFtime tab shows all (upcoming + running)
      list = store.competitions.filter(c => c.status === 'upcoming' || c.status === 'running')
      break
  }
  // Sort by start_date ascending — nearest competition first
  return [...list].sort((a, b) => {
    if (!a.start_date) return 1
    if (!b.start_date) return -1
    return a.start_date.localeCompare(b.start_date)
  })
})

onMounted(() => {
  store.loadList()
})

async function handleFetchCtftime() {
  try {
    await store.fetchFromCtftime()
  } catch {
    // Error already logged in store
  }
}

async function handleParticipate(comp: Competition) {
  await store.participate(comp.id)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDuration(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return ''
  const start = new Date(startStr)
  const end = new Date(endStr)
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.round(diffMs / 3600000)
  if (hours < 24) return `${hours} 小时`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `${days} 天 ${remainHours} 小时` : `${days} 天`
}

function formatBadgeClass(format: string): string {
  const map: Record<string, string> = {
    'Jeopardy': 'bg-green-500/15 text-green-400',
    'Attack-Defense': 'bg-red-500/15 text-red-400',
    'Mixed': 'bg-purple-500/15 text-purple-400'
  }
  return map[format] || 'bg-gray-500/15 text-gray-400'
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'upcoming': 'bg-blue-500/15 text-blue-400',
    'running': 'bg-green-500/15 text-green-400',
    'participating': 'bg-purple-500/15 text-purple-400',
    'finished': 'bg-gray-500/15 text-gray-400'
  }
  return map[status] || 'bg-gray-500/15 text-gray-400'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    'upcoming': '即将开始',
    'running': '进行中',
    'participating': '已参加',
    'finished': '已结束'
  }
  return map[status] || status
}
</script>
