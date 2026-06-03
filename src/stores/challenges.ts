import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Challenge } from '@/types'

export const useChallengesStore = defineStore('challenges', () => {
  const challenges = ref<Challenge[]>([])
  const loading = ref(false)

  // Computed: challenges grouped by category
  const byCategory = computed(() => {
    const map: Record<string, Challenge[]> = {}
    for (const c of challenges.value) {
      const cat = c.category || 'other'
      if (!map[cat]) map[cat] = []
      map[cat].push(c)
    }
    return map
  })

  function getByCompId(compId: number): Challenge[] {
    return challenges.value.filter(c => c.competition_id === compId)
  }

  function getCategoryProgress(compId: number, category: string): { total: number; solved: number } {
    const inCat = challenges.value.filter(
      c => c.competition_id === compId && c.category === category
    )
    return {
      total: inCat.length,
      solved: inCat.filter(c => c.status === 'solved').length
    }
  }

  function getCompProgress(compId: number): { total: number; solved: number; percent: number } {
    const all = challenges.value.filter(c => c.competition_id === compId)
    const total = all.length
    const solved = all.filter(c => c.status === 'solved').length
    return {
      total,
      solved,
      percent: total > 0 ? Math.round((solved / total) * 100) : 0
    }
  }

  async function loadByCompetition(compId: number) {
    loading.value = true
    try {
      const list = await window.api.challenges.getByCompetition(compId)
      challenges.value = list || []
    } catch (err) {
      console.error('Failed to load challenges:', err)
    } finally {
      loading.value = false
    }
  }

  async function create(compId: number, name: string, category: string): Promise<Challenge | null> {
    try {
      const challenge = await window.api.challenges.create(compId, name, category)
      if (challenge) {
        challenges.value.push(challenge)
      }
      return challenge
    } catch (err) {
      console.error('Failed to create challenge:', err)
      return null
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      const updated = await window.api.challenges.updateStatus(id, status)
      if (updated) {
        const idx = challenges.value.findIndex(c => c.id === id)
        if (idx >= 0) {
          challenges.value[idx] = updated
        }
        // Auto-update competition solved status
        const compId = challenges.value.find(c => c.id === id)?.competition_id
        if (compId) {
          await window.api.challenges.updateCompSolved(compId)
        }
      }
    } catch (err) {
      console.error('Failed to update challenge status:', err)
    }
  }

  async function update(id: number, fields: { name?: string; category?: string; notes?: string }) {
    try {
      const updated = await window.api.challenges.update(id, fields)
      if (updated) {
        const idx = challenges.value.findIndex(c => c.id === id)
        if (idx >= 0) {
          challenges.value[idx] = updated
        }
      }
    } catch (err) {
      console.error('Failed to update challenge:', err)
    }
  }

  async function deleteChallenge(id: number, keepFiles?: boolean) {
    try {
      await window.api.challenges.delete(id, keepFiles)
      const idx = challenges.value.findIndex(c => c.id === id)
      if (idx >= 0) {
        const compId = challenges.value[idx].competition_id
        challenges.value.splice(idx, 1)
        // Update competition solved status
        await window.api.challenges.updateCompSolved(compId)
      }
    } catch (err) {
      console.error('Failed to delete challenge:', err)
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'solved': return '🟢'
      case 'attempting': return '🟡'
      default: return '⚪'
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'solved': return '已解决'
      case 'attempting': return '尝试中'
      default: return '未解决'
    }
  }

  function nextStatus(current: string): string {
    // Cycle: unsolved -> attempting -> solved -> unsolved
    switch (current) {
      case 'unsolved': return 'attempting'
      case 'attempting': return 'solved'
      default: return 'unsolved'
    }
  }

  return {
    challenges,
    loading,
    byCategory,
    getByCompId,
    getCategoryProgress,
    getCompProgress,
    loadByCompetition,
    create,
    updateStatus,
    update,
    deleteChallenge,
    getStatusIcon,
    getStatusLabel,
    nextStatus
  }
})
