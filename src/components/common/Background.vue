<template>
  <div class="background-layer fixed inset-0 z-0 pointer-events-none">
    <!-- Background image from settings -->
    <div
      v-if="bgImage"
      class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
      :style="{ backgroundImage: `url('${bgImage}')` }"
    />
    <!-- Gradient background (shown when no image or as fallback) -->
    <div
      v-if="!bgImage"
      class="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950"
    />
    <!-- Overlay for readability -->
    <div class="absolute inset-0" :style="{ backgroundColor: 'var(--bg-overlay)' }" />
    <!-- Depth gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/50" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const bgImage = computed(() => {
  const bg = settingsStore.settings.background_image
  if (!bg) return ''
  // Convert file:// to a path usable in CSS
  if (bg.startsWith('file://')) {
    // On Windows, file:///C:/... needs to become a local file reference
    // electron-vite serves from localhost, so we need to use a custom protocol
    // For now, return the raw path; the app:// protocol or custom scheme handles this
    return bg
  }
  return bg
})
</script>
