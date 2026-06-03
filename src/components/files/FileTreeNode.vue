<template>
  <div>
    <div
      class="tree-node flex items-center gap-1 py-0.5 cursor-pointer rounded text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
      :class="{
        'bg-[var(--bg-tertiary)] text-blue-400': isSelected,
        'text-[var(--text-secondary)]': !isSelected
      }"
      :style="{ paddingLeft: (depth * 16 + 4) + 'px' }"
      @click="handleClick"
      @dblclick="$emit('dblclick', entry)"
    >
      <!-- Expand/collapse for directories -->
      <button
        v-if="entry.type === 'directory'"
        class="w-4 h-4 flex items-center justify-center shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        @click.stop="expanded = !expanded"
      >
        <svg
          class="w-3 h-3 transition-transform duration-150"
          :class="{ 'rotate-90': expanded }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <span v-else class="w-4 shrink-0"></span>

      <!-- Icon -->
      <svg v-if="entry.type === 'directory'" class="w-4 h-4 shrink-0 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path v-if="expanded" d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v1H7a2 2 0 00-2 2v7l-2-2V6z"/>
        <path v-else d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
      </svg>
      <svg v-else class="w-4 h-4 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>

      <!-- Name -->
      <span class="truncate text-xs">{{ entry.name }}</span>
    </div>

    <!-- Children -->
    <template v-if="entry.type === 'directory' && expanded">
      <FileTreeNode
        v-for="child in entry.children"
        :key="child.path"
        :entry="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        @select="$emit('select', $event)"
        @dblclick="$emit('dblclick', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FileEntry } from '@/types'

const props = defineProps<{
  entry: FileEntry
  depth: number
  selectedPath?: string
  activePath?: string
}>()

defineEmits<{
  select: [entry: FileEntry]
  dblclick: [entry: FileEntry]
}>()

const expanded = ref(props.depth < 1)

const isSelected = computed(() => props.selectedPath === props.entry.path)

function handleClick() {
  if (props.entry.type === 'directory') {
    expanded.value = !expanded.value
  }
}
</script>
