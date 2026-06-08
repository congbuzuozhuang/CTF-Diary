<template>
  <div class="page max-w-6xl mx-auto" v-if="cve">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <button class="btn-ghost p-2 rounded-lg" @click="goBack">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-lg font-semibold text-[var(--text-primary)]">{{ cve.cve_number }}</span>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="store.getStatusColor(cve.status)"
            >{{ store.getStatusLabel(cve.status) }}</span>
          </div>
          <p v-if="cve.title" class="text-sm text-[var(--text-muted)] mt-0.5">{{ cve.title }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Status dropdown -->
        <select
          :value="cve.status"
          class="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-blue-400"
          @change="handleStatusChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="pending">待复现</option>
          <option value="reproducing">复现中</option>
          <option value="completed">已完成</option>
        </select>
        <button class="btn-ghost px-3 py-1.5 text-sm text-red-400" @click="confirmDelete">删除</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-0 border-b border-[var(--border-color)] mb-6">
      <button
        v-for="tab in detailTabs"
        :key="tab.key"
        class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors"
        :class="activeDetailTab === tab.key
          ? 'text-blue-400 border-blue-400'
          : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'"
        @click="activeDetailTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- Tab: Overview -->
    <div v-if="activeDetailTab === 'overview'">
      <!-- Info Cards -->
      <div class="grid grid-cols-4 gap-3 mb-6">
        <div class="card text-center">
          <div class="text-xs text-[var(--text-muted)] mb-1">严重程度</div>
          <div
            class="text-sm font-semibold"
            :class="severityTextClass"
          >{{ cve.severity || '未指定' }}</div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-[var(--text-muted)] mb-1">CVSS</div>
          <div class="text-sm font-semibold text-[var(--text-primary)] font-mono">
            {{ cve.cvss_score > 0 ? cve.cvss_score : '-' }}
          </div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-[var(--text-muted)] mb-1">Docker</div>
          <div class="text-sm font-semibold">
            <span v-if="cve.docker_image" class="text-blue-400">已关联</span>
            <span v-else class="text-[var(--text-muted)]">未关联</span>
          </div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-[var(--text-muted)] mb-1">创建时间</div>
          <div class="text-xs text-[var(--text-primary)]">{{ formatDate(cve.created_at) }}</div>
        </div>
      </div>

      <!-- Description -->
      <div v-if="cve.description" class="card mb-6">
        <h3 class="text-sm font-medium text-[var(--text-secondary)] mb-2">描述</h3>
        <p class="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{{ cve.description }}</p>
      </div>

      <!-- Inline Editor: Notes -->
      <div class="card mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-[var(--text-secondary)]">笔记 (notes.md)</h3>
          <span v-if="notesDirty" class="text-xs text-blue-400">● 未保存</span>
          <span v-else class="text-xs text-green-400">✓ 已保存</span>
        </div>
        <div class="editor-frame" style="height: 320px">
          <MdEditor
            v-model="notesContent"
            :language="'markdown'"
            :dark="isDark"
            @save="saveNotes"
          />
        </div>
        <div class="flex items-center justify-between mt-2 text-xs text-[var(--text-muted)]">
          <span>{{ notesStats }}</span>
          <button
            class="text-blue-400 hover:underline"
            :disabled="savingNotes"
            @click="saveNotes"
          >{{ savingNotes ? '保存中...' : 'Ctrl+S 保存' }}</button>
        </div>
      </div>

      <!-- Inline Editor: Writeup -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-[var(--text-secondary)]">📄 复现报告 (writeup.md)</h3>
          <span v-if="writeupDirty" class="text-xs text-blue-400">● 未保存</span>
          <span v-else class="text-xs text-green-400">✓ 已保存</span>
        </div>
        <div class="editor-frame" style="height: 400px">
          <MdEditor
            v-model="writeupContent"
            :language="'markdown'"
            :dark="isDark"
            @save="saveWriteup"
          />
        </div>
        <div class="flex items-center justify-between mt-2 text-xs text-[var(--text-muted)]">
          <span>{{ writeupStats }}</span>
          <button
            class="text-blue-400 hover:underline"
            :disabled="savingWriteup"
            @click="saveWriteup"
          >{{ savingWriteup ? '保存中...' : 'Ctrl+S 保存' }}</button>
        </div>
      </div>
    </div>

    <!-- Tab: Files -->
    <div v-if="activeDetailTab === 'files'" class="flex gap-4" style="height: calc(100vh - 260px)">
      <!-- File Tree -->
      <div class="w-56 shrink-0 card overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-[var(--text-secondary)]">文件</span>
          <button
            class="text-xs text-blue-400 hover:underline"
            title="导入文件"
            @click="importFile"
          >导入</button>
        </div>
        <FileTree
          :entries="fileEntries"
          :selected-path="selectedFilePath"
          :placeholder="'空目录'"
          @select="onFileSelect"
          @dblclick="onFileOpen"
        />
      </div>

      <!-- File Content -->
      <div class="flex-1 card flex flex-col min-w-0">
        <template v-if="selectedFilePath">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 min-w-0">
              <svg class="w-4 h-4 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-sm text-[var(--text-secondary)] truncate">{{ selectedFileName }}</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1 text-xs text-[var(--text-muted)] cursor-pointer">
                <input type="checkbox" v-model="editMode" class="rounded" />
                编辑
              </label>
              <button class="text-xs text-blue-400 hover:underline" @click="saveCurrentFile" v-if="editMode">保存</button>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-if="editMode && isTextFile" class="flex-1 min-h-0 editor-frame">
            <MdEditor
              v-model="currentFileContent"
              :language="detectLanguage(selectedFilePath)"
              :dark="isDark"
              @save="saveCurrentFile"
            />
          </div>
          <!-- Preview Mode: Markdown -->
          <div v-else-if="!editMode && isMarkdownFile" class="flex-1 overflow-y-auto">
            <MdPreview :content="currentFileContent" />
          </div>
          <!-- Preview Mode: Text -->
          <div v-else class="flex-1 overflow-y-auto">
            <pre class="text-sm font-mono text-[var(--text-primary)] whitespace-pre-wrap break-all p-1">{{ currentFileContent }}</pre>
          </div>
        </template>
        <template v-else>
          <div class="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-sm">选择左侧文件查看内容</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Tab: Docker -->
    <div v-if="activeDetailTab === 'docker'">
      <!-- Docker Status -->
      <div class="card mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span v-if="dockerAvailable" class="w-2 h-2 rounded-full bg-green-400"></span>
            <span v-else class="w-2 h-2 rounded-full bg-red-400"></span>
            <span class="text-sm font-medium text-[var(--text-primary)]">
              {{ dockerAvailable ? `Docker 可用 (${dockerVersion})` : 'Docker 未安装或未运行' }}
            </span>
          </div>
          <button class="btn-ghost text-xs text-blue-400" @click="checkDockerStatus">刷新</button>
        </div>
      </div>

      <!-- Image Management -->
      <div class="card mb-4">
        <h3 class="text-sm font-medium text-[var(--text-secondary)] mb-3">镜像管理</h3>

        <div v-if="cve.docker_image" class="flex items-center justify-between mb-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <span class="text-sm font-mono text-[var(--text-primary)]">{{ cve.docker_image }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="text-xs text-[var(--text-muted)] hover:text-red-400" @click="unlinkImage">取消关联</button>
            <button class="text-xs text-red-400 hover:underline" @click="removeLinkedImage">删除镜像</button>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-3">
          <button class="btn-secondary text-xs px-3 py-1.5" @click="importDockerImage">导入镜像 (.tar)</button>
          <span v-if="linkingImage" class="text-xs text-[var(--text-muted)]">处理中...</span>
        </div>

        <!-- Available images to link -->
        <div v-if="dockerImages.length > 0" class="text-xs text-[var(--text-muted)] mb-2">可选 Docker 镜像：</div>
        <div
          v-for="img in dockerImages.slice(0, 10)"
          :key="img.ID"
          class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[var(--bg-tertiary)] text-xs"
        >
          <span class="font-mono text-[var(--text-primary)]">{{ img.Repository }}:{{ img.Tag }}</span>
          <button class="text-blue-400 hover:underline" @click="linkImage(`${img.Repository}:${img.Tag}`)">关联</button>
        </div>
      </div>

      <!-- Container Management -->
      <div v-if="cve.docker_image" class="card mb-4">
        <h3 class="text-sm font-medium text-[var(--text-secondary)] mb-3">容器管理</h3>

        <!-- Run controls -->
        <div class="mb-4 p-3 rounded-lg bg-[var(--bg-tertiary)] space-y-3">
          <div>
            <label class="block text-xs text-[var(--text-muted)] mb-1">端口映射</label>
            <input
              v-model="portMapping"
              type="text"
              placeholder="8080:80, 4443:443"
              class="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-xs font-mono focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label class="block text-xs text-[var(--text-muted)] mb-1">环境变量</label>
            <input
              v-model="envVars"
              type="text"
              placeholder="FLAG=ctf{test}, DEBUG=1"
              class="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-xs font-mono focus:outline-none focus:border-blue-400"
            />
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-primary text-xs px-3 py-1.5" :disabled="dockerLoading" @click="startContainer(false)">
              <span v-if="dockerLoading" class="inline-flex items-center gap-1">
                <svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                启动中...
              </span>
              <span v-else>后台运行</span>
            </button>
            <button class="btn-secondary text-xs px-3 py-1.5" :disabled="dockerLoading" @click="startContainer(true)">
              临时运行 (--rm)
            </button>
          </div>
        </div>

        <!-- Running container info -->
        <div v-if="containerStatus" class="p-3 rounded-lg bg-[var(--bg-tertiary)] mb-3">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div><span class="text-[var(--text-muted)]">状态：</span>
              <span :class="containerStatus.running ? 'text-green-400' : 'text-red-400'">
                {{ containerStatus.running ? '🟢 运行中' : '🔴 ' + containerStatus.status }}
              </span>
            </div>
            <div>
              <span class="text-[var(--text-muted)]">容器：</span>
              <span class="font-mono text-[var(--text-primary)]">{{ cve.docker_container || '-' }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <button
              v-if="containerStatus.running"
              class="btn-ghost text-xs text-yellow-400 px-2 py-1"
              @click="stopCurrentContainer"
            >停止容器</button>
            <button
              v-if="containerStatus && !containerStatus.running"
              class="btn-ghost text-xs text-red-400 px-2 py-1"
              @click="removeCurrentContainer"
            >删除容器</button>
            <button class="btn-ghost text-xs text-blue-400 px-2 py-1" @click="refreshContainerStatus">刷新状态</button>
            <button class="btn-ghost text-xs text-blue-400 px-2 py-1" @click="showLogs = !showLogs">{{ showLogs ? '收起日志' : '查看日志' }}</button>
          </div>
        </div>

        <!-- Logs -->
        <div v-if="showLogs" ref="logsContainer" class="mt-3">
          <h4 class="text-xs font-medium text-[var(--text-secondary)] mb-2">容器日志</h4>
          <pre class="text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap">{{ containerLogs || '加载中...' }}</pre>
        </div>
      </div>
    </div>

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
              <p class="text-xs text-[var(--text-muted)]">确定要删除「{{ cve?.cve_number }}」吗？这将同时删除所有关联文件。</p>
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

    <!-- Confirm Modal -->
    <Teleport to="body">
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showConfirmModal = false"
      >
        <div class="card w-96 p-6">
          <p class="text-sm text-[var(--text-primary)] mb-6">{{ confirmMessage }}</p>
          <div class="flex items-center justify-end gap-3">
            <button class="btn-ghost px-4 py-2 text-sm" @click="showConfirmModal = false">取消</button>
            <button class="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600" @click="handleConfirm">确认</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <!-- Loading / Error -->
  <div v-else-if="store.loading" class="flex items-center justify-center py-20">
    <svg class="animate-spin w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
  <div v-else class="text-center py-20 text-[var(--text-muted)]">CVE 未找到</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCvesStore } from '@/stores/cves'
import { useDockerStore } from '@/stores/docker'
import { useSettingsStore } from '@/stores/settings'
import MdEditor from '@/components/editor/MdEditor.vue'
import MdPreview from '@/components/editor/MdPreview.vue'
import FileTree from '@/components/files/FileTree.vue'
import type { FileEntry, DockerImageInfo } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useCvesStore()
const dockerStore = useDockerStore()
const settingsStore = useSettingsStore()

const cve = computed(() => store.currentCve)
const isDark = computed(() => settingsStore.settings.theme === 'dark')

const activeDetailTab = ref('overview')
const detailTabs = [
  { key: 'overview', label: '概览' },
  { key: 'files', label: '文件管理' },
  { key: 'docker', label: 'Docker 环境' }
]

// Overview tab state
const notesContent = ref('')
const notesDirty = ref(false)
const savingNotes = ref(false)
const writeupContent = ref('')
const writeupDirty = ref(false)
const savingWriteup = ref(false)
const originalNotes = ref('')
const originalWriteup = ref('')
const notesStats = ref('')
const writeupStats = ref('')

// Files tab state
const fileEntries = ref<FileEntry[]>([])
let allFiles: FileEntry[] = []
const selectedFilePath = ref('')
const currentFileContent = ref('')
const editMode = ref(false)

// Docker tab state
const dockerAvailable = ref(false)
const dockerVersion = ref('')
const dockerImages = ref<DockerImageInfo[]>([])
const dockerLoading = ref(false)
const linkingImage = ref(false)
const containerStatus = ref<{ running: boolean; status: string } | null>(null)
const containerLogs = ref('')
const showLogs = ref(false)
const portMapping = ref('')
const envVars = ref('')

// Delete modal state
const showDeleteModal = ref(false)
const deleting = ref(false)

// Generic confirm dialog
const showConfirmModal = ref(false)
const confirmMessage = ref('')
let confirmCallback: (() => void) | null = null

function requestConfirm(message: string, onConfirm: () => void) {
  confirmMessage.value = message
  confirmCallback = onConfirm
  showConfirmModal.value = true
}

function handleConfirm() {
  showConfirmModal.value = false
  confirmCallback?.()
  confirmCallback = null
}

// Computed
const selectedFileName = computed(() => {
  if (!selectedFilePath.value) return ''
  return selectedFilePath.value.split(/[/\\]/).pop() || ''
})

const isMarkdownFile = computed(() => {
  return selectedFilePath.value.toLowerCase().endsWith('.md')
})

const isTextFile = computed(() => {
  const ext = selectedFilePath.value.toLowerCase().split('.').pop() || ''
  const textExts = ['md', 'txt', 'py', 'c', 'cpp', 'h', 'java', 'js', 'ts', 'json', 'xml', 'yml', 'yaml', 'html', 'css', 'sh', 'bat', 'ps1']
  return textExts.includes(ext)
})

const severityTextClass = computed(() => {
  if (!cve.value?.severity) return 'text-[var(--text-muted)]'
  switch (cve.value.severity.toLowerCase()) {
    case 'critical': return 'text-red-400'
    case 'high': return 'text-orange-400'
    case 'medium': return 'text-yellow-400'
    case 'low': return 'text-blue-400'
    default: return 'text-[var(--text-muted)]'
  }
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function detectLanguage(filePath: string): 'markdown' | 'python' | 'text' {
  const ext = filePath.toLowerCase().split('.').pop()
  if (ext === 'md') return 'markdown'
  if (ext === 'py') return 'python'
  return 'text'
}

function goBack(): void {
  router.push('/cves')
}

// ── Overview: Notes & Writeup ──

async function loadFileContent(filePath: string): Promise<string> {
  try {
    return await window.api.files.readFile(filePath) || ''
  } catch {
    return ''
  }
}

watch(notesContent, (val) => {
  notesDirty.value = val !== originalNotes.value
  notesStats.value = `Markdown · ${val.length} 字符`
}, { immediate: true })

watch(writeupContent, (val) => {
  writeupDirty.value = val !== originalWriteup.value
  writeupStats.value = `Markdown · ${val.length} 字符`
}, { immediate: true })

async function saveNotes(): Promise<void> {
  if (!cve.value?.directory) return
  savingNotes.value = true
  try {
    const path = cve.value.directory + '/notes.md'
    await window.api.files.writeFile(path, notesContent.value)
    await store.update(cve.value.id, { notes: notesContent.value })
    originalNotes.value = notesContent.value
    notesDirty.value = false
  } finally {
    savingNotes.value = false
  }
}

async function saveWriteup(): Promise<void> {
  if (!cve.value?.directory) return
  savingWriteup.value = true
  try {
    const path = cve.value.directory + '/writeup.md'
    await window.api.files.writeFile(path, writeupContent.value)
    originalWriteup.value = writeupContent.value
    writeupDirty.value = false
  } finally {
    savingWriteup.value = false
  }
}

// ── Files Tab ──

function flattenEntries(entries: FileEntry[], depth: number = 0): FileEntry[] {
  const result: FileEntry[] = []
  for (const entry of entries) {
    result.push({ ...entry, name: '  '.repeat(depth) + entry.name })
    if (entry.children) {
      result.push(...flattenEntries(entry.children, depth + 1))
    }
  }
  return result
}

async function loadFiles(): Promise<void> {
  if (!cve.value?.directory) return
  try {
    const raw = await window.api.files.readDir(cve.value.directory)
    allFiles = raw || []
    fileEntries.value = raw || []
  } catch (err) {
    console.error('Failed to load files:', err)
  }
}

function onFileSelect(entry: FileEntry): void {
  // Only handle files, not directories
  if (entry.type === 'directory') return
  selectedFilePath.value = entry.path
}

async function onFileOpen(entry: FileEntry): Promise<void> {
  if (entry.type === 'directory') return
  selectedFilePath.value = entry.path
  editMode.value = true

  try {
    currentFileContent.value = await window.api.files.readFile(entry.path) || ''
  } catch {
    currentFileContent.value = ''
  }
}

async function saveCurrentFile(): Promise<void> {
  if (!selectedFilePath.value) return
  try {
    await window.api.files.writeFile(selectedFilePath.value, currentFileContent.value)
  } catch (err) {
    console.error('Failed to save file:', err)
  }
}

async function importFile(): Promise<void> {
  if (!cve.value?.directory) return
  try {
    const files = await window.api.dialog.openFile()
    if (files && files.length > 0) {
      for (const src of files) {
        const name = src.split(/[/\\]/).pop() || 'file'
        const dest = cve.value.directory + '/' + name
        await window.api.files.importFile(src, dest)
      }
      await loadFiles()
    }
  } catch (err) {
    console.error('Failed to import file:', err)
  }
}

// ── Status change ──

async function handleStatusChange(status: string): Promise<void> {
  if (!cve.value) return
  await store.updateStatus(cve.value.id, status)
}

// ── Delete ──

function confirmDelete(): void {
  showDeleteModal.value = true
}

async function handleDelete(): Promise<void> {
  if (!cve.value) return
  deleting.value = true
  try {
    // Clean up Docker container if exists
    if (cve.value.docker_container) {
      try {
        await dockerStore.stopContainer(cve.value.docker_container)
        await dockerStore.removeContainer(cve.value.docker_container)
      } catch { /* container may already be gone */ }
    }
    // Clean up Docker image if exists
    if (cve.value.docker_image) {
      try {
        await dockerStore.removeImage(cve.value.docker_image, true)
      } catch { /* image may already be gone */ }
    }
    await store.deleteCve(cve.value.id)
    router.push('/cves')
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

// ── Docker Tab ──

async function checkDockerStatus(): Promise<void> {
  const ok = await dockerStore.checkDocker()
  dockerAvailable.value = ok
  dockerVersion.value = dockerStore.dockerVersion
  if (ok) {
    await dockerStore.loadImages()
    dockerImages.value = dockerStore.images
  }
}

async function importDockerImage(): Promise<void> {
  try {
    const files = await window.api.dialog.openFile({
      title: '选择 Docker 镜像文件',
      filters: [{ name: 'Docker Image', extensions: ['tar'] }]
    })
    if (files && files.length > 0) {
      dockerLoading.value = true
      const ok = await dockerStore.importImage(files[0])
      if (ok) {
        await dockerStore.loadImages()
        dockerImages.value = dockerStore.images
      }
    }
  } catch (err) {
    console.error('Failed to import Docker image:', err)
  } finally {
    dockerLoading.value = false
  }
}

async function linkImage(imageName: string): Promise<void> {
  if (!cve.value) return
  linkingImage.value = true
  try {
    const ok = await dockerStore.linkImageToCve(cve.value.id, imageName)
    if (ok) {
      await store.loadById(cve.value.id)
    }
  } finally {
    linkingImage.value = false
  }
}

async function unlinkImage(): Promise<void> {
  if (!cve.value) return
  await store.update(cve.value.id, { docker_image: '', docker_container: '' })
}

async function startContainer(tempMode: boolean): Promise<void> {
  if (!cve.value?.docker_image) return
  dockerLoading.value = true

  const mappings = portMapping.value
    ? portMapping.value.split(',').map(s => s.trim()).filter(Boolean)
    : []
  const envs = envVars.value
    ? envVars.value.split(',').map(s => s.trim()).filter(Boolean)
    : []

  try {
    if (tempMode) {
      const cid = await dockerStore.runTempContainer({
        imageName: cve.value.docker_image,
        portMappings: mappings,
        envVars: envs,
        name: `cve-${cve.value.id}-temp-${Date.now()}`
      })
      if (cid) {
        await store.update(cve.value.id, { docker_container: cid })
        await refreshContainerStatus()
      }
    } else {
      const cid = await dockerStore.runContainer(cve.value.id, {
        imageName: cve.value.docker_image,
        portMappings: mappings,
        envVars: envs,
        name: `cve-${cve.value.id}-container`
      })
      if (cid) {
        await store.update(cve.value.id, { docker_container: cid })
        await refreshContainerStatus()
      }
    }
  } finally {
    dockerLoading.value = false
  }
}

async function stopCurrentContainer(): Promise<void> {
  if (!cve.value?.docker_container) return
  dockerLoading.value = true
  try {
    await dockerStore.stopContainer(cve.value.docker_container)
    containerStatus.value = { running: false, status: 'stopped' }
  } finally {
    dockerLoading.value = false
  }
}

async function refreshContainerStatus(): Promise<void> {
  if (!cve.value?.docker_container) return
  containerStatus.value = await dockerStore.checkContainerStatus(cve.value.docker_container)
  if (containerStatus.value?.running) {
    containerLogs.value = await dockerStore.getContainerLogs(cve.value.docker_container, 100)
  }
}

async function removeCurrentContainer(): Promise<void> {
  if (!cve.value?.docker_container) return
  requestConfirm(`确定要删除容器「${cve.value.docker_container}」吗？`, async () => {
    dockerLoading.value = true
    try {
      await dockerStore.removeContainer(cve.value.docker_container)
      await store.update(cve.value.id, { docker_container: '' })
      containerStatus.value = null
      containerLogs.value = ''
    } finally {
      dockerLoading.value = false
    }
  })
}

async function removeLinkedImage(): Promise<void> {
  if (!cve.value?.docker_image) return
  requestConfirm(`确定要删除镜像「${cve.value.docker_image}」吗？\n\n如果有容器正在使用该镜像，删除将会失败。`, async () => {
  dockerLoading.value = true
  try {
    const ok = await dockerStore.removeImage(cve.value.docker_image)
    if (ok) {
      await store.update(cve.value.id, { docker_image: '', docker_container: '' })
      containerStatus.value = null
    }
  } finally {
    dockerLoading.value = false
  }
  })
}

// ── Lifecycle ──

// ── Lifecycle ──

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) {
    router.push('/cves')
    return
  }

  await store.loadById(id)

  if (cve.value?.directory) {
    // Load notes & writeup
    const notesPath = cve.value.directory + '/notes.md'
    const writeupPath = cve.value.directory + '/writeup.md'

    const [notes, writeup] = await Promise.all([
      loadFileContent(notesPath),
      loadFileContent(writeupPath)
    ])

    notesContent.value = notes
    originalNotes.value = notes
    notesStats.value = `Markdown · ${notes.length} 字符`

    writeupContent.value = writeup
    originalWriteup.value = writeup
    writeupStats.value = `Markdown · ${writeup.length} 字符`

    // Load files
    await loadFiles()
  }

  // Check Docker
  await checkDockerStatus()
})
</script>
