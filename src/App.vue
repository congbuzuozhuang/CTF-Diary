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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import Background from '@/components/common/Background.vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

onMounted(async () => {
  await settingsStore.load()
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
