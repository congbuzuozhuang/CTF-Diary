import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSettings } from '@/types'

const DEFAULTS: AppSettings = {
  background_image: '',
  theme: 'light',
  font_size: '16',
  language: 'zh',
  card_opacity: '0.85'
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULTS })
  const loaded = ref(false)

  async function load() {
    try {
      const all = await window.api.settings.getAll()
      if (all) {
        settings.value = { ...DEFAULTS, ...all } as AppSettings
      }
      applyTheme(settings.value.theme)
      applyCardOpacity(settings.value.card_opacity)
      loaded.value = true
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  async function set<T extends keyof AppSettings>(key: T, value: AppSettings[T]) {
    settings.value[key] = value
    try {
      await window.api.settings.set(key, String(value))
      if (key === 'theme') {
        applyTheme(value as string)
      }
      if (key === 'card_opacity') {
        applyCardOpacity(value as string)
      }
    } catch (err) {
      console.error(`Failed to save setting ${key}:`, err)
    }
  }

  function applyTheme(theme: string) {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }

  function applyCardOpacity(opacity: string) {
    document.documentElement.style.setProperty('--card-opacity', opacity)
  }

  return { settings, loaded, load, set }
})
