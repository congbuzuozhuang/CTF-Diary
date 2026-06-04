import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Cve, CreateCveInput, CveUpdateFields } from '@/types'

export const useCvesStore = defineStore('cves', () => {
  const cves = ref<Cve[]>([])
  const loading = ref(false)
  const currentCve = ref<Cve | null>(null)

  // Computed views
  const pendingCves = computed(() => cves.value.filter(c => c.status === 'pending'))
  const reproducingCves = computed(() => cves.value.filter(c => c.status === 'reproducing'))
  const completedCves = computed(() => cves.value.filter(c => c.status === 'completed'))

  function getById(id: number): Cve | undefined {
    return cves.value.find(c => c.id === id)
  }

  async function loadList(): Promise<void> {
    loading.value = true
    try {
      const result = await window.api.cves.getList()
      cves.value = (result || []) as Cve[]
    } catch (err) {
      console.error('Failed to load CVEs:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadById(id: number): Promise<void> {
    loading.value = true
    try {
      const result = await window.api.cves.getById(id)
      currentCve.value = (result || null) as Cve | null
    } catch (err) {
      console.error('Failed to load CVE:', err)
      currentCve.value = null
    } finally {
      loading.value = false
    }
  }

  async function create(data: CreateCveInput): Promise<Cve | null> {
    try {
      const created = await window.api.cves.create(data)
      if (created) {
        const cve = created as Cve
        cves.value.unshift(cve)
        return cve
      }
      return null
    } catch (err) {
      console.error('Failed to create CVE:', err)
      throw err
    }
  }

  async function update(id: number, fields: Partial<CveUpdateFields>): Promise<Cve | null> {
    try {
      const updated = await window.api.cves.update(id, fields as Record<string, unknown>)
      if (updated) {
        const cve = updated as Cve
        const idx = cves.value.findIndex(c => c.id === id)
        if (idx !== -1) cves.value[idx] = cve
        if (currentCve.value?.id === id) currentCve.value = cve
        return cve
      }
      return null
    } catch (err) {
      console.error('Failed to update CVE:', err)
      throw err
    }
  }

  async function deleteCve(id: number): Promise<boolean> {
    try {
      const result = await window.api.cves.delete(id)
      if (result && (result as { success: boolean }).success) {
        cves.value = cves.value.filter(c => c.id !== id)
        if (currentCve.value?.id === id) currentCve.value = null
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to delete CVE:', err)
      return false
    }
  }

  async function updateStatus(id: number, status: string): Promise<Cve | null> {
    try {
      const updated = await window.api.cves.updateStatus(id, status)
      if (updated) {
        const cve = updated as Cve
        const idx = cves.value.findIndex(c => c.id === id)
        if (idx !== -1) cves.value[idx] = cve
        if (currentCve.value?.id === id) currentCve.value = cve
        return cve
      }
      return null
    } catch (err) {
      console.error('Failed to update CVE status:', err)
      return null
    }
  }

  // Severity helpers
  function getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-500/10'
      case 'high': return 'text-orange-400 bg-orange-500/10'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10'
      case 'low': return 'text-blue-400 bg-blue-500/10'
      default: return 'text-slate-400 bg-slate-500/10'
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return '待复现'
      case 'reproducing': return '复现中'
      case 'completed': return '已完成'
      default: return status
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'text-slate-400 bg-slate-500/10'
      case 'reproducing': return 'text-yellow-400 bg-yellow-500/10'
      case 'completed': return 'text-green-400 bg-green-500/10'
      default: return 'text-slate-400 bg-slate-500/10'
    }
  }

  return {
    cves, loading, currentCve,
    pendingCves, reproducingCves, completedCves,
    getById, loadList, loadById, create, update, deleteCve, updateStatus,
    getSeverityColor, getStatusLabel, getStatusColor
  }
})
