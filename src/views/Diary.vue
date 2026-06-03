<template>
  <div class="diary animate-fade-in space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">📝 日志打卡</h2>
        <p class="text-[var(--text-secondary)] mt-1 text-sm">记录每日学习进展，追踪成长轨迹</p>
      </div>
      <button
        class="btn-primary"
        :disabled="store.checkedInToday"
        @click="handleTodayCheckin"
      >
        {{ store.checkedInToday ? '✅ 已打卡' : '📝 今日打卡' }}
      </button>
    </div>

    <!-- Calendar + Day Log layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Calendar -->
      <div class="card lg:col-span-1">
        <div class="flex items-center justify-between mb-4">
          <button class="btn-ghost w-8 h-8 flex items-center justify-center" @click="prevMonth">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="text-sm font-semibold">{{ yearMonth }}</span>
          <button class="btn-ghost w-8 h-8 flex items-center justify-center" @click="nextMonth">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Weekday headers -->
        <div class="grid grid-cols-7 mb-2">
          <div
            v-for="day in weekDays"
            :key="day"
            class="text-center text-xs text-[var(--text-muted)] py-1"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="aspect-square flex items-center justify-center rounded text-xs cursor-pointer transition-all duration-150"
            :class="dayClass(day)"
            @click="selectDay(day)"
          >
            {{ day?.day }}
          </div>
        </div>

        <!-- Quick legend -->
        <div class="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded bg-green-500/30"></span> 已打卡
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded bg-blue-500/30"></span> 今天
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded bg-[var(--bg-tertiary)]"></span> 已选
          </span>
        </div>
      </div>

      <!-- Day Log -->
      <div class="card lg:col-span-2 min-h-[400px] flex flex-col">
        <template v-if="selectedDate">
          <!-- Header -->
          <div class="flex items-center justify-between mb-3 shrink-0">
            <h3 class="font-semibold">{{ selectedDateLabel }}</h3>
            <div class="flex items-center gap-1.5">
              <span
                v-for="tag in availableTags"
                :key="tag"
                class="px-2 py-0.5 rounded text-xs cursor-pointer transition-colors"
                :class="selectedTags.includes(tag)
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </span>
              <!-- Mood selector -->
              <span class="text-[var(--text-muted)] text-xs ml-2 mr-1">心情</span>
              <button
                v-for="m in moods"
                :key="m.emoji"
                class="text-sm px-1 rounded transition-transform"
                :class="selectedMood === m.emoji ? 'scale-125' : 'opacity-50 hover:opacity-80'"
                :title="m.label"
                @click="selectedMood = selectedMood === m.emoji ? '' : m.emoji"
              >
                {{ m.emoji }}
              </button>
            </div>
          </div>

          <!-- Editor area -->
          <div class="flex-1 min-h-0 mb-3">
            <MdEditor
              v-model="logContent"
              language="markdown"
              @save="saveCurrentLog"
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center shrink-0">
            <button class="btn-ghost text-xs" @click="clearLog">清空</button>
            <button class="btn-primary text-xs" @click="saveCurrentLog">💾 保存日志</button>
          </div>
        </template>

        <!-- Empty state -->
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p class="text-sm text-[var(--text-muted)]">选择日历中的日期查看或编辑日志</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card text-center py-4">
        <p class="text-2xl font-bold text-blue-400">{{ store.stats.streakDays }}</p>
        <p class="text-xs text-[var(--text-secondary)] mt-1">连续打卡</p>
      </div>
      <div class="card text-center py-4">
        <p class="text-2xl font-bold text-green-400">{{ store.stats.totalDays }}</p>
        <p class="text-xs text-[var(--text-secondary)] mt-1">总打卡天数</p>
      </div>
      <div class="card text-center py-4">
        <p class="text-2xl font-bold text-purple-400">{{ store.stats.thisMonthDays }}</p>
        <p class="text-xs text-[var(--text-secondary)] mt-1">本月打卡</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import MdEditor from '@/components/editor/MdEditor.vue'

const store = useDiaryStore()

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const availableTags = ['pwn', 'reverse', 'web', 'crypto', 'misc', '比赛']
const moods = [
  { emoji: '😊', label: '开心' },
  { emoji: '🤔', label: '思考' },
  { emoji: '😤', label: '努力' },
  { emoji: '😎', label: '自信' },
  { emoji: '😴', label: '累了' }
]

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth()) // 0-based

const selectedDate = ref<CalendarDay | null>(null)
const selectedTags = ref<string[]>([])
const selectedMood = ref('')
const logContent = ref('')

interface CalendarDay {
  day: number
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

const yearMonth = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  return selectedDate.value.date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const calendarDays = computed(() => {
  const days: (CalendarDay | null)[] = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startOffset = firstDay.getDay()

  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }

  const today = new Date()
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(currentYear.value, currentMonth.value, d)
    days.push({
      day: d,
      date,
      isCurrentMonth: true,
      isToday:
        d === today.getDate() &&
        currentMonth.value === today.getMonth() &&
        currentYear.value === today.getFullYear()
    })
  }

  return days
})

// Format date to YYYY-MM-DD
function fmtDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function dayClass(day: CalendarDay | null): string {
  if (!day) return 'text-transparent pointer-events-none'

  const dateStr = fmtDate(day.date)
  const isCheckedIn = store.checkinDates.has(dateStr)
  const isSelected = selectedDate.value && fmtDate(selectedDate.value.date) === dateStr

  const classes: string[] = []

  if (day.isToday) {
    classes.push('bg-blue-500/20 text-blue-400 font-bold ring-1 ring-blue-500/30')
  } else if (isCheckedIn && isSelected) {
    classes.push('bg-green-500/40 text-green-200 ring-1 ring-green-500/50')
  } else if (isCheckedIn) {
    classes.push('bg-green-500/20 text-green-400 hover:bg-green-500/30')
  } else if (isSelected) {
    classes.push('bg-[var(--bg-tertiary)] text-[var(--text-primary)]')
  } else {
    classes.push('text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]')
  }

  return classes.join(' ')
}

function selectDay(day: CalendarDay | null) {
  if (!day) return
  selectedDate.value = day

  // Load day log
  const dateStr = fmtDate(day.date)
  const log = store.getDayLog(dateStr)
  if (log) {
    logContent.value = log.content || ''
    selectedTags.value = [...(log.tags || [])]
    selectedMood.value = log.mood || ''
  } else {
    logContent.value = ''
    selectedTags.value = []
    selectedMood.value = ''
  }
}

async function handleTodayCheckin() {
  const today = fmtDate(new Date())
  await store.checkIn(today, '', [], '')
  // Select today
  selectDay({ day: new Date().getDate(), date: new Date(), isCurrentMonth: true, isToday: true })
}

async function saveCurrentLog() {
  if (!selectedDate.value) return
  const dateStr = fmtDate(selectedDate.value.date)
  await store.checkIn(dateStr, logContent.value, selectedTags.value, selectedMood.value)
}

function clearLog() {
  logContent.value = ''
  selectedTags.value = []
  selectedMood.value = ''
}

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// Load checkins when month changes
watch([currentYear, currentMonth], () => {
  store.loadMonth(currentYear.value, currentMonth.value + 1)
})

onMounted(async () => {
  await store.loadMonth(currentYear.value, currentMonth.value + 1)
  await store.loadStats()
})
</script>
