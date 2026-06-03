<template>
  <div class="settings animate-fade-in space-y-8">
    <div>
      <h2 class="text-2xl font-bold">⚙️ 设置</h2>
      <p class="text-[var(--text-secondary)] mt-1 text-sm">个性化定制你的 CTF Diary</p>
    </div>

    <!-- Background -->
    <section class="card space-y-4">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        背景图片
      </h3>

      <!-- Preset backgrounds -->
      <div class="grid grid-cols-4 md:grid-cols-6 gap-3">
        <!-- Default / none -->
        <div
          class="aspect-video rounded-lg cursor-pointer ring-2 ring-offset-2 ring-offset-[var(--bg-primary)] transition-all hover:scale-105 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"
          :class="currentBg === '' ? 'ring-blue-500' : 'ring-transparent'"
          @click="selectBackground('')"
          title="默认暗色渐变"
        >
          <span class="text-xs text-[var(--text-muted)]">默认</span>
        </div>

        <!-- Preset gradients -->
        <div
          v-for="preset in presets"
          :key="preset.name"
          class="aspect-video rounded-lg cursor-pointer ring-2 ring-offset-2 ring-offset-[var(--bg-primary)] transition-all hover:scale-105"
          :class="currentBg === preset.value ? 'ring-blue-500' : 'ring-transparent'"
          :style="{ background: preset.value }"
          :title="preset.name"
          @click="selectBackground(preset.value)"
        />

        <!-- Custom uploaded backgrounds -->
        <div
          v-for="(bg, idx) in customBackgrounds"
          :key="'custom-' + idx"
          class="aspect-video rounded-lg bg-cover bg-center cursor-pointer ring-2 ring-offset-2 ring-offset-slate-900 transition-all hover:scale-105 relative group"
          :class="currentBg === bg ? 'ring-blue-500' : 'ring-transparent'"
          :style="{ backgroundImage: `url('${bg}')` }"
          @click="selectBackground(bg)"
        >
          <button
            class="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white
                   flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="删除此背景"
            @click.stop="removeCustomBg(bg)"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Upload button -->
        <div
          class="aspect-video rounded-lg border-2 border-dashed border-[var(--border-color)]
                 flex items-center justify-center cursor-pointer
                 hover:border-[var(--border-hover)] hover:bg-[var(--btn-ghost-hover-bg)] transition-all"
          @click="uploadBackground"
        >
          <div class="text-center">
            <svg class="w-5 h-5 mx-auto mb-1 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="text-xs text-[var(--text-muted)]">上传</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Theme -->
    <section class="card space-y-4">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
        </svg>
        主题
      </h3>
      <div class="flex gap-3">
        <button
          class="flex-1 p-4 rounded-lg border-2 transition-all"
          :class="settingsStore.settings.theme === 'dark'
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-[var(--border-color)] hover:border-slate-500'"
          @click="settingsStore.set('theme', 'dark')"
        >
          <div class="text-2xl mb-1">🌙</div>
          <div class="text-sm font-medium">暗色模式</div>
          <div class="text-xs text-[var(--text-muted)] mt-0.5">护眼舒适</div>
        </button>
        <button
          class="flex-1 p-4 rounded-lg border-2 transition-all"
          :class="settingsStore.settings.theme === 'light'
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-[var(--border-color)] hover:border-slate-500'"
          @click="settingsStore.set('theme', 'light')"
        >
          <div class="text-2xl mb-1">☀️</div>
          <div class="text-sm font-medium">亮色模式</div>
          <div class="text-xs text-[var(--text-muted)] mt-0.5">清晰明亮</div>
        </button>
      </div>
    </section>

    <!-- Card opacity -->
    <section class="card space-y-4">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
        卡片透明度
      </h3>
      <div class="flex items-center gap-4">
        <span class="text-xs text-[var(--text-muted)] shrink-0">透明</span>
        <input
          type="range"
          min="0.4"
          max="1"
          step="0.05"
          :value="settingsStore.settings.card_opacity"
          class="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                 bg-[var(--bg-tertiary)]
                 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:w-4
                 [&::-webkit-slider-thumb]:h-4
                 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-blue-500
                 [&::-webkit-slider-thumb]:cursor-pointer
                 [&::-webkit-slider-thumb]:shadow-md"
          @input="settingsStore.set('card_opacity', ($event.target as HTMLInputElement).value)"
        />
        <span class="text-xs text-[var(--text-muted)] shrink-0">实色</span>
        <span class="text-xs font-mono w-10 text-right text-[var(--text-secondary)]">
          {{ Math.round(Number(settingsStore.settings.card_opacity) * 100) }}%
        </span>
      </div>
    </section>

    <!-- Notifications -->
    <section class="card space-y-4">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        比赛通知
      </h3>

      <!-- Enable toggle -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm">启用通知</p>
          <p class="text-xs text-[var(--text-muted)]">比赛临近时弹窗提醒</p>
        </div>
        <button
          class="relative w-10 h-5 rounded-full transition-colors duration-200"
          :class="settingsStore.settings.notify_enabled === 'true' ? 'bg-blue-500' : 'bg-[var(--bg-tertiary)]'"
          @click="settingsStore.set('notify_enabled', settingsStore.settings.notify_enabled === 'true' ? 'false' : 'true')"
        >
          <span
            class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
            :class="settingsStore.settings.notify_enabled === 'true' ? 'left-5' : 'left-0.5'"
          />
        </button>
      </div>

      <!-- Days before -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm">提前天数</p>
          <p class="text-xs text-[var(--text-muted)]">比赛开始前多少天通知</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono w-14 text-right text-[var(--text-secondary)]">
            {{ settingsStore.settings.notify_before_days }} 天
          </span>
          <select
            class="input w-auto text-xs"
            :value="settingsStore.settings.notify_before_days"
            @change="settingsStore.set('notify_before_days', ($event.target as HTMLSelectElement).value)"
          >
            <option value="1">1 天</option>
            <option value="2">2 天</option>
            <option value="3">3 天</option>
            <option value="5">5 天</option>
            <option value="7">7 天</option>
          </select>
        </div>
      </div>
    </section>

    <!-- General -->
    <section class="card space-y-4">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
        </svg>
        通用设置
      </h3>
      <div class="space-y-4">
        <!-- Font size -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm">字体大小</p>
            <p class="text-xs text-[var(--text-muted)]">编辑器内文字大小</p>
          </div>
          <select
            class="input w-auto text-xs"
            :value="settingsStore.settings.font_size"
            @change="settingsStore.set('font_size', ($event.target as HTMLSelectElement).value)"
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
          </select>
        </div>

        <!-- Language -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm">语言</p>
            <p class="text-xs text-[var(--text-muted)]">界面显示语言</p>
          </div>
          <select
            class="input w-auto text-xs"
            :value="settingsStore.settings.language"
            @change="settingsStore.set('language', ($event.target as HTMLSelectElement).value)"
          >
            <option value="zh">简体中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Data directory -->
    <section class="card space-y-4">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
        比赛文件存储路径
      </h3>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm">当前路径</p>
            <p class="text-xs text-[var(--text-muted)] font-mono mt-0.5 break-all">{{ competitionsDir || '默认路径' }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
            @click="pickCompetitionsDir"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            选择文件夹
          </button>
          <button
            v-if="customCompetitionsDir"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
            @click="resetCompetitionsDir"
          >
            恢复默认
          </button>
        </div>

        <p class="text-xs text-[var(--text-muted)]">
          比赛附件、题目文件夹、笔记将保存在此路径下。修改后新创建的比赛会使用新路径，已有比赛不受影响。
        </p>
      </div>
    </section>

    <!-- Data management -->
    <section class="card space-y-4">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        数据管理
      </h3>

      <!-- Stats -->
      <div v-if="dataStats" class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div class="bg-[var(--bg-secondary)] rounded-lg p-3">
          <p class="text-lg font-bold">{{ dataStats.competitions }}</p>
          <p class="text-xs text-[var(--text-muted)]">比赛</p>
        </div>
        <div class="bg-[var(--bg-secondary)] rounded-lg p-3">
          <p class="text-lg font-bold">{{ dataStats.checkins }}</p>
          <p class="text-xs text-[var(--text-muted)]">打卡</p>
        </div>
        <div class="bg-[var(--bg-secondary)] rounded-lg p-3">
          <p class="text-lg font-bold">{{ dataStats.fileTags }}</p>
          <p class="text-xs text-[var(--text-muted)]">文件标签</p>
        </div>
        <div class="bg-[var(--bg-secondary)] rounded-lg p-3">
          <p class="text-lg font-bold">{{ formatSize(dataStats.dbSize) }}</p>
          <p class="text-xs text-[var(--text-muted)]">数据库</p>
        </div>
      </div>

      <!-- Cleanup actions -->
      <div class="space-y-2">
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm">清理已结束比赛</p>
            <p class="text-xs text-[var(--text-muted)]">
              删除 {{ dataStats?.finishedCompetitions ?? 0 }} 条已结束的比赛
            </p>
          </div>
          <button
            class="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] hover:bg-red-500/20 hover:text-red-400 transition-colors"
            :disabled="!dataStats || dataStats.finishedCompetitions === 0"
            @click="showConfirm = 'finished'"
          >清理</button>
        </div>

        <div class="flex items-center justify-between py-2 border-t border-[var(--border-color)]">
          <div>
            <p class="text-sm">清空打卡记录</p>
            <p class="text-xs text-[var(--text-muted)]">删除 {{ dataStats?.checkins ?? 0 }} 条打卡</p>
          </div>
          <button
            class="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] hover:bg-red-500/20 hover:text-red-400 transition-colors"
            :disabled="!dataStats || dataStats.checkins === 0"
            @click="showConfirm = 'checkins'"
          >清空</button>
        </div>

        <div class="flex items-center justify-between py-2 border-t border-[var(--border-color)]">
          <div>
            <p class="text-sm text-red-400">重置所有数据</p>
            <p class="text-xs text-[var(--text-muted)]">删除全部比赛、打卡、标签，保留设置</p>
          </div>
          <button
            class="px-3 py-1.5 text-xs rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors"
            @click="showConfirm = 'all'"
          >重置</button>
        </div>
      </div>

      <!-- Confirmation dialog -->
      <div
        v-if="showConfirm"
        class="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 space-y-3"
      >
        <p class="text-sm text-red-400 font-medium">
          {{ confirmText }}
        </p>
        <p class="text-xs text-[var(--text-muted)]">此操作不可撤销</p>
        <div class="flex gap-2">
          <button
            class="flex-1 px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            :disabled="cleaning"
            @click="executeCleanup"
          >
            {{ cleaning ? '执行中...' : '确认' }}
          </button>
          <button
            class="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] transition-colors"
            @click="showConfirm = null"
          >取消</button>
        </div>
      </div>
    </section>

    <!-- About -->
    <section class="card">
      <div class="text-center text-xs text-[var(--text-muted)] space-y-1">
        <p>CTF Diary v1.0.0</p>
        <p>Built with Electron + Vue 3 + Tailwind CSS</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

interface DataStats {
  competitions: number
  checkins: number
  fileTags: number
  finishedCompetitions: number
  dbSize: number
}

const dataStats = ref<DataStats | null>(null)
const showConfirm = ref<string | null>(null)
const cleaning = ref(false)
const customCompetitionsDir = ref<string | null>(null)
const defaultDataDir = ref('')

const competitionsDir = computed(() => {
  return customCompetitionsDir.value || defaultDataDir.value + '\\competitions'
})

const confirmText = computed(() => {
  switch (showConfirm.value) {
    case 'finished': return `确定要删除 ${dataStats.value?.finishedCompetitions ?? 0} 条已结束的比赛？`
    case 'checkins': return `确定要清空 ${dataStats.value?.checkins ?? 0} 条打卡记录？`
    case 'all': return '确定要重置所有数据？（比赛、打卡、标签将被清空）'
    default: return ''
  }
})

onMounted(() => {
  loadStats()
  loadDirs()
})

async function loadDirs() {
  try {
    customCompetitionsDir.value = await window.api.config.getCompetitionsDir()
    defaultDataDir.value = await window.api.config.getDataDir()
  } catch { /* ignore */ }
}

async function pickCompetitionsDir() {
  try {
    const dirPath = await window.api.dialog.openDirectory({
      title: '选择比赛文件存储目录'
    })
    if (dirPath) {
      await window.api.config.setCompetitionsDir(dirPath)
      customCompetitionsDir.value = dirPath
    }
  } catch { /* ignore */ }
}

async function resetCompetitionsDir() {
  await window.api.config.setCompetitionsDir(null)
  customCompetitionsDir.value = null
}

async function loadStats() {
  try {
    dataStats.value = await window.api.data.getStats()
  } catch (err) {
    console.error('Failed to load data stats:', err)
  }
}

async function executeCleanup() {
  cleaning.value = true
  try {
    switch (showConfirm.value) {
      case 'finished':
        await window.api.data.clearFinishedCompetitions()
        break
      case 'checkins':
        await window.api.data.clearCheckins()
        break
      case 'all':
        await window.api.data.clearAll()
        break
    }
    showConfirm.value = null
    await loadStats()
  } catch (err) {
    console.error('Cleanup failed:', err)
  } finally {
    cleaning.value = false
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Custom backgrounds (file:// URLs) tracked separately
const customBackgrounds = ref<string[]>([])

const presets = [
  { name: '深蓝渐变', value: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' },
  { name: '紫色幻想', value: 'linear-gradient(135deg, #1a0533 0%, #4c1d95 50%, #1a0533 100%)' },
  { name: '暗夜绿', value: 'linear-gradient(135deg, #0a1a0f 0%, #14532d 50%, #0a1a0f 100%)' },
  { name: '深红暗影', value: 'linear-gradient(135deg, #1a0a0a 0%, #7f1d1d 50%, #1a0a0a 100%)' },
  { name: '赛博朋克', value: 'linear-gradient(135deg, #0f0a1a 0%, #6b21a8 30%, #1e40af 70%, #0f0a1a 100%)' }
]

const currentBg = computed(() => {
  return settingsStore.settings.background_image
})

function selectBackground(bg: string) {
  settingsStore.set('background_image', bg)
}

async function uploadBackground() {
  try {
    const path = await window.api.dialog.openImage()
    if (path) {
      customBackgrounds.value.push(path)
      selectBackground(path)
    }
  } catch (err) {
    console.error('Failed to upload background:', err)
  }
}

async function removeCustomBg(bg: string) {
  try {
    await window.api.dialog.removeBackground(bg)
    customBackgrounds.value = customBackgrounds.value.filter(b => b !== bg)
    // If currently selected, switch to default
    if (currentBg.value === bg) {
      selectBackground('')
    }
  } catch (err) {
    console.error('Failed to remove background:', err)
  }
}
</script>
