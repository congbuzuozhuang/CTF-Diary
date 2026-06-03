import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FileEntry, Competition } from '@/types'

export interface CompetitionFileGroup {
  compId: number
  compName: string
  directory: string
  entries: FileEntry[]
  loaded: boolean
}

export const useFilesStore = defineStore('files', () => {
  const currentDir = ref('')
  const fileTree = ref<FileEntry[]>([])
  const selectedFile = ref<FileEntry | null>(null)
  const fileContent = ref('')
  const loading = ref(false)

  // Multi-competition file groups
  const fileGroups = ref<CompetitionFileGroup[]>([])
  const loadingAll = ref(false)

  async function loadDirectory(dirPath: string) {
    loading.value = true
    currentDir.value = dirPath
    try {
      const tree = await window.api.files.readDir(dirPath)
      fileTree.value = tree || []
    } catch (err) {
      console.error('Failed to read directory:', err)
      fileTree.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadAllCompetitionFiles(competitions: Competition[]) {
    loadingAll.value = true
    const groups: CompetitionFileGroup[] = []
    for (const comp of competitions) {
      if (comp.directory) {
        try {
          const entries = await window.api.files.readDir(comp.directory)
          groups.push({
            compId: comp.id!,
            compName: comp.name,
            directory: comp.directory,
            entries: entries || [],
            loaded: true
          })
        } catch {
          groups.push({
            compId: comp.id!,
            compName: comp.name,
            directory: comp.directory,
            entries: [],
            loaded: false
          })
        }
      }
    }
    fileGroups.value = groups
    loadingAll.value = false
  }

  function getGroupByCompId(compId: number): CompetitionFileGroup | undefined {
    return fileGroups.value.find(g => g.compId === compId)
  }

  async function refreshGroup(compId: number) {
    const group = fileGroups.value.find(g => g.compId === compId)
    if (!group) return
    try {
      const entries = await window.api.files.readDir(group.directory)
      group.entries = entries || []
      group.loaded = true
    } catch {
      group.entries = []
      group.loaded = false
    }
  }

  async function openFile(filePath: string) {
    try {
      const content = await window.api.files.readFile(filePath)
      fileContent.value = content
      // Search across all competition groups
      for (const group of fileGroups.value) {
        const found = findInTree(group.entries, filePath)
        if (found) {
          selectedFile.value = found
          return
        }
      }
      // Fallback: search in the legacy fileTree
      selectedFile.value = findInTree(fileTree.value, filePath)
    } catch (err) {
      console.error('Failed to read file:', err)
    }
  }

  async function saveFile(filePath: string, content: string) {
    try {
      await window.api.files.writeFile(filePath, content)
    } catch (err) {
      console.error('Failed to save file:', err)
      throw err
    }
  }

  async function importFile(source: string, dest: string) {
    try {
      await window.api.files.importFile(source, dest)
      // Reload current directory
      if (currentDir.value) {
        await loadDirectory(currentDir.value)
      }
    } catch (err) {
      console.error('Failed to import file:', err)
      throw err
    }
  }

  function findInTree(entries: FileEntry[], path: string): FileEntry | null {
    for (const entry of entries) {
      if (entry.path === path) return entry
      if (entry.children) {
        const found = findInTree(entry.children, path)
        if (found) return found
      }
    }
    return null
  }

  return {
    currentDir,
    fileTree,
    selectedFile,
    fileContent,
    loading,
    fileGroups,
    loadingAll,
    loadDirectory,
    loadAllCompetitionFiles,
    getGroupByCompId,
    refreshGroup,
    openFile,
    saveFile,
    importFile
  }
})
