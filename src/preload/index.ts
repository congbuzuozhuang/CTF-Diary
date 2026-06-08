import { contextBridge, ipcRenderer } from 'electron'

// Type-safe API exposed to renderer
const api = {
  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll')
  },

  // Competitions
  competitions: {
    getList: () => ipcRenderer.invoke('competitions:getList'),
    getFromCtftime: () => ipcRenderer.invoke('competitions:getFromCtftime'),
    participate: (id: number) => ipcRenderer.invoke('competitions:participate', id),
    getDetail: (id: number) => ipcRenderer.invoke('competitions:getDetail', id),
    create: (data: { name: string; start_date: string; end_date: string; format?: string; url?: string; weight?: number; auto_participate?: boolean }) =>
      ipcRenderer.invoke('competitions:create', data)
  },

  // Files
  files: {
    readDir: (path: string) => ipcRenderer.invoke('files:readDir', path),
    readFile: (path: string) => ipcRenderer.invoke('files:readFile', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('files:writeFile', path, content),
    deleteFile: (path: string) => ipcRenderer.invoke('files:deleteFile', path),
    importFile: (source: string, dest: string) => ipcRenderer.invoke('files:importFile', source, dest),
    getCompetitionDir: (id: number) => ipcRenderer.invoke('files:getCompetitionDir', id),
    createDirectory: (path: string) => ipcRenderer.invoke('files:createDirectory', path)
  },

  // Diary
  diary: {
    checkIn: (date: string, content: string, tags?: string, mood?: string) => ipcRenderer.invoke('diary:checkIn', date, content, tags, mood),
    getCheckins: (year: number, month: number) => ipcRenderer.invoke('diary:getCheckins', year, month),
    getDayLog: (date: string) => ipcRenderer.invoke('diary:getDayLog', date),
    getStats: () => ipcRenderer.invoke('diary:getStats')
  },

  // Python
  python: {
    runScript: (scriptPath: string) => ipcRenderer.invoke('python:runScript', scriptPath),
    checkPython: () => ipcRenderer.invoke('python:checkPython')
  },

  // App
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url)
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized')
  },

  // Challenges
  challenges: {
    getByCompetition: (compId: number) => ipcRenderer.invoke('challenges:getByCompetition', compId),
    create: (compId: number, name: string, category: string) => ipcRenderer.invoke('challenges:create', compId, name, category),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('challenges:updateStatus', id, status),
    update: (id: number, fields: { name?: string; category?: string; notes?: string }) =>
      ipcRenderer.invoke('challenges:update', id, fields),
    delete: (id: number, keepFiles?: boolean) => ipcRenderer.invoke('challenges:delete', id, keepFiles),
    updateCompSolved: (compId: number) => ipcRenderer.invoke('challenges:updateCompSolved', compId),
    getStats: () => ipcRenderer.invoke('challenges:stats')
  },

  // Dialog
  dialog: {
    openImage: () => ipcRenderer.invoke('dialog:openImage'),
    removeBackground: (path: string) => ipcRenderer.invoke('dialog:removeBackground', path),
    openFile: (options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) =>
      ipcRenderer.invoke('dialog:openFile', options),
    openDirectory: (options?: { title?: string }) => ipcRenderer.invoke('dialog:openDirectory', options)
  },

  // Data management
  data: {
    getStats: () => ipcRenderer.invoke('data:getStats'),
    clearFinishedCompetitions: () => ipcRenderer.invoke('data:clearFinishedCompetitions'),
    clearAllCompetitions: () => ipcRenderer.invoke('data:clearAllCompetitions'),
    clearCheckins: () => ipcRenderer.invoke('data:clearCheckins'),
    clearAll: () => ipcRenderer.invoke('data:clearAll'),
    clearCompetition: (compId: number) => ipcRenderer.invoke('data:clearCompetition', compId),
    deleteFile: (filePath: string) => ipcRenderer.invoke('data:deleteFile', filePath)
  },

  // Notifications
  notifications: {
    checkNow: () => ipcRenderer.invoke('notifications:checkNow'),
    getEnabled: () => ipcRenderer.invoke('notifications:getEnabled'),
    getBeforeDays: () => ipcRenderer.invoke('notifications:getBeforeDays')
  },

  // CVE Management
  cves: {
    getList: () => ipcRenderer.invoke('cves:getList'),
    getById: (id: number) => ipcRenderer.invoke('cves:getById', id),
    create: (data: { cve_number: string; title?: string; severity?: string; cvss_score?: number; description?: string }) =>
      ipcRenderer.invoke('cves:create', data),
    update: (id: number, fields: Record<string, unknown>) =>
      ipcRenderer.invoke('cves:update', id, fields),
    delete: (id: number) => ipcRenderer.invoke('cves:delete', id),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('cves:updateStatus', id, status)
  },

  // Docker Management
  docker: {
    checkAvailable: () => ipcRenderer.invoke('docker:checkAvailable'),
    listImages: () => ipcRenderer.invoke('docker:listImages'),
    importImage: (filePath: string, tag?: string) => ipcRenderer.invoke('docker:importImage', filePath, tag),
    runContainer: (cveId: number, options: { imageName: string; portMappings?: string[]; envVars?: string[]; name?: string }) =>
      ipcRenderer.invoke('docker:runContainer', cveId, options),
    runTempContainer: (options: { imageName: string; portMappings?: string[]; envVars?: string[]; name?: string }) =>
      ipcRenderer.invoke('docker:runTempContainer', options),
    stopContainer: (containerId: string) => ipcRenderer.invoke('docker:stopContainer', containerId),
    removeContainer: (containerId: string) => ipcRenderer.invoke('docker:removeContainer', containerId),
    getContainerStatus: (containerId: string) => ipcRenderer.invoke('docker:getContainerStatus', containerId),
    getContainerLogs: (containerId: string, lines?: number) => ipcRenderer.invoke('docker:getContainerLogs', containerId, lines),
    linkImageToCve: (cveId: number, imageName: string) => ipcRenderer.invoke('docker:linkImageToCve', cveId, imageName),
    removeImage: (imageName: string, force?: boolean) => ipcRenderer.invoke('docker:removeImage', imageName, force)
  },

  // Config
  config: {
    getCompetitionsDir: () => ipcRenderer.invoke('config:getCompetitionsDir'),
    setCompetitionsDir: (dirPath: string | null) => ipcRenderer.invoke('config:setCompetitionsDir', dirPath),
    getDataDir: () => ipcRenderer.invoke('config:getDataDir')
  },

  // Export
  export_: {
    competition: (compId: number, compName: string, asZip: boolean) => ipcRenderer.invoke('export:competition', compId, compName, asZip),
    challenge: (challengeDir: string, challengeName: string, asZip: boolean) => ipcRenderer.invoke('export:challenge', challengeDir, challengeName, asZip)
  },

  // Backup / Restore
  backup: {
    export_: () => ipcRenderer.invoke('backup:export'),
    import_: () => ipcRenderer.invoke('backup:import')
  }
}

export type ApiType = typeof api

contextBridge.exposeInMainWorld('api', api)
