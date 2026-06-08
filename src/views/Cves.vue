<template>
  <div class="page max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">CVE 复现管理</h1>
        <p class="text-sm text-[var(--text-muted)] mt-1">追踪和管理 CVE 漏洞复现工作</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-primary flex items-center gap-1.5" @click="openCreateModal">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          创建 CVE
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索 CVE 编号或标题..."
        class="w-full max-w-md px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
      />
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-0 border-b border-[var(--border-color)] mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors"
        :class="activeTab === tab.key
          ? 'text-blue-400 border-blue-400'
          : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredCves.length === 0" class="text-center py-20">
      <svg class="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-[var(--text-muted)]">暂无 CVE 记录</p>
      <button class="mt-3 text-blue-400 text-sm hover:underline" @click="openCreateModal">创建第一个 CVE →</button>
    </div>

    <!-- CVE Grid -->
    <div v-else class="grid gap-4 md:grid-cols-2">
      <div
        v-for="cve in filteredCves"
        :key="cve.id"
        class="card group cursor-pointer hover:border-blue-400/30 transition-all duration-200"
        @click="openDetail(cve.id)"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono text-sm font-semibold text-[var(--text-primary)]">
                {{ cve.cve_number }}
              </span>
              <button
                class="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--bg-tertiary)]"
                title="复制 CVE 编号"
                @click.stop="copyCveNumber(cve.cve_number)"
              >
                <svg class="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            </div>
            <p v-if="cve.title" class="text-sm text-[var(--text-secondary)] truncate">{{ cve.title }}</p>
          </div>

          <!-- Status badge -->
          <span
            class="shrink-0 ml-2 px-2 py-0.5 rounded text-xs font-medium"
            :class="store.getStatusColor(cve.status)"
          >{{ store.getStatusLabel(cve.status) }}</span>
        </div>

        <!-- Badges row -->
        <div class="flex items-center gap-2 mb-3 flex-wrap">
          <span
            v-if="cve.severity"
            class="px-2 py-0.5 rounded text-xs font-medium"
            :class="store.getSeverityColor(cve.severity)"
          >{{ cve.severity }}</span>
          <span
            v-if="cve.cvss_score > 0"
            class="px-2 py-0.5 rounded text-xs font-mono bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
          >CVSS {{ cve.cvss_score }}</span>
          <!-- Docker indicator -->
          <span
            v-if="cve.docker_image"
            class="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Docker
          </span>
        </div>

        <!-- Description preview -->
        <p
          v-if="cve.description"
          class="text-xs text-[var(--text-muted)] line-clamp-2 mb-3"
        >{{ cve.description }}</p>

        <!-- Footer -->
        <div class="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>更新于 {{ formatDate(cve.updated_at) }}</span>
          <button
            class="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:underline"
            @click.stop="confirmDelete(cve)"
          >删除</button>
        </div>
      </div>
    </div>

    <!-- Create CVE Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="closeCreateModal"
      >
        <div class="relative w-full max-w-lg card p-6 shadow-2xl">
          <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-5">创建 CVE 复现任务</h2>

          <div class="space-y-4">
            <!-- CVE Number -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                CVE 编号 <span class="text-red-400">*</span>
              </label>
              <input
                ref="cveNumberInput"
                v-model="form.cve_number"
                type="text"
                placeholder="CVE-2024-12345"
                class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm font-mono focus:outline-none focus:border-blue-400 transition-colors"
                @keydown.enter="handleCreate"
              />
            </div>

            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">标题</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="漏洞简述（可选）"
                class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            <!-- Severity + CVSS row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">严重程度</label>
                <select
                  v-model="form.severity"
                  class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="">未指定</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">CVSS 评分</label>
                <input
                  v-model.number="form.cvss_score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="0-10"
                  class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">描述</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="漏洞简要描述（可选）"
                class="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none"
              ></textarea>
            </div>

            <div class="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              将自动创建目录结构和 notes.md、writeup.md 模板
            </div>
          </div>

          <!-- Error -->
          <div v-if="createError" class="mt-3 text-sm text-red-400">{{ createError }}</div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 mt-6">
            <button class="btn-ghost px-4 py-2 text-sm" @click="closeCreateModal">取消</button>
            <button
              class="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
              :disabled="creating"
              @click="handleCreate"
            >
              <svg v-if="creating" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ creating ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteModal = false"
      >
        <div class="card w-96 p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-[var(--text-primary)]">删除 CVE</h3>
              <p class="text-xs text-[var(--text-muted)]">
                确定要删除「{{ deleteTarget?.cve_number }}」吗？<br/>
                这将同时删除所有关联文件和 Docker 容器。
              </p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-3">
            <button class="btn-ghost px-4 py-2 text-sm" @click="showDeleteModal = false">取消</button>
            <button
              class="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              :disabled="deleting"
              @click="handleDelete"
            >{{ deleting ? '删除中...' : '确认删除' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCvesStore } from '@/stores/cves'
import type { Cve } from '@/types'

const router = useRouter()
const store = useCvesStore()

const activeTab = ref('all')
const searchQuery = ref('')
const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')
const cveNumberInput = ref<HTMLInputElement | null>(null)

// Delete state
const showDeleteModal = ref(false)
const deleteTarget = ref<Cve | null>(null)
const deleting = ref(false)

// Form
const defaultForm = () => ({
  cve_number: '',
  title: '',
  severity: '',
  cvss_score: 0,
  description: ''
})
const form = ref(defaultForm())

const tabs = computed(() => [
  { key: 'all', label: '全部', count: store.cves.length },
  { key: 'pending', label: '待复现', count: store.pendingCves.length },
  { key: 'reproducing', label: '复现中', count: store.reproducingCves.length },
  { key: 'completed', label: '已完成', count: store.completedCves.length }
])

const filteredCves = computed(() => {
  let list: Cve[]
  switch (activeTab.value) {
    case 'pending': list = store.pendingCves; break
    case 'reproducing': list = store.reproducingCves; break
    case 'completed': list = store.completedCves; break
    default: list = store.cves
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter(c =>
    c.cve_number.toLowerCase().includes(q) ||
    c.title.toLowerCase().includes(q)
  )
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  return d.toLocaleDateString('zh-CN')
}

function openDetail(id: number): void {
  router.push(`/cves/${id}`)
}

async function copyCveNumber(cveNumber: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(cveNumber)
  } catch {
    // Fallback
  }
}

function openCreateModal(): void {
  form.value = defaultForm()
  createError.value = ''
  showCreateModal.value = true
}

function closeCreateModal(): void {
  showCreateModal.value = false
}

async function handleCreate(): Promise<void> {
  if (!form.value.cve_number.trim()) return

  creating.value = true
  createError.value = ''

  try {
    const created = await store.create(form.value)
    if (created) {
      closeCreateModal()
      router.push(`/cves/${created.id}`)
    }
  } catch (err: any) {
    createError.value = err.message || '创建失败'
  } finally {
    creating.value = false
  }
}

// Delete functions
function confirmDelete(cve: Cve): void {
  deleteTarget.value = cve
  showDeleteModal.value = true
}

async function handleDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteCve(deleteTarget.value.id)
    showDeleteModal.value = false
    deleteTarget.value = null
  } catch (err) {
    console.error('Failed to delete CVE:', err)
  } finally {
    deleting.value = false
  }
}

// Auto-focus input when modal opens
watch(showCreateModal, async (val) => {
  if (val) {
    await nextTick()
    cveNumberInput.value?.focus()
  }
})

onMounted(() => {
  store.loadList()
})
</script>
