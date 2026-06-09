<template>
  <div class="app-root h-screen overflow-hidden relative">
    <Background />
    <MainLayout>
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </MainLayout>
    <SearchPanel :visible="showSearch" @close="showSearch = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted } from 'vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import Background from '@/components/common/Background.vue'
import SearchPanel from '@/components/SearchPanel.vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

// Search panel state
const showSearch = ref(false)
provide('toggleSearch', () => {
  showSearch.value = !showSearch.value
})

// Global keyboard shortcut: Ctrl+Shift+F for search
function onKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
    e.preventDefault()
    showSearch.value = !showSearch.value
  }
}

onMounted(async () => {
  await settingsStore.load()
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
