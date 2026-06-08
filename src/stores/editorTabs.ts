import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface EditorTab {
  id: string          // unique tab id
  path: string        // file path
  name: string        // display name (basename)
  content: string     // current content
  originalContent: string  // saved version for dirty check
  language: 'markdown' | 'python' | 'text'
  dirty: boolean
}

export const useEditorTabsStore = defineStore('editorTabs', () => {
  const tabs = ref<EditorTab[]>([])
  const activeTabId = ref<string | null>(null)

  const activeTab = computed(() =>
    tabs.value.find(t => t.id === activeTabId.value) || null
  )

  function tabIdFor(path: string): string {
    return path.replace(/[/\\]/g, '_')
  }

  function getTab(path: string): EditorTab | undefined {
    return tabs.value.find(t => t.path === path)
  }

  /** Open a file in a new or existing tab */
  async function openFile(path: string): Promise<EditorTab> {
    const existing = getTab(path)
    if (existing) {
      activeTabId.value = existing.id
      return existing
    }

    const name = path.split(/[/\\]/).pop() || 'untitled'
    const lang = detectLanguage(path)

    // Load content
    let content = ''
    try {
      content = await window.api.files.readFile(path)
    } catch {
      content = ''
    }

    const tab: EditorTab = {
      id: tabIdFor(path),
      path,
      name,
      content,
      originalContent: content,
      language: lang,
      dirty: false
    }

    tabs.value.push(tab)
    activeTabId.value = tab.id
    return tab
  }

  /** Create a new untitled tab */
  function newTab(language: 'markdown' | 'python' = 'markdown'): EditorTab {
    const id = `new_${Date.now()}`
    const tab: EditorTab = {
      id,
      path: '',
      name: language === 'python' ? 'untitled.py' : 'untitled.md',
      content: '',
      originalContent: '',
      language,
      dirty: false
    }
    tabs.value.push(tab)
    activeTabId.value = tab.id
    return tab
  }

  /** Update tab content (called on each keystroke) */
  function updateContent(tabId: string, content: string) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.content = content
      tab.dirty = content !== tab.originalContent
    }
  }

  /** Save current tab */
  async function saveTab(tabId: string): Promise<boolean> {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab || !tab.path) return false

    try {
      await window.api.files.writeFile(tab.path, tab.content)
      tab.originalContent = tab.content
      tab.dirty = false
      return true
    } catch (err) {
      console.error('Failed to save:', err)
      return false
    }
  }

  /** Close a tab. Returns false if closing was cancelled due to unsaved changes. */
  function closeTab(tabId: string): boolean {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    if (tab.dirty) {
      const discard = window.confirm(`「${tab.name}」有未保存的更改，确定关闭吗？`)
      if (!discard) return false
    }

    const idx = tabs.value.findIndex(t => t.id === tabId)
    tabs.value.splice(idx, 1)

    // Switch to neighbor tab
    if (activeTabId.value === tabId) {
      if (tabs.value.length === 0) {
        activeTabId.value = null
      } else if (idx < tabs.value.length) {
        activeTabId.value = tabs.value[idx].id
      } else {
        activeTabId.value = tabs.value[idx - 1].id
      }
    }
  }

  /** Rename a tab's file path (after Save As) */
  function updatePath(tabId: string, newPath: string) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.path = newPath
      tab.name = newPath.split(/[/\\]/).pop() || 'untitled'
      tab.language = detectLanguage(newPath)
      tab.id = tabIdFor(newPath)
    }
  }

  function detectLanguage(path: string): 'markdown' | 'python' | 'text' {
    const ext = path.split('.').pop()?.toLowerCase()
    if (ext === 'py') return 'python'
    if (ext === 'md' || ext === 'markdown') return 'markdown'
    // Check other text extensions
    if (['txt', 'c', 'cpp', 'h', 'hpp', 'js', 'ts', 'json', 'xml', 'html', 'css',
         'yaml', 'yml', 'toml', 'sh', 'bash', 'ps1', 'asm', 's', 'java', 'go',
         'rs', 'rb', 'php', 'pl', 'r', 'lua', 'sql'].includes(ext || '')) {
      return 'text'
    }
    return 'text'
  }

  function hasUnsaved(): boolean {
    return tabs.value.some(t => t.dirty)
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    openFile,
    newTab,
    updateContent,
    saveTab,
    closeTab,
    updatePath,
    hasUnsaved,
    tabIdFor
  }
})
