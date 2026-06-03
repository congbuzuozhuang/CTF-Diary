<template>
  <div class="main-layout h-screen">
    <Sidebar />
    <TopBar />
    <main
      class="relative z-10 flex flex-col overflow-hidden transition-all duration-300"
      :style="{
        paddingTop: 'var(--topbar-height)',
        paddingLeft: collapsed ? '64px' : '240px',
        height: '100vh'
      }"
    >
      <div class="p-6 flex-1 min-h-0 overflow-y-auto">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import Sidebar from './Sidebar.vue'
import TopBar from './TopBar.vue'

const collapsed = inject<Ref<boolean>>('sidebarCollapsed', ref(false))
</script>

<style scoped>
main {
  scroll-behavior: smooth;
}
</style>
