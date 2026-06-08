<template>
  <div class="dashboard animate-fade-in space-y-6">
    <!-- Welcome header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">概览</h2>
        <p class="text-[var(--text-secondary)] mt-1 text-sm">
          {{ greeting }}
        </p>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold">{{ diaryStore.stats.streakDays }}</p>
            <p class="text-xs text-[var(--text-secondary)]">连续打卡天数</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold">{{ diaryStore.stats.totalDays }}</p>
            <p class="text-xs text-[var(--text-secondary)]">总打卡天数</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold">{{ compStore.participating.length }}</p>
            <p class="text-xs text-[var(--text-secondary)]">参加的比赛</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold">{{ compStore.upcoming.length }}</p>
            <p class="text-xs text-[var(--text-secondary)]">近期比赛</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick checkin -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold">今日打卡</h3>
          <p class="text-xs text-[var(--text-secondary)] mt-0.5">{{ today }}</p>
        </div>
        <button
          class="btn-primary"
          :disabled="checkedIn"
          @click="handleCheckin"
        >
          {{ checkedIn ? '已打卡' : '打卡' }}
        </button>
      </div>
    </div>

    <!-- Upcoming competitions -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold">近期比赛</h3>
        <router-link to="/competitions" class="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          查看全部 →
        </router-link>
      </div>

      <div v-if="sortedUpcoming.length > 0" class="space-y-2">
        <div
          v-for="comp in sortedUpcoming.slice(0, 5)"
          :key="comp.id"
          class="card flex items-center justify-between cursor-pointer hover:border-[var(--border-hover)] transition-colors"
          @click="$router.push(`/competitions/${comp.id}`)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <svg class="w-5 h-5 shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">{{ comp.name }}</p>
              <p class="text-xs text-[var(--text-muted)]">
                {{ formatDate(comp.start_date) }}
                <span v-if="comp.format" class="ml-2">· {{ comp.format }}</span>
              </p>
            </div>
          </div>
          <button class="btn-ghost text-xs shrink-0 ml-2" @click.stop="handleParticipate(comp.id)">
            参加
          </button>
        </div>
      </div>

      <div v-else class="card text-center py-6">
        <p class="text-sm text-[var(--text-muted)]">
          暂无数据 — 前往「比赛管理」从 CTFtime 获取最新赛事
        </p>
        <router-link to="/competitions" class="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">
          前往比赛管理 →
        </router-link>
      </div>
    </div>

    <!-- Quick links -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <router-link to="/files" class="card flex items-center gap-3 py-3 hover:border-[var(--border-hover)] transition-colors">
        <div class="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium">文件管理</p>
          <p class="text-xs text-[var(--text-muted)]">管理附件</p>
        </div>
      </router-link>

      <router-link to="/diary" class="card flex items-center gap-3 py-3 hover:border-[var(--border-hover)] transition-colors">
        <div class="w-9 h-9 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium">日志打卡</p>
          <p class="text-xs text-[var(--text-muted)]">记录学习</p>
        </div>
      </router-link>

      <router-link to="/editor/markdown" class="card flex items-center gap-3 py-3 hover:border-[var(--border-hover)] transition-colors">
        <div class="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium">编辑器</p>
          <p class="text-xs text-[var(--text-muted)]">写作 & 脚本</p>
        </div>
      </router-link>

      <router-link to="/settings" class="card flex items-center gap-3 py-3 hover:border-[var(--border-hover)] transition-colors">
        <div class="w-9 h-9 rounded-lg bg-gray-500/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium">设置</p>
          <p class="text-xs text-[var(--text-muted)]">个性化</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { useCompetitionsStore } from '@/stores/competitions'

const diaryStore = useDiaryStore()
const compStore = useCompetitionsStore()

const today = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
})

const checkedIn = ref(false)

const sortedUpcoming = computed(() =>
  [...compStore.upcoming].sort((a, b) => {
    if (!a.start_date) return 1
    if (!b.start_date) return -1
    return a.start_date.localeCompare(b.start_date)
  })
)

const greeting = ref(getGreeting())

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了，注意休息'
}

onMounted(async () => {
  // Load diary stats
  await diaryStore.loadStats()

  // Load competitions
  await compStore.loadList()

  // Check today's checkin
  const todayStr = new Date().toISOString().split('T')[0]
  checkedIn.value = diaryStore.checkinDates.has(todayStr)
})

async function handleCheckin() {
  const todayStr = new Date().toISOString().split('T')[0]
  await diaryStore.checkIn(todayStr, '', [], '')
  checkedIn.value = true
  await diaryStore.loadStats()
}

async function handleParticipate(id: number) {
  await compStore.participate(id)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>
