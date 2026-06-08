<template>
  <div class="editor-page animate-fade-in h-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between shrink-0 px-1 py-1.5">
      <div class="flex items-center gap-1">
        <router-link to="/files" class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors" title="返回文件管理">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </router-link>

        <button
          class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          :class="{ 'text-blue-400 bg-blue-400/10': showSidebar }"
          title="切换文件树"
          @click="showSidebar = !showSidebar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        </button>

        <div class="w-px h-5 bg-[var(--border-color)] mx-1" />

        <!-- New file buttons -->
        <button
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          title="新建 Markdown"
          @click="tabStore.newTab('markdown')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          .md
        </button>
        <button
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          title="新建 Python"
          @click="tabStore.newTab('python')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          .py
        </button>
      </div>

      <div class="flex items-center gap-1">
        <!-- Preview toggle (markdown only) -->
        <button
          v-if="tabStore.activeTab?.language === 'markdown'"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
          :class="showPreview ? 'bg-blue-500/10 text-blue-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'"
          @click="showPreview = !showPreview"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          {{ showPreview ? '隐藏预览' : '预览' }}
        </button>

        <!-- Run button for Python -->
        <button
          v-if="tabStore.activeTab?.language === 'python'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
          :disabled="pythonRunning || !tabStore.activeTab?.path"
          @click="runPython"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': pythonRunning }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ pythonRunning ? '运行中...' : '运行' }}
        </button>

        <!-- Save button -->
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="tabStore.activeTab?.dirty
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'"
          :disabled="!tabStore.activeTab?.dirty"
          @click="handleSave"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          {{ tabStore.activeTab?.dirty ? '保存' : '已保存' }}
        </button>
      </div>
    </div>

    <!-- ─── Main area ─── -->
    <div class="flex-1 flex min-h-0 border-t panel-glass border-t-0">
      <!-- File tree sidebar -->
      <div
        v-if="showSidebar"
        class="w-56 shrink-0 panel-glass border-r overflow-auto"
      >
        <div class="p-2">
          <div class="flex items-center gap-2 px-2 py-1.5 mb-1">
            <span class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">比赛文件</span>
          </div>

          <div v-if="sidebarGroups.length === 0" class="px-2 py-4 text-xs text-[var(--text-muted)] text-center">
            暂无比赛
          </div>

          <div v-for="group in sidebarGroups" :key="group.compId" class="mb-1">
            <!-- Group header -->
            <div
              class="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              @click="toggleSidebarGroup(group.compId)"
            >
              <svg
                class="w-2.5 h-2.5 text-[var(--text-muted)] transition-transform shrink-0"
                :class="{ 'rotate-90': sidebarExpanded.has(group.compId) }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              <span class="truncate font-medium">{{ group.compName }}</span>
            </div>

            <div v-if="sidebarExpanded.has(group.compId)" class="ml-3">
              <div
                v-for="entry in group.entries"
                :key="entry.path"
                class="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors"
                :class="tabStore.activeTab?.path === entry.path
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'"
                @click="openSidebarFile(entry.path)"
              >
                <svg v-if="entry.type === 'directory'" class="w-3 h-3 shrink-0 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                </svg>
                <svg v-else class="w-3 h-3 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="truncate">{{ entry.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Editor panel -->
      <div class="flex-1 flex flex-col min-w-0 min-h-0">
        <!-- Tabs bar -->
        <div v-if="tabStore.tabs.length > 0" class="flex items-center shrink-0 panel-glass border-b overflow-x-auto">
          <div class="flex items-center min-w-0">
            <div
              v-for="tab in tabStore.tabs"
              :key="tab.id"
              class="group flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-[var(--border-color)] cursor-pointer min-w-0 transition-colors shrink-0 select-none"
              :class="tab.id === tabStore.activeTabId
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-b-2 border-b-blue-400 -mb-px'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'"
              @click="tabStore.activeTabId = tab.id"
            >
              <!-- File icon -->
              <svg v-if="tab.language === 'python'" class="w-3 h-3 shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <svg v-else-if="tab.language === 'markdown'" class="w-3 h-3 shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
              <svg v-else class="w-3 h-3 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>

              <span class="truncate max-w-[120px]">{{ tab.name }}</span>

              <!-- Dirty dot -->
              <span v-if="tab.dirty" class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />

              <!-- Close button -->
              <button
                class="w-4 h-4 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                @click.stop="closeEditorTab(tab.id)"
              >
                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Editor body -->
        <div class="flex-1 flex min-h-0">
          <div v-if="tabStore.activeTab" class="flex-1 min-w-0" :class="{ 'w-1/2': showPreview && tabStore.activeTab.language === 'markdown' }">
            <MdEditor
              :key="tabStore.activeTab.id"
              :model-value="tabStore.activeTab.content"
              :language="tabStore.activeTab.language"
              :dark="isDark"
              :font-size="Number(settingsStore.settings.font_size)"
              @update:model-value="onContentChange"
              @save="handleSave"
              @cursor="onCursorMove"
            />
          </div>

          <!-- Empty state -->
          <div
            v-else
            class="flex-1 flex items-center justify-center panel-glass"
          >
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <p class="text-sm text-[var(--text-secondary)] mb-1">打开一个文件开始编辑</p>
              <p class="text-xs text-[var(--text-muted)]">
                从左侧文件树选择文件，或新建
                <span class="text-blue-400 cursor-pointer hover:underline" @click="tabStore.newTab('markdown')">.md</span>
                /
                <span class="text-green-400 cursor-pointer hover:underline" @click="tabStore.newTab('python')">.py</span>
                文件
              </p>
            </div>
          </div>

          <!-- Preview panel (markdown) -->
          <div
            v-if="showPreview && tabStore.activeTab?.language === 'markdown'"
            class="w-1/2 panel-glass border-l overflow-auto"
          >
            <MdPreview :content="tabStore.activeTab.content" />
          </div>

          <!-- Output panel (python) -->
          <div
            v-if="showOutput && tabStore.activeTab?.language === 'python'"
            class="w-1/2 panel-glass border-l flex flex-col"
          >
            <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] shrink-0">
              <span class="text-xs font-semibold text-[var(--text-secondary)]">执行输出</span>
              <button class="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors" @click="showOutput = false">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="flex-1 overflow-auto p-3">
              <pre
                class="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all"
                :class="pythonExitCode === 0 ? 'text-green-400' : 'text-red-400'"
              ><code>{{ pythonOutput || '无输出' }}</code></pre>
            </div>
          </div>
        </div>

        <!-- Status bar -->
        <div
          v-if="tabStore.activeTab"
          class="flex items-center justify-between shrink-0 h-7 px-3 panel-glass border-t text-[11px] text-[var(--text-muted)]"
        >
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1">
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="tabStore.activeTab.language === 'python' ? 'bg-blue-400' : tabStore.activeTab.language === 'markdown' ? 'bg-purple-400' : 'bg-gray-400'"
              />
              {{ tabStore.activeTab.language === 'python' ? 'Python' : tabStore.activeTab.language === 'markdown' ? 'Markdown' : 'Plain Text' }}
            </span>
            <span v-if="cursorPosition">Ln {{ cursorPosition.line }}, Col {{ cursorPosition.col }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="tabStore.activeTab.dirty" class="text-blue-400">● 未保存</span>
            <span v-else class="text-green-400">✓ 已保存</span>
            <span v-if="tabStore.activeTab.path" class="font-mono opacity-60 truncate max-w-[300px]">{{ tabStore.activeTab.path }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEditorTabsStore } from '@/stores/editorTabs'
import { useCompetitionsStore } from '@/stores/competitions'
import { useSettingsStore } from '@/stores/settings'
import MdEditor from '@/components/editor/MdEditor.vue'
import MdPreview from '@/components/editor/MdPreview.vue'
import type { FileEntry } from '@/types'

const route = useRoute()
const tabStore = useEditorTabsStore()
const compStore = useCompetitionsStore()
const settingsStore = useSettingsStore()

const showSidebar = ref(true)
const showPreview = ref(false)
const showOutput = ref(false)
const pythonRunning = ref(false)
const pythonOutput = ref('')
const pythonExitCode = ref<number | null>(null)
const cursorPosition = ref<{ line: number; col: number } | null>(null)

// Sidebar state
interface SidebarGroup {
  compId: number
  compName: string
  entries: FileEntry[]
}
const sidebarGroups = ref<SidebarGroup[]>([])
const sidebarExpanded = ref(new Set<number>())

const isDark = computed(() => settingsStore.settings.theme === 'dark')

onMounted(async () => {
  await settingsStore.load()
  await loadSidebar()

  // Global keyboard shortcuts
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault()
      tabStore.newTab('markdown')
    }
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault()
      if (tabStore.activeTabId) {
        tabStore.closeTab(tabStore.activeTabId)
      }
    }
  }
  window.addEventListener('keydown', onKeyDown)
  ;(window as any).__editorKeydownCleanup = () => window.removeEventListener('keydown', onKeyDown)

  // Open file from route params if any
  const type = route.params.type as string
  const id = route.params.id as string | undefined

  if (id && (type === 'file' || type === 'notes')) {
    const path = decodeURIComponent(id)
    await tabStore.openFile(path)
    // Auto-preview for markdown
    if (tabStore.activeTab?.language === 'markdown') {
      showPreview.value = true
    }
  } else if (type === 'markdown') {
    tabStore.newTab('markdown')
  } else if (type === 'python') {
    tabStore.newTab('python')
  }
})

async function loadSidebar() {
  await compStore.loadList()
  const groups: SidebarGroup[] = []
  for (const comp of compStore.participating) {
    if (comp.directory) {
      try {
        const entries = await window.api.files.readDir(comp.directory)
        groups.push({ compId: comp.id, compName: comp.name, entries: flattenSidebar(entries) })
        sidebarExpanded.value.add(comp.id)
      } catch { /* skip */ }
    }
  }
  sidebarGroups.value = groups
}

function flattenSidebar(entries: FileEntry[], depth = 0): FileEntry[] {
  const result: FileEntry[] = []
  for (const e of entries) {
    if (e.type === 'directory' && e.children) {
      result.push({ ...e, children: undefined })
      for (const child of e.children) {
        result.push({ ...child, name: '  ' + child.name, children: undefined })
        if (child.children) {
          for (const sub of child.children) {
            result.push({ ...sub, name: '    ' + sub.name, children: undefined })
          }
        }
      }
    } else {
      result.push({ ...e, children: undefined })
    }
  }
  return result
}

function toggleSidebarGroup(compId: number) {
  const s = new Set(sidebarExpanded.value)
  if (s.has(compId)) s.delete(compId)
  else s.add(compId)
  sidebarExpanded.value = s
}

async function openSidebarFile(path: string) {
  await tabStore.openFile(path)
  if (tabStore.activeTab?.language === 'markdown') {
    showPreview.value = true
  }
}

function onContentChange(val: string) {
  if (tabStore.activeTabId) {
    tabStore.updateContent(tabStore.activeTabId, val)
  }
}

function onCursorMove(pos: { line: number; col: number }) {
  cursorPosition.value = pos
}

async function handleSave() {
  if (!tabStore.activeTabId) return
  await tabStore.saveTab(tabStore.activeTabId)
}

function closeEditorTab(tabId: string) {
  tabStore.closeTab(tabId)
}

async function runPython() {
  if (pythonRunning.value || !tabStore.activeTab?.path) return
  pythonRunning.value = true
  showOutput.value = true
  pythonOutput.value = ''

  // Save first if dirty
  if (tabStore.activeTab.dirty) {
    await handleSave()
  }

  try {
    const result = await window.api.python.runScript(tabStore.activeTab.path)
    pythonExitCode.value = result.exitCode
    if (result.stdout) pythonOutput.value = result.stdout
    if (result.stderr) pythonOutput.value += (pythonOutput.value ? '\n' : '') + result.stderr
  } catch (err) {
    pythonOutput.value = `执行错误: ${err}`
    pythonExitCode.value = -1
  } finally {
    pythonRunning.value = false
  }
}
</script>
