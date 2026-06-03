import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Competition } from '@/types'

export const useCompetitionsStore = defineStore('competitions', () => {
  const competitions = ref<Competition[]>([])
  const loading = ref(false)
  const fetchingCtftime = ref(false)

  const participating = computed(() =>
    competitions.value.filter(c => c.status === 'participating')
  )

  const upcoming = computed(() =>
    competitions.value
      .filter(c => c.status === 'upcoming')
      .sort((a, b) => {
        if (!a.start_date) return 1
        if (!b.start_date) return -1
        return a.start_date.localeCompare(b.start_date)
      })
  )

  const finished = computed(() =>
    competitions.value.filter(c => c.status === 'finished')
  )

  async function loadList() {
    loading.value = true
    try {
      const list = await window.api.competitions.getList()
      competitions.value = list || []
    } catch (err) {
      console.error('Failed to load competitions:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchFromCtftime() {
    fetchingCtftime.value = true
    try {
      const list = await window.api.competitions.getFromCtftime()
      competitions.value = list || []
    } catch (err) {
      console.error('Failed to fetch from CTFtime:', err)
      throw err
    } finally {
      fetchingCtftime.value = false
    }
  }

  async function participate(id: number) {
    try {
      const updated = await window.api.competitions.participate(id)
      if (updated) {
        const idx = competitions.value.findIndex(c => c.id === id)
        if (idx >= 0) {
          competitions.value[idx] = updated
        }
      }
    } catch (err) {
      console.error('Failed to participate:', err)
    }
  }

  async function create(data: {
    name: string
    start_date: string
    end_date: string
    format?: string
    url?: string
    weight?: number
    auto_participate?: boolean
  }): Promise<Competition | null> {
    try {
      const created = await window.api.competitions.create(data)
      if (created) {
        competitions.value.unshift(created)
        return created
      }
      return null
    } catch (err) {
      console.error('Failed to create competition:', err)
      return null
    }
  }

  function getById(id: number): Competition | undefined {
    return competitions.value.find(c => c.id === id)
  }

  return {
    competitions,
    loading,
    fetchingCtftime,
    participating,
    upcoming,
    finished,
    loadList,
    fetchFromCtftime,
    participate,
    create,
    getById
  }
})
