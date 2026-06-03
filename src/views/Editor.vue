<template>
  <div class="editor-page animate-fade-in h-full flex flex-col gap-3">
    <!-- Toolbar -->
    <div class="flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3 min-w-0">
        <router-link to="/files" class="btn-ghost w-8 h-8 flex items-center justify-center rounded-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </router-link>
        <div class="min-w-0">
          <h2 class="text-lg font-bold truncate">{{ title }}</h2>
          <p v-if="filePath" class="text-xs text-[var(--text-muted)] font-mono truncate">{{ filePath }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Mode toggle: markdown → show preview toggle -->
        <button
          v-if="editMode === 'markdown'"
          class="btn-ghost text-sm px-3 py-1.5"
          :class="{ 'bg-[var(--bg-tertiary)]': showPreview }"
          @click="showPreview = !showPreview"
        >
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            {{ showPreview ? '隐藏预览' : '预览' }}
          </span>
        </button>

        <!-- Run button for Python -->
        <button
          v-if="editMode === 'python'"
          class="btn-primary text-sm flex items-center gap-1.5"
          :disabled="pythonRunning"
          @click="runPython"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': pythonRunning }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ pythonRunning ? '运行中...' : '运行' }}
        </button>

        <!-- Save button -->
        <button
          class="btn-primary text-sm flex items-center gap-1.5"
          :disabled="!filePath || !dirty"
          @click="handleSave"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          保存
        </button>
      </div>
    </div>

    <!-- Editor area -->
    <div class="flex-1 flex gap-3 min-h-0">
      <!-- Editor panel -->
      <div class="flex-1 card overflow-hidden min-w-0" :class="{ 'w-1/2': showPreview || showOutput }">
        <MdEditor
          v-model="content"
          :language="editMode"
          @save="handleSave"
        />
      </div>

      <!-- Preview panel (markdown) -->
      <div
        v-if="showPreview && editMode === 'markdown'"
        class="flex-1 card overflow-auto min-w-0"
      >
        <MdPreview :content="content" />
      </div>

      <!-- Output panel (python) -->
      <div
        v-if="showOutput && editMode === 'python'"
        class="flex-1 card overflow-auto min-w-0 flex flex-col"
      >
        <div class="flex items-center justify-between mb-3 shrink-0">
          <h3 class="font-semibold text-sm">执行输出</h3>
          <button class="btn-ghost text-xs px-2 py-1" @click="showOutput = false">
            关闭
          </button>
        </div>
        <div class="flex-1 overflow-auto">
          <pre
            class="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all"
            :class="pythonExitCode === 0 ? 'text-green-400' : 'text-red-400'"
          ><code>{{ pythonOutput || '无输出' }}</code></pre>
        </div>
      </div>
    </div>

    <!-- Python version indicator -->
    <div class="flex items-center gap-2 text-xs text-[var(--text-muted)] shrink-0">
      <span v-if="pythonVersion" class="flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
        {{ pythonVersion }}
      </span>
      <span v-else class="flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
        Python 未检测到
      </span>
      <span v-if="filePath" class="font-mono opacity-60 truncate">{{ filePath }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import MdEditor from '@/components/editor/MdEditor.vue'
import MdPreview from '@/components/editor/MdPreview.vue'

const route = useRoute()

const content = ref('')
const filePath = ref('')
const originalContent = ref('')
const editMode = ref<'markdown' | 'python'>('markdown')
const showPreview = ref(false)
const showOutput = ref(false)
const pythonRunning = ref(false)
const pythonOutput = ref('')
const pythonExitCode = ref<number | null>(null)
const pythonVersion = ref('')

const dirty = computed(() => content.value !== originalContent.value)

const title = computed(() => {
  if (filePath.value) {
    const name = filePath.value.split(/[/\\]/).pop() || '未命名'
    return name
  }
  return editMode.value === 'python' ? '新建 Python 脚本' : '新建 Markdown'
})

onMounted(async () => {
  // Check Python availability
  try {
    const py = await window.api.python.checkPython()
    if (py.available) {
      pythonVersion.value = py.version
    }
  } catch {
    // Python not available
  }

  // Determine mode from route
  const type = route.params.type as string
  const id = route.params.id as string | undefined

  if (type === 'python') {
    editMode.value = 'python'
  } else {
    editMode.value = 'markdown'
  }

  // If file path provided, load it
  if (id && (type === 'file' || type === 'notes')) {
    const decodedPath = decodeURIComponent(id)
    filePath.value = decodedPath
    try {
      const fileContent = await window.api.files.readFile(decodedPath)
      content.value = fileContent
      originalContent.value = fileContent

      // Auto-detect mode from extension
      if (decodedPath.endsWith('.py')) {
        editMode.value = 'python'
      }
    } catch (err) {
      console.error('Failed to load file:', err)
      content.value = `// 无法加载文件: ${decodedPath}`
    }
  }

  // If markdown and there's content, show preview by default
  if (editMode.value === 'markdown' && content.value) {
    showPreview.value = true
  }
})

watch(() => route.params.type, (newType) => {
  if (newType === 'python') {
    editMode.value = 'python'
  } else {
    editMode.value = 'markdown'
  }
})

async function handleSave() {
  if (!filePath.value || !dirty.value) return

  try {
    await window.api.files.writeFile(filePath.value, content.value)
    originalContent.value = content.value
  } catch (err) {
    console.error('Failed to save:', err)
  }
}

async function runPython() {
  if (pythonRunning.value) return
  pythonRunning.value = true
  showOutput.value = true
  pythonOutput.value = ''

  // Save first if dirty
  if (dirty.value && filePath.value) {
    await handleSave()
  }

  if (!filePath.value) {
    pythonOutput.value = '错误：文件尚未保存，无法执行'
    pythonExitCode.value = -1
    pythonRunning.value = false
    return
  }

  try {
    const result = await window.api.python.runScript(filePath.value)
    pythonExitCode.value = result.exitCode
    if (result.stdout) {
      pythonOutput.value = result.stdout
    }
    if (result.stderr) {
      pythonOutput.value += (pythonOutput.value ? '\n' : '') + result.stderr
    }
  } catch (err) {
    pythonOutput.value = `执行错误: ${err}`
    pythonExitCode.value = -1
  } finally {
    pythonRunning.value = false
  }
}
</script>
