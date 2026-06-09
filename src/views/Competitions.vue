<template>
  <div class="competitions animate-fade-in space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">比赛管理</h2>
        <p class="text-[var(--text-secondary)] mt-1 text-sm">管理 CTF 比赛信息，从 CTFtime 获取或手动创建</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="btn-primary"
          @click="showCreateModal = true"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            创建比赛
          </span>
        </button>
        <button
          class="btn-secondary"
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
        暂无赛事 — 点击上方按钮从 CTFtime 获取或手动创建比赛
      </template>
      <template v-else-if="activeTab === 'participating'">
        还没有参加任何比赛 — 在 CTFtime 赛事中找到感兴趣的比赛并点击「参加」
      </template>
      <template v-else-if="activeTab === 'solved'">
        暂无已解决的比赛 — 在比赛详情页创建题目并标记为已解决
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
        class="card group cursor-pointer hover:border-[var(--border-hover)] transition-colors border-l-2"
        :class="comp.solved ? 'border-l-green-500' : ''"
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
                {{ formatDateTime(comp.start_date) }}
              </span>
              <span v-if="comp.end_date" class="text-[var(--text-muted)]">→</span>
              <span v-if="comp.end_date" class="flex items-center gap-1">
                {{ formatDateTime(comp.end_date) }}
              </span>
            </div>

            <!-- Duration row -->
            <div v-if="comp.start_date && comp.end_date" class="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ getDuration(comp.start_date, comp.end_date) }}
            </div>
            <!-- Challenge progress bar for participating comps -->
            <div
              v-if="comp.status === 'participating' && challengeProgress[comp.id] && challengeProgress[comp.id].total > 0"
              class="mt-2"
            >
              <div class="w-full h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="challengeProgress[comp.id].percent === 100 ? 'bg-green-500' : 'bg-yellow-500'"
                  :style="{ width: challengeProgress[comp.id].percent + '%' }"
                />
              </div>
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
            <!-- Solved badge for participating -->
            <span
              v-if="comp.status === 'participating' && comp.solved"
              class="px-2 py-0.5 rounded text-xs font-medium bg-green-500/15 text-green-400"
            >
              已解决
            </span>
            <!-- Partial progress for participating (not fully solved, has challenges) -->
            <span
              v-else-if="comp.status === 'participating' && challengeProgress[comp.id] && challengeProgress[comp.id].total > 0"
              class="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/15 text-yellow-400"
            >
              🔶 {{ challengeProgress[comp.id].solved }}/{{ challengeProgress[comp.id].total }}
            </span>
          </div>
        </div>

        <!-- Action bar -->
        <div
          v-if="comp.status !== 'participating'"
          class="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-2"
        >
          <button
            v-if="comp.status !== 'finished'"
            class="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-500/15 text-blue-400
                   hover:bg-blue-500/25 transition-colors"
            @click.stop="handleParticipate(comp)"
          >
            参加
          </button>
          <button
            v-if="comp.status === 'finished'"
            class="px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/15 text-red-400
                   hover:bg-red-500/25 transition-colors"
            @click.stop="confirmDelete(comp)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- Create Competition Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="closeCreateModal"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Modal -->
        <div class="relative w-full max-w-lg mx-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl animate-fade-in">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <h3 class="text-lg font-semibold">✨ 创建比赛</h3>
            <button
              class="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              @click="closeCreateModal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-4 space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                比赛名称 <span class="text-red-400">*</span>
              </label>
              <input
                ref="nameInput"
                v-model="form.name"
                type="text"
                placeholder="例如: HITCON CTF 2025"
                class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm
                       focus:outline-none focus:border-blue-400 transition-colors placeholder:text-[var(--text-muted)]"
                @keydown.enter="handleCreate"
              />
            </div>

            <!-- Format -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">比赛格式</label>
              <select
                v-model="form.format"
                class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm
                       focus:outline-none focus:border-blue-400 transition-colors"
              >
                <option value="Jeopardy">Jeopardy (解题赛)</option>
                <option value="Attack-Defense">Attack-Defense (攻防赛)</option>
                <option value="Mixed">Mixed (混合赛)</option>
              </select>
            </div>

            <!-- Start date -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                开始时间 <span class="text-red-400">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model="form.start_date"
                  type="datetime-local"
                  class="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm
                         focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <!-- Quick date presets -->
              <div class="flex items-center gap-1.5 mt-1.5">
                <span class="text-xs text-[var(--text-muted)] mr-1">快捷:</span>
                <button
                  v-for="preset in datePresets"
                  :key="preset.label"
                  class="px-2.5 py-1 rounded text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
                         hover:bg-blue-500/15 hover:text-blue-400 transition-colors"
                  @click="applyPreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <!-- End date -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                结束时间 <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.end_date"
                type="datetime-local"
                class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm
                       focus:outline-none focus:border-blue-400 transition-colors"
              />
              <p class="text-xs text-[var(--text-muted)] mt-1">
                设置开始时间后自动填充为开始+48小时，可手动修改
              </p>
            </div>

            <!-- URL -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">比赛链接</label>
              <input
                v-model="form.url"
                type="url"
                placeholder="https://..."
                class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm
                       focus:outline-none focus:border-blue-400 transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>

            <!-- Weight -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">权重</label>
              <input
                v-model.number="form.weight"
                type="number"
                min="0"
                step="0.1"
                placeholder="例如: 100"
                class="w-32 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm
                       focus:outline-none focus:border-blue-400 transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>

            <!-- Auto participate -->
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input
                v-model="form.auto_participate"
                type="checkbox"
                class="w-4 h-4 rounded border-[var(--border-color)] text-blue-500 bg-[var(--bg-tertiary)]
                       focus:ring-blue-400 focus:ring-offset-0"
              />
              <span class="text-sm text-[var(--text-secondary)]">
                直接参加（自动创建目录）
              </span>
            </label>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-color)]">
            <button
              class="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              @click="closeCreateModal"
            >
              取消
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white
                     hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!form.name.trim() || !form.start_date || !form.end_date || creating"
              @click="handleCreate"
            >
              <span v-if="creating" class="flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                创建中...
              </span>
              <span v-else>✨ 创建比赛</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="showDeleteModal = false"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div class="relative w-full max-w-sm mx-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl animate-fade-in p-6">
          <h3 class="text-lg font-semibold mb-2">确认删除</h3>
          <p class="text-sm text-[var(--text-secondary)] mb-4">
            确定要删除「{{ deleteTarget?.name }}」吗？此操作不可撤销，比赛目录和文件也会一并删除。
          </p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              @click="showDeleteModal = false"
              :disabled="deleting"
            >
              取消
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white
                     hover:bg-red-600 transition-colors disabled:opacity-50"
              :disabled="deleting"
              @click="handleDelete"
            >
              <span v-if="deleting" class="flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                删除中...
              </span>
              <span v-else>确认删除</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCompetitionsStore } from '@/stores/competitions'
import { useChallengesStore } from '@/stores/challenges'
import { formatDateTime, getDuration, statusBadgeClass, statusLabel } from '@/utils/formatters'
import type { Competition } from '@/types'

const store = useCompetitionsStore()
const chStore = useChallengesStore()
const router = useRouter()

const activeTab = ref<'ctftime' | 'participating' | 'finished' | 'solved'>('ctftime')
const challengeProgress = ref<Record<number, { total: number; solved: number }>>({})
const showCreateModal = ref(false)
const creating = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteTarget = ref<Competition | null>(null)

// ── Date presets ──
interface DatePreset {
  label: string
  getStart: () => Date
  durationHours: number
}

const datePresets: DatePreset[] = [
  {
    label: '明天',
    getStart: () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
      return d
    },
    durationHours: 48
  },
  {
    label: '本周末',
    getStart: () => {
      const d = new Date()
      const day = d.getDay()
      // Next Saturday
      const daysUntilSat = day === 6 ? 0 : 6 - day
      d.setDate(d.getDate() + daysUntilSat)
      d.setHours(9, 0, 0, 0)
      return d
    },
    durationHours: 48
  },
  {
    label: '下周',
    getStart: () => {
      const d = new Date()
      const day = d.getDay()
      // Next Monday
      const daysUntilMon = day === 1 ? 7 : (8 - day) % 7 || 7
      d.setDate(d.getDate() + daysUntilMon)
      d.setHours(9, 0, 0, 0)
      return d
    },
    durationHours: 48
  },
  {
    label: '下个月',
    getStart: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 1, 1)
      d.setHours(9, 0, 0, 0)
      return d
    },
    durationHours: 48
  }
]

// ── Form ──
function defaultForm() {
  const now = new Date()
  // Round to nearest hour
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  const start = toLocalISO(now)
  const end = toLocalISO(new Date(now.getTime() + 48 * 3600000))
  return {
    name: '',
    format: 'Jeopardy',
    start_date: start,
    end_date: end,
    url: '',
    weight: 0,
    auto_participate: true
  }
}

const form = ref(defaultForm())

function toLocalISO(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

// Auto-focus name input when modal opens
watch(showCreateModal, async (val) => {
  if (val) {
    await nextTick()
    nameInput.value?.focus()
  }
})

// Auto-fill end date when start date changes
watch(() => form.value.start_date, (newStart) => {
  if (newStart) {
    const start = new Date(newStart)
    const end = new Date(start.getTime() + 48 * 3600000)
    form.value.end_date = toLocalISO(end)
  }
})

function applyPreset(preset: DatePreset) {
  const start = preset.getStart()
  form.value.start_date = toLocalISO(start)
  const end = new Date(start.getTime() + preset.durationHours * 3600000)
  form.value.end_date = toLocalISO(end)
}

function closeCreateModal() {
  showCreateModal.value = false
  form.value = defaultForm()
}

async function handleCreate() {
  if (!form.value.name.trim() || !form.value.start_date || !form.value.end_date) return
  if (creating.value) return

  creating.value = true
  try {
    // Convert local datetime strings to ISO
    const startDate = new Date(form.value.start_date).toISOString()
    const endDate = new Date(form.value.end_date).toISOString()

    const comp = await store.create({
      name: form.value.name.trim(),
      start_date: startDate,
      end_date: endDate,
      format: form.value.format,
      url: form.value.url.trim() || undefined,
      weight: form.value.weight || undefined,
      auto_participate: form.value.auto_participate
    })

    if (comp) {
      closeCreateModal()
      // Navigate to detail if participated, otherwise switch to participating tab
      if (form.value.auto_participate) {
        router.push(`/competitions/${comp.id}`)
      }
    }
  } catch (err) {
    console.error('Failed to create competition:', err)
  } finally {
    creating.value = false
  }
}

const tabs = computed(() => [
  { key: 'ctftime' as const, label: '赛事', count: store.competitions.length },
  { key: 'participating' as const, label: '我参加的', count: store.participating.length },
  { key: 'solved' as const, label: '已解决', count: store.participating.filter(c => c.solved === 1).length },
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
    case 'solved':
      list = store.participating.filter(c => c.solved === 1)
      break
    default:
      // All tab shows all (upcoming + running)
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

onMounted(async () => {
  await store.loadList()
  // Load challenge progress for participating competitions
  for (const comp of store.participating) {
    try {
      await chStore.loadByCompetition(comp.id)
      challengeProgress.value[comp.id] = chStore.getCompProgress(comp.id)
    } catch { /* ignore */ }
  }
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

function confirmDelete(comp: Competition) {
  deleteTarget.value = comp
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    await store.deleteComp(deleteTarget.value.id)
    showDeleteModal.value = false
    deleteTarget.value = null
  } catch (err) {
    console.error('Failed to delete competition:', err)
  } finally {
    deleting.value = false
  }
}

function formatBadgeClass(format: string): string {
  const map: Record<string, string> = {
    'Jeopardy': 'bg-green-500/15 text-green-400',
    'Attack-Defense': 'bg-red-500/15 text-red-400',
    'Mixed': 'bg-purple-500/15 text-purple-400'
  }
  return map[format] || 'bg-gray-500/15 text-gray-400'
}
</script>
