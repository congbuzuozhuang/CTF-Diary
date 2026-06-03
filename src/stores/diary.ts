import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Checkin, DiaryStats } from '@/types'

export const useDiaryStore = defineStore('diary', () => {
  const checkins = ref<Checkin[]>([])
  const stats = ref<DiaryStats>({
    totalDays: 0,
    streakDays: 0,
    totalCheckins: 0,
    thisMonthDays: 0
  })
  const loading = ref(false)

  const checkedInToday = ref(false)

  // Get checkin dates as a Set for calendar marking
  const checkinDates = computed(() => {
    return new Set(checkins.value.map(c => c.date))
  })

  async function loadMonth(year: number, month: number) {
    loading.value = true
    try {
      const list = await window.api.diary.getCheckins(year, month)
      checkins.value = list || []

      // Check if today is checked in
      const today = new Date().toISOString().split('T')[0]
      checkedInToday.value = checkins.value.some(c => c.date === today)
    } catch (err) {
      console.error('Failed to load checkins:', err)
    } finally {
      loading.value = false
    }
  }

  async function checkIn(date: string, content: string, tags: string[] = [], mood = '') {
    try {
      await window.api.diary.checkIn(date, content, JSON.stringify(tags), mood)

      // Update local state
      const existing = checkins.value.findIndex(c => c.date === date)
      const newCheckin: Checkin = {
        id: existing >= 0 ? checkins.value[existing].id : Date.now(),
        date,
        content,
        tags,
        mood,
        created_at: new Date().toISOString()
      }

      if (existing >= 0) {
        checkins.value[existing] = newCheckin
      } else {
        checkins.value.push(newCheckin)
      }

      // Reload stats
      await loadStats()

      // Check today
      const today = new Date().toISOString().split('T')[0]
      checkedInToday.value = date === today || checkedInToday.value
    } catch (err) {
      console.error('Failed to check in:', err)
    }
  }

  async function loadStats() {
    try {
      const s = await window.api.diary.getStats()
      if (s) stats.value = s
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  function getDayLog(date: string): Checkin | undefined {
    return checkins.value.find(c => c.date === date)
  }

  return {
    checkins,
    stats,
    loading,
    checkedInToday,
    checkinDates,
    loadMonth,
    checkIn,
    loadStats,
    getDayLog
  }
})
