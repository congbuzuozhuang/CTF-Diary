import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DockerImageInfo, RunContainerOptions } from '@/types'

export const useDockerStore = defineStore('docker', () => {
  const available = ref(false)
  const dockerVersion = ref('')
  const images = ref<DockerImageInfo[]>([])
  const loading = ref(false)
  const containerStatuses = ref<Record<string, { running: boolean; status: string }>>({})

  async function checkDocker(): Promise<boolean> {
    try {
      const result = await window.api.docker.checkAvailable()
      if (result) {
        available.value = (result as any).available || false
        dockerVersion.value = (result as any).version || ''
      }
      return available.value
    } catch {
      available.value = false
      return false
    }
  }

  async function loadImages(): Promise<void> {
    loading.value = true
    try {
      const result = await window.api.docker.listImages()
      images.value = (result || []) as DockerImageInfo[]
    } catch (err) {
      console.error('Failed to load Docker images:', err)
      images.value = []
    } finally {
      loading.value = false
    }
  }

  async function importImage(filePath: string, tag?: string): Promise<boolean> {
    loading.value = true
    try {
      const result = await window.api.docker.importImage(filePath, tag)
      if (result && (result as any).success) {
        await loadImages() // Refresh image list
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to import Docker image:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function runContainer(cveId: number, options: RunContainerOptions): Promise<string | null> {
    loading.value = true
    try {
      const result = await window.api.docker.runContainer(cveId, options)
      if (result && (result as any).success) {
        const containerId = (result as any).containerId as string
        containerStatuses.value[containerId] = { running: true, status: 'running' }
        return containerId
      }
      return null
    } catch (err) {
      console.error('Failed to run container:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function runTempContainer(options: RunContainerOptions): Promise<string | null> {
    loading.value = true
    try {
      const result = await window.api.docker.runTempContainer(options)
      if (result && (result as any).success) {
        return (result as any).containerId as string
      }
      return null
    } catch (err) {
      console.error('Failed to run temp container:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function stopContainer(containerId: string): Promise<boolean> {
    try {
      const result = await window.api.docker.stopContainer(containerId)
      if (result && (result as any).success) {
        delete containerStatuses.value[containerId]
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to stop container:', err)
      return false
    }
  }

  async function removeContainer(containerId: string): Promise<boolean> {
    try {
      const result = await window.api.docker.removeContainer(containerId)
      if (result && (result as any).success) {
        delete containerStatuses.value[containerId]
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to remove container:', err)
      return false
    }
  }

  async function checkContainerStatus(containerId: string): Promise<{ running: boolean; status: string }> {
    try {
      const result = await window.api.docker.getContainerStatus(containerId)
      const status = (result as { running: boolean; status: string }) || { running: false, status: 'unknown' }
      containerStatuses.value[containerId] = status
      return status
    } catch {
      return { running: false, status: 'error' }
    }
  }

  async function getContainerLogs(containerId: string, lines?: number): Promise<string> {
    try {
      const result = await window.api.docker.getContainerLogs(containerId, lines)
      return (result as string) || ''
    } catch {
      return 'Failed to fetch logs'
    }
  }

  async function linkImageToCve(cveId: number, imageName: string): Promise<boolean> {
    try {
      const result = await window.api.docker.linkImageToCve(cveId, imageName)
      return (result as any)?.success || false
    } catch (err) {
      console.error('Failed to link image to CVE:', err)
      return false
    }
  }

  async function removeImage(imageName: string, force?: boolean): Promise<boolean> {
    try {
      const result = await window.api.docker.removeImage(imageName, force)
      if (result && (result as any).success) {
        await loadImages() // Refresh image list
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to remove Docker image:', err)
      return false
    }
  }

  return {
    available, dockerVersion, images, loading, containerStatuses,
    checkDocker, loadImages, importImage, runContainer, runTempContainer,
    stopContainer, removeContainer, removeImage, checkContainerStatus, getContainerLogs,
    linkImageToCve
  }
})
