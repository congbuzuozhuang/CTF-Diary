<template>
  <div class="file-manager animate-fade-in flex flex-col h-full gap-4">
    <!-- Top bar -->
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h2 class="text-2xl font-bold">📁 文件管理</h2>
        <p class="text-[var(--text-secondary)] mt-1 text-sm">
          共 {{ fileStore.fileGroups.length }} 场比赛 · {{ totalFileCount }} 个文件
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button class="btn-secondary text-sm flex items-center gap-1.5" @click="refreshAll">
          <svg class="w-4 h-4" :class="{ 'animate-spin': fileStore.loadingAll }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          刷新
        </button>
      </div>
    </div>

    <!-- Main content: sidebar + preview -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
      <!-- Sidebar: all competitions -->
      <div class="card lg:col-span-1 overflow-auto min-h-0 flex flex-col">
        <h3 class="font-semibold text-sm mb-3 shrink-0">全部比赛</h3>

        <div v-if="fileStore.loadingAll" class="flex items-center justify-center py-8">
          <span class="text-xs text-[var(--text-muted)]">加载中...</span>
        </div>

        <div v-else-if="fileStore.fileGroups.length === 0" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg class="w-10 h-10 mx-auto mb-2 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <p class="text-xs text-[var(--text-muted)]">还没有参加任何比赛</p>
            <p class="text-xs text-[var(--text-muted)] mt-1">去 <router-link to="/competitions" class="text-blue-400 hover:underline">比赛管理</router-link> 参加比赛</p>
          </div>
        </div>

        <div v-else class="flex-1 space-y-2 min-h-0 overflow-auto">
          <!-- Each competition as a collapsible group -->
          <div
            v-for="group in fileStore.fileGroups"
            :key="group.compId"
            class="rounded-lg border border-[var(--border-color)] overflow-hidden"
          >
            <!-- Competition header -->
            <div
              class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
              @click="toggleGroup(group.compId)"
            >
              <svg
                class="w-3 h-3 text-[var(--text-muted)] transition-transform duration-150 shrink-0"
                :class="{ 'rotate-90': isExpanded(group.compId) }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              <span class="text-sm font-medium truncate flex-1">{{ group.compName }}</span>
              <button
                class="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-purple-400 hover:bg-purple-500/10 transition-colors shrink-0"
                title="新建题目"
                @click.stop="openCreateChallenge(group)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </button>
              <button
                class="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0"
                title="导入文件到此比赛"
                @click.stop="importToCompetition(group)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
              <button
                class="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                title="删除此比赛及所有文件"
                @click.stop="confirmDeleteGroup(group)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
              <button
                class="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-green-400 hover:bg-green-500/10 transition-colors shrink-0"
                title="导出此比赛文件"
                @click.stop="exportGroup(group)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                </svg>
              </button>
            </div>

            <!-- File tree -->
            <div v-if="isExpanded(group.compId)" class="border-t border-[var(--border-color)]">
              <div
                v-if="group.entries.length === 0"
                class="px-3 py-4 text-center text-xs text-[var(--text-muted)]"
              >
                空目录 — 拖拽文件或点击 + 导入
              </div>
              <div
                v-else
                class="p-1"
                @dragenter.prevent
                @dragover.prevent
                @drop.prevent="(e) => onDropToGroup(e, group)"
              >
                <FileTree
                  :entries="group.entries"
                  :selected-path="fileStore.selectedFile?.path"
                  :challenge-path-map="challengePathMap"
                  @select="onFileSelect"
                  @dblclick="onFileDblClick"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview area -->
      <div class="card lg:col-span-3 flex flex-col min-h-0 overflow-hidden">
        <template v-if="!fileStore.selectedFile">
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <svg class="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
              </svg>
              <p class="text-sm text-[var(--text-muted)]">选择左侧文件查看内容</p>
              <p class="text-xs text-[var(--text-muted)] mt-1">支持文本文件预览，双击可在编辑器中打开</p>
            </div>
          </div>
        </template>
        <template v-else>
          <!-- File header -->
          <div class="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-color)] shrink-0">
            <div class="flex items-center gap-2 min-w-0">
              <svg class="w-4 h-4 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="font-medium text-sm truncate">{{ fileStore.selectedFile.name }}</span>
              <span v-if="fileStore.selectedFile.size" class="text-xs text-[var(--text-muted)] shrink-0">
                {{ formatSize(fileStore.selectedFile.size) }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="btn-ghost text-xs px-2 py-1"
                @click="copyFilePath"
              >
                复制路径
              </button>
              <button
                class="btn-ghost text-xs px-2 py-1 text-red-400 hover:bg-red-500/10"
                @click="confirmDeleteFile"
              >
                删除
              </button>
              <button
                v-if="isTextFile"
                class="btn-ghost text-xs px-2 py-1"
                :class="editMode ? 'text-yellow-400' : 'text-blue-400'"
                @click="toggleEditMode"
              >
                {{ editMode ? '预览' : '编辑' }}
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-auto min-h-0">
            <!-- Edit mode -->
            <div v-if="editMode && isTextFile" class="h-full border border-[var(--border-color)] rounded-lg overflow-hidden">
              <MdEditor
                v-model="editableContent"
                :language="detectLanguage(fileStore.selectedFile.name)"
                :dark="isDark"
                @save="saveEditableContent"
              />
            </div>
            <!-- Preview: Markdown -->
            <div v-else-if="!editMode && isMarkdownFile" class="prose prose-sm max-w-none">
              <MdPreview :content="fileStore.fileContent" />
            </div>
            <!-- Preview: Plain text -->
            <pre
              v-else-if="!editMode && isTextFile"
              class="text-xs font-mono text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-all"
            >{{ fileStore.fileContent }}</pre>
            <div v-else class="flex items-center justify-center h-full">
              <div class="text-center text-[var(--text-muted)]">
                <svg class="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-sm">二进制文件，无法预览</p>
              </div>
            </div>
          </div>

          <!-- Edit status bar -->
          <div v-if="editMode && isTextFile" class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] shrink-0">
            <span>{{ fileStore.selectedFile?.name }} · {{ editDirty ? '● 未保存' : '✓ 已保存' }}</span>
            <button class="text-blue-400 hover:underline" @click="saveEditableContent">保存 (Ctrl+S)</button>
          </div>
        </template>
      </div>
    </div>

    <!-- Confirmation modal -->
    <Teleport to="body">
      <div
        v-if="deleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="deleteConfirm = null"
      >
        <div class="card w-96 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div>
              <p class="font-medium text-sm">{{ deleteConfirm.title }}</p>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ deleteConfirm.desc }}</p>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button class="btn-secondary text-xs px-4 py-1.5" @click="deleteConfirm = null">取消</button>
            <button
              class="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg transition-colors"
              :disabled="deleting"
              @click="executeDelete"
            >
              {{ deleting ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Create challenge modal -->
    <Teleport to="body">
      <div
        v-if="showCreateChallenge"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showCreateChallenge = false"
      >
        <div class="card w-96 space-y-4">
          <h3 class="font-semibold text-lg">新建题目 — {{ createChallengeForm.compName }}</h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-[var(--text-muted)] block mb-1">题目名称</label>
              <input
                v-model="createChallengeForm.name"
                class="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-blue-400 transition-colors"
                placeholder="如 baby-bof"
                @keyup.enter="createNewChallenge"
              />
            </div>
            <div>
              <label class="text-xs text-[var(--text-muted)] block mb-1">分类</label>
              <select
                v-model="createChallengeForm.category"
                class="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-blue-400 transition-colors"
              >
                <option v-for="cat in challengeCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button class="btn-secondary text-xs px-4 py-1.5" @click="showCreateChallenge = false">取消</button>
            <button
              class="btn-primary text-xs px-4 py-1.5"
              :disabled="!createChallengeForm.name.trim()"
              @click="createNewChallenge"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFilesStore, type CompetitionFileGroup } from '@/stores/files'
import { useCompetitionsStore } from '@/stores/competitions'
import { useChallengesStore } from '@/stores/challenges'
import { useSettingsStore } from '@/stores/settings'
import FileTree from '@/components/files/FileTree.vue'
import MdEditor from '@/components/editor/MdEditor.vue'
import MdPreview from '@/components/editor/MdPreview.vue'
import type { FileEntry, Challenge } from '@/types'

const router = useRouter()
const fileStore = useFilesStore()
const compStore = useCompetitionsStore()
const chStore = useChallengesStore()
const settingsStore = useSettingsStore()

const isDark = computed(() => settingsStore.settings.theme === 'dark')

// Edit mode
const editMode = ref(false)
const editableContent = ref('')
const editDirty = ref(false)

// Track which competitions are expanded (all expanded by default)
const expandedGroups = ref<Set<number>>(new Set())

// Delete confirmation state
const deleteConfirm = ref<{ type: 'group' | 'file'; title: string; desc: string; payload: any } | null>(null)
const deleting = ref(false)

// Challenge path -> status map for file tree icons
const challengePathMap = ref<Record<string, string>>({})

// New challenge dialog
const showCreateChallenge = ref(false)
const createChallengeForm = ref({ compId: 0, compName: '', name: '', category: 'pwn' })
const challengeCategories = ['pwn', 're', 'web', 'crypto', 'misc']

const binaryExtensions = ['.exe', '.dll', '.so', '.bin', '.zip', '.tar', '.gz', '.7z', '.rar', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.pdf']

const totalFileCount = computed(() => {
  return fileStore.fileGroups.reduce((sum, g) => sum + countFiles(g.entries), 0)
})

const isTextFile = computed(() => {
  const name = fileStore.selectedFile?.name?.toLowerCase() || ''
  return !binaryExtensions.some(ext => name.endsWith(ext))
})

const isMarkdownFile = computed(() => {
  const name = fileStore.selectedFile?.name?.toLowerCase() || ''
  return name.endsWith('.md')
})

function detectLanguage(fileName: string): 'markdown' | 'python' | 'text' {
  const ext = fileName.toLowerCase().split('.').pop()
  if (ext === 'md') return 'markdown'
  if (ext === 'py') return 'python'
  return 'text'
}

function countFiles(entries: FileEntry[]): number {
  let count = 0
  for (const e of entries) {
    if (e.type === 'file') count++
    if (e.children) count += countFiles(e.children)
  }
  return count
}

onMounted(async () => {
  await compStore.loadList()
  const participating = compStore.participating
  if (participating.length > 0) {
    await fileStore.loadAllCompetitionFiles(participating)
    // Expand all by default
    expandedGroups.value = new Set(fileStore.fileGroups.map(g => g.compId))
    // Load challenges for all participating competitions
    await loadAllChallengeMaps()
  }
})

async function loadAllChallengeMaps() {
  const map: Record<string, string> = {}
  for (const comp of compStore.participating) {
    try {
      const challenges = await window.api.challenges.getByCompetition(comp.id)
      for (const ch of challenges) {
        if (ch.directory) {
          map[ch.directory] = ch.status
        }
      }
    } catch { /* ignore */ }
  }
  challengePathMap.value = map
}

function isExpanded(compId: number) {
  return expandedGroups.value.has(compId)
}

function toggleGroup(compId: number) {
  const s = new Set(expandedGroups.value)
  if (s.has(compId)) {
    s.delete(compId)
  } else {
    s.add(compId)
  }
  expandedGroups.value = s
}

function onFileSelect(entry: FileEntry) {
  if (entry.type === 'file') {
    fileStore.openFile(entry.path)
  }
}

function onFileDblClick(entry: FileEntry) {
  if (entry.type === 'file') {
    toggleEditMode()
  }
}

// ── Inline Edit Mode ──

function toggleEditMode() {
  if (editMode.value) {
    editMode.value = false
  } else {
    editMode.value = true
    editableContent.value = fileStore.fileContent
    editDirty.value = false
  }
}

async function saveEditableContent() {
  if (!fileStore.selectedFile?.path) return
  try {
    await window.api.files.writeFile(fileStore.selectedFile.path, editableContent.value)
    fileStore.fileContent = editableContent.value
    editDirty.value = false
  } catch (err) {
    console.error('Failed to save file:', err)
  }
}

// Watch editable content for dirty tracking
watch(editableContent, (val) => {
  if (editMode.value) {
    editDirty.value = val !== fileStore.fileContent
  }
})

// Reset edit mode when selecting a new file
watch(() => fileStore.selectedFile, () => {
  editMode.value = false
})

function openInEditor() {
  if (fileStore.selectedFile?.path) {
    router.push(`/editor/file/${encodeURIComponent(fileStore.selectedFile.path)}`)
  }
}

async function refreshAll() {
  await compStore.loadList()
  const participating = compStore.participating
  if (participating.length > 0) {
    await fileStore.loadAllCompetitionFiles(participating)
  }
  await loadAllChallengeMaps()
}

// ── Export ──

async function exportGroup(group: CompetitionFileGroup) {
  try {
    const result = await window.api.export_.competition(group.compId, group.compName, true)
    if (!result.success) {
      // User canceled
    }
  } catch (err) {
    console.error('Export failed:', err)
  }
}

async function importToCompetition(group: CompetitionFileGroup) {
  const files = await window.api.dialog.openFile({
    title: `导入文件到 ${group.compName}`,
    filters: [{ name: 'All Files', extensions: ['*'] }]
  })
  if (!files || files.length === 0) return

  for (const source of files) {
    const fileName = source.split(/[/\\]/).pop() || 'unknown'
    const dest = `${group.directory}/${fileName}`
    await fileStore.importFile(source, dest)
  }
  // Refresh this group's tree
  await fileStore.refreshGroup(group.compId)
}

async function onDropToGroup(e: DragEvent, group: CompetitionFileGroup) {
  if (!e.dataTransfer?.files.length) return
  for (const file of e.dataTransfer.files) {
    const sourcePath = (file as any).path
    if (sourcePath) {
      const dest = `${group.directory}/${file.name}`
      await fileStore.importFile(sourcePath, dest)
    }
  }
  await fileStore.refreshGroup(group.compId)
}

function copyFilePath() {
  if (fileStore.selectedFile?.path) {
    navigator.clipboard.writeText(fileStore.selectedFile.path)
  }
}

// ── Challenge operations ──

function openCreateChallenge(group: CompetitionFileGroup) {
  createChallengeForm.value = { compId: group.compId, compName: group.compName, name: '', category: 'pwn' }
  showCreateChallenge.value = true
}

async function createNewChallenge() {
  if (!createChallengeForm.value.name.trim()) return
  try {
    await window.api.challenges.create(
      createChallengeForm.value.compId,
      createChallengeForm.value.name.trim(),
      createChallengeForm.value.category
    )
    showCreateChallenge.value = false
    // Refresh file tree and challenge maps
    const group = fileStore.fileGroups.find(g => g.compId === createChallengeForm.value.compId)
    if (group) {
      await fileStore.refreshGroup(group.compId)
    }
    await loadAllChallengeMaps()
  } catch (err) {
    console.error('Failed to create challenge:', err)
  }
}

// ── Delete operations ──

function confirmDeleteGroup(group: CompetitionFileGroup) {
  const fileCount = countFiles(group.entries)
  deleteConfirm.value = {
    type: 'group',
    title: `删除「${group.compName}」`,
    desc: `将删除该比赛的全部 ${fileCount} 个文件及目录，同时从数据库中移除。此操作不可撤销。`,
    payload: group
  }
}

function confirmDeleteFile() {
  const file = fileStore.selectedFile
  if (!file) return
  const isDir = file.type === 'directory'
  deleteConfirm.value = {
    type: 'file',
    title: isDir ? `删除目录「${file.name}」` : `删除文件「${file.name}」`,
    desc: isDir ? '将递归删除该目录下的所有文件。此操作不可撤销。' : '此操作不可撤销。',
    payload: { path: file.path, isDir }
  }
}

async function executeDelete() {
  if (!deleteConfirm.value) return
  deleting.value = true
  try {
    if (deleteConfirm.value.type === 'group') {
      const group = deleteConfirm.value.payload as CompetitionFileGroup
      await window.api.data.clearCompetition(group.compId)
      // Remove from store
      fileStore.fileGroups = fileStore.fileGroups.filter(g => g.compId !== group.compId)
      expandedGroups.value.delete(group.compId)
      if (fileStore.selectedFile?.path?.startsWith(group.directory)) {
        fileStore.selectedFile = null
        fileStore.fileContent = ''
      }
    } else {
      const { path, isDir } = deleteConfirm.value.payload
      await window.api.data.deleteFile(path)
      // Refresh all groups to reflect changes
      const participating = compStore.participating
      if (participating.length > 0) {
        await fileStore.loadAllCompetitionFiles(participating)
      }
      if (fileStore.selectedFile?.path === path) {
        fileStore.selectedFile = null
        fileStore.fileContent = ''
      }
    }
  } catch (err) {
    console.error('Delete failed:', err)
  } finally {
    deleting.value = false
    deleteConfirm.value = null
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
</script>
