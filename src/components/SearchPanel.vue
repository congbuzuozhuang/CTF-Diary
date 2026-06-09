<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex justify-center"
      style="padding-top: 12vh"
      @click.self="$emit('close')"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <!-- Panel -->
      <div
        class="relative w-full max-w-2xl mx-4 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-[var(--border-color)]"
        style="max-height: 70vh; background: var(--card-bg)"
      >
        <!-- Search Input -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-color)]">
          <svg class="w-5 h-5 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            class="flex-1 bg-transparent text-[var(--text-primary)] text-base outline-none placeholder:text-[var(--text-muted)]"
            placeholder="搜索日记、比赛、题目、CVE..."
            @keydown="onKeyDown"
          />
          <!-- Loading spinner -->
          <svg v-if="loading" class="w-4 h-4 shrink-0 animate-spin text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <!-- Close hint -->
          <kbd class="text-[10px] px-1.5 py-0.5 rounded text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-[var(--border-color)]">Esc</kbd>
        </div>

        <!-- Results Area -->
        <div class="flex-1 overflow-y-auto px-2 py-2" ref="scrollContainer">
          <!-- Empty state: no query -->
          <div v-if="!query.trim()" class="flex flex-col items-center justify-center py-16 text-[var(--text-muted)] text-sm gap-2">
            <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span>输入关键词搜索</span>
            <span class="text-xs opacity-60">支持搜索日记、比赛笔记、题目描述和 CVE 内容</span>
          </div>

          <!-- Loading indicator -->
          <div v-else-if="loading" class="flex items-center justify-center py-12">
            <span class="text-sm text-[var(--text-muted)]">搜索中...</span>
          </div>

          <!-- No results -->
          <div v-else-if="grouped.length === 0" class="flex flex-col items-center justify-center py-16 text-[var(--text-muted)] text-sm gap-2">
            <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>没有找到匹配的结果</span>
            <span class="text-xs opacity-60">尝试更换关键词</span>
          </div>

          <!-- Grouped Results -->
          <template v-for="(group, gi) in grouped" :key="group.source">
            <div class="px-3 py-2">
              <!-- Group Header -->
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {{ group.label }}
                </span>
                <span class="text-[10px] text-[var(--text-muted)] opacity-50">{{ group.items.length }} 条</span>
              </div>

              <!-- Group Items -->
              <div
                v-for="(item, ii) in group.items"
                :key="`${item.source}-${item.id}`"
                :ref="el => setResultRef(gi, ii, el)"
                class="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group"
                :class="isSelected(gi, ii) ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-secondary)]'"
                @click="navigateTo(item)"
                @mouseenter="selectedGroup = gi; selectedItem = ii"
              >
                <!-- Source Icon -->
                <span class="shrink-0 w-6 h-6 mt-0.5 flex items-center justify-center rounded text-xs font-bold"
                  :class="sourceIconClass(item.source)"
                >
                  {{ sourceIcon(item.source) }}
                </span>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-[var(--text-primary)] truncate">{{ item.title }}</span>
                    <span v-if="item.subtitle" class="text-xs text-[var(--text-muted)] truncate">{{ item.subtitle }}</span>
                  </div>
                  <div
                    v-if="item.snippet"
                    class="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2"
                    v-html="highlight(item.snippet)"
                  />
                </div>

                <!-- Navigate Arrow -->
                <svg class="w-4 h-4 shrink-0 mt-1 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex items-center gap-4 px-5 py-2.5 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)]">
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]">↑↓</kbd> 导航
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]">Enter</kbd> 跳转
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]">Esc</kbd> 关闭
          </span>
          <span v-if="total > 0" class="ml-auto opacity-50">共 {{ total }} 条结果</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

interface SearchResult {
  source: 'diary' | 'competition' | 'challenge' | 'cve'
  id: number
  title: string
  subtitle: string
  snippet: string
  navigateTo: string
}

interface SearchGroup {
  source: string
  label: string
  items: SearchResult[]
}

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()

const query = ref('')
const grouped = ref<SearchGroup[]>([])
const total = ref(0)
const loading = ref(false)
const selectedGroup = ref(0)
const selectedItem = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)
const resultRefs = new Map<string, HTMLElement>()

// Debounced search
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  if (!val.trim()) {
    grouped.value = []
    total.value = 0
    loading.value = false
    selectedGroup.value = 0
    selectedItem.value = 0
    return
  }

  loading.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const data = await window.api.search.query(val.trim())
      grouped.value = data.grouped
      total.value = data.total
    } catch {
      grouped.value = []
      total.value = 0
    } finally {
      loading.value = false
      selectedGroup.value = 0
      selectedItem.value = 0
    }
  }, 300)
})

// Auto-focus input when panel opens
watch(() => props.visible, (val) => {
  if (val) {
    query.value = ''
    grouped.value = []
    total.value = 0
    loading.value = false
    selectedGroup.value = 0
    selectedItem.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

// Close on route change
watch(() => router.currentRoute.value, () => {
  if (props.visible) {
    emit('close')
  }
})

// Close on Escape key (global, while visible)
function onGlobalKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    e.preventDefault()
    emit('close')
  }
}
onMounted(() => document.addEventListener('keydown', onGlobalKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onGlobalKeyDown))

// Flat result map for keyboard navigation
const flatResults = computed(() => {
  const flat: { groupIdx: number; itemIdx: number }[] = []
  for (let gi = 0; gi < grouped.value.length; gi++) {
    const group = grouped.value[gi]
    for (let ii = 0; ii < group.items.length; ii++) {
      flat.push({ groupIdx: gi, itemIdx: ii })
    }
  }
  return flat
})

function isSelected(gi: number, ii: number): boolean {
  return selectedGroup.value === gi && selectedItem.value === ii
}

function setResultRef(gi: number, ii: number, el: any) {
  if (el) {
    resultRefs.set(`${gi}-${ii}`, el as HTMLElement)
  }
}

function scrollToSelected() {
  const key = `${selectedGroup.value}-${selectedItem.value}`
  const el = resultRefs.get(key)
  el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

// Keyboard navigation within the input
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (flatResults.value.length === 0) return
    const currentIdx = flatResults.value.findIndex(
      r => r.groupIdx === selectedGroup.value && r.itemIdx === selectedItem.value
    )
    const nextIdx = Math.min(currentIdx + 1, flatResults.value.length - 1)
    if (nextIdx >= 0 && nextIdx < flatResults.value.length) {
      selectedGroup.value = flatResults.value[nextIdx].groupIdx
      selectedItem.value = flatResults.value[nextIdx].itemIdx
      nextTick(scrollToSelected)
    }
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (flatResults.value.length === 0) return
    const currentIdx = flatResults.value.findIndex(
      r => r.groupIdx === selectedGroup.value && r.itemIdx === selectedItem.value
    )
    const prevIdx = Math.max(currentIdx - 1, 0)
    if (prevIdx >= 0 && prevIdx < flatResults.value.length) {
      selectedGroup.value = flatResults.value[prevIdx].groupIdx
      selectedItem.value = flatResults.value[prevIdx].itemIdx
      nextTick(scrollToSelected)
    }
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    if (flatResults.value.length === 0) return
    const group = grouped.value[selectedGroup.value]
    if (group) {
      const item = group.items[selectedItem.value]
      if (item) navigateTo(item)
    }
  }
}

function navigateTo(item: SearchResult) {
  emit('close')
  router.push(item.navigateTo)
}

// Source icon and styling
function sourceIcon(source: string): string {
  switch (source) {
    case 'diary': return 'D'
    case 'competition': return 'C'
    case 'challenge': return 'T'
    case 'cve': return 'V'
    default: return '?'
  }
}

function sourceIconClass(source: string): string {
  const base = 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
  const accent = 'text-white'
  switch (source) {
    case 'diary': return `${base} ${accent} bg-emerald-500/80`
    case 'competition': return `${base} ${accent} bg-blue-500/80`
    case 'challenge': return `${base} ${accent} bg-amber-500/80`
    case 'cve': return `${base} ${accent} bg-red-500/80`
    default: return base
  }
}

// Highlight matched text in snippet
function highlight(text: string): string {
  if (!query.value.trim()) return escapeHtml(text)
  const term = query.value.trim()
  const escaped = escapeHtml(text)
  const escapedTerm = escapeHtml(term)
  // Case-insensitive highlight
  const regex = new RegExp(`(${escapedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
</script>

<style>
.search-highlight {
  background: rgba(250, 204, 21, 0.4);
  color: var(--text-primary);
  border-radius: 2px;
  padding: 0 1px;
}
</style>
