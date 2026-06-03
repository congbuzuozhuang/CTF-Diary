<template>
  <div v-if="competition" class="competition-detail animate-fade-in space-y-6">
    <!-- Header bar -->
    <div class="flex items-center gap-4">
      <router-link to="/competitions" class="btn-ghost w-8 h-8 flex items-center justify-center rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold truncate">{{ competition.name }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="competition.status !== 'participating' && competition.status !== 'finished'"
          class="btn-primary text-sm"
          @click="handleParticipate"
        >
          📋 参加比赛
        </button>
        <span
          v-else-if="competition.status === 'participating'"
          class="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/15 text-purple-400"
        >
          ✅ 已参加
        </span>
        <a
          v-if="competition.url"
          :href="competition.url"
          target="_blank"
          class="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-blue-400 transition-colors"
        >
          CTFtime ↗
        </a>
      </div>
    </div>

    <!-- Competition info cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card py-3">
        <p class="text-xs text-[var(--text-muted)] mb-1">日期</p>
        <p class="text-sm font-medium">{{ formatDateRange(competition.start_date, competition.end_date) }}</p>
      </div>
      <div class="card py-3">
        <p class="text-xs text-[var(--text-muted)] mb-1">时长</p>
        <p class="text-sm font-medium">{{ getDuration(competition.start_date, competition.end_date) }}</p>
      </div>
      <div class="card py-3">
        <p class="text-xs text-[var(--text-muted)] mb-1">赛制</p>
        <p class="text-sm font-medium">{{ competition.format || '—' }}</p>
      </div>
      <div class="card py-3">
        <p class="text-xs text-[var(--text-muted)] mb-1">权重</p>
        <p class="text-sm font-medium">{{ competition.weight > 0 ? competition.weight.toFixed(1) : '—' }}</p>
      </div>
    </div>

    <!-- Status & dates timeline -->
    <div class="card py-3">
      <div class="flex items-center gap-6 text-sm">
        <div>
          <span class="text-[var(--text-muted)]">开始：</span>
          <span class="font-mono">{{ formatFullDate(competition.start_date) }}</span>
        </div>
        <div>
          <span class="text-[var(--text-muted)]">结束：</span>
          <span class="font-mono">{{ formatFullDate(competition.end_date) }}</span>
        </div>
        <div>
          <span class="text-[var(--text-muted)]">状态：</span>
          <span :class="statusBadgeClass(competition.status)">
            {{ statusLabel(competition.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- File sections (only visible when participating) -->
    <div v-if="competition.status === 'participating' && competition.directory">
      <div class="flex items-center gap-2 mb-4">
        <h3 class="font-semibold text-lg">📁 附件与笔记</h3>
        <span class="text-xs text-[var(--text-muted)] font-mono">{{ competition.directory }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- PWN section -->
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <h4 class="font-semibold text-sm">PWN</h4>
            </div>
            <span class="text-xs text-[var(--text-muted)]">{{ fileCounts.pwn }} 文件</span>
          </div>
          <div v-if="pwnFiles.length === 0" class="text-xs text-[var(--text-muted)] py-2">
            暂无附件 — 拖拽文件到此处或使用文件管理器导入
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="file in pwnFiles"
              :key="file.path"
              class="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group/file"
            >
              <svg class="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="truncate flex-1">{{ file.name }}</span>
              <span class="text-[var(--text-muted)] shrink-0 opacity-0 group-hover/file:opacity-100">
                {{ formatSize(file.size) }}
              </span>
            </div>
          </div>
        </div>

        <!-- RE section -->
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
              </div>
              <h4 class="font-semibold text-sm">RE</h4>
            </div>
            <span class="text-xs text-[var(--text-muted)]">{{ fileCounts.re }} 文件</span>
          </div>
          <div v-if="reFiles.length === 0" class="text-xs text-[var(--text-muted)] py-2">
            暂无附件 — 拖拽文件到此处或使用文件管理器导入
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="file in reFiles"
              :key="file.path"
              class="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group/file"
            >
              <svg class="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="truncate flex-1">{{ file.name }}</span>
              <span class="text-[var(--text-muted)] shrink-0 opacity-0 group-hover/file:opacity-100">
                {{ formatSize(file.size) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Notes section -->
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <h4 class="font-semibold text-sm">笔记</h4>
            </div>
            <span class="text-xs text-[var(--text-muted)]">{{ fileCounts.notes }} 文件</span>
          </div>
          <div v-if="notesFiles.length === 0" class="text-xs text-[var(--text-muted)] py-2">
            暂无笔记 — 点击新建或在编辑器中创建 .md 文件
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="file in notesFiles"
              :key="file.path"
              class="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group/file"
              @click="openInEditor(file)"
            >
              <svg class="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="truncate flex-1">{{ file.name }}</span>
              <span class="text-blue-400 text-xs shrink-0 opacity-0 group-hover/file:opacity-100">
                编辑 ↗
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not participating hint -->
    <div v-else class="card text-center py-8">
      <div class="text-4xl mb-3">📋</div>
      <p class="text-sm text-[var(--text-secondary)] mb-1">尚未参加此比赛</p>
      <p class="text-xs text-[var(--text-muted)] mb-4">参加后将自动创建 PWN / RE / 笔记 目录结构</p>
      <button
        v-if="competition.status !== 'finished'"
        class="btn-primary"
        @click="handleParticipate"
      >
        参加此比赛
      </button>
    </div>
  </div>

  <!-- Loading / Not found -->
  <div v-else-if="loading" class="flex items-center justify-center py-20">
    <svg class="w-6 h-6 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
  <div v-else class="text-center py-20 text-[var(--text-muted)] text-sm">
    比赛未找到
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompetitionsStore } from '@/stores/competitions'
import type { Competition, FileEntry } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useCompetitionsStore()

const loading = ref(true)
const competition = ref<Competition | null>(null)
const dirFiles = ref<Record<string, FileEntry[]>>({ pwn: [], re: [], notes: [] })

const pwnFiles = computed(() => dirFiles.value.pwn)
const reFiles = computed(() => dirFiles.value.re)
const notesFiles = computed(() => dirFiles.value.notes)

const fileCounts = computed(() => ({
  pwn: pwnFiles.value.length,
  re: reFiles.value.length,
  notes: notesFiles.value.length
}))

onMounted(async () => {
  await loadCompetition()
})

watch(() => route.params.id, async () => {
  await loadCompetition()
})

async function loadCompetition() {
  loading.value = true
  const id = Number(route.params.id)

  try {
    // Try IPC detail first
    const detail = await window.api.competitions.getDetail(id)
    if (detail) {
      competition.value = detail
    } else {
      // Fall back to store
      competition.value = store.getById(id) || null
    }

    // Load directory files if participating
    if (competition.value?.directory) {
      await loadDirectoryFiles(competition.value.directory)
    }
  } catch {
    competition.value = store.getById(id) || null
  } finally {
    loading.value = false
  }
}

async function loadDirectoryFiles(baseDir: string) {
  for (const sub of ['pwn', 're', 'notes']) {
    try {
      const files = await window.api.files.readDir(`${baseDir}/${sub}`)
      dirFiles.value[sub] = files || []
    } catch {
      dirFiles.value[sub] = []
    }
  }
}

async function handleParticipate() {
  if (!competition.value) return
  await store.participate(competition.value.id)
  // Reload to get updated directory
  await loadCompetition()
}

function openInEditor(file: FileEntry) {
  router.push(`/editor/notes/${file.path}`)
}

function formatDateRange(startStr: string, endStr: string): string {
  if (!startStr) return '—'
  const start = new Date(startStr)
  const end = endStr ? new Date(endStr) : null
  const fmt = (d: Date) => d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  if (!end) return fmt(start)
  return `${fmt(start)} → ${fmt(end)}`
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDuration(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return '—'
  const start = new Date(startStr)
  const end = new Date(endStr)
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.round(diffMs / 3600000)
  if (hours < 24) return `${hours} 小时`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `${days} 天 ${remainHours} 小时` : `${days} 天`
}

function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'upcoming': 'px-2 py-0.5 rounded text-xs font-medium bg-blue-500/15 text-blue-400',
    'running': 'px-2 py-0.5 rounded text-xs font-medium bg-green-500/15 text-green-400',
    'participating': 'px-2 py-0.5 rounded text-xs font-medium bg-purple-500/15 text-purple-400',
    'finished': 'px-2 py-0.5 rounded text-xs font-medium bg-gray-500/15 text-gray-400'
  }
  return map[status] || 'px-2 py-0.5 rounded text-xs font-medium bg-gray-500/15 text-gray-400'
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
