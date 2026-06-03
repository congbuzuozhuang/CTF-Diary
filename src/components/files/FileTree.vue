<template>
  <div class="file-tree select-none">
    <!-- Root level -->
    <div v-if="!rootPath" class="text-xs text-[var(--text-muted)] py-2 px-1">
      {{ placeholder || '选择比赛目录' }}
    </div>
    <FileTreeNode
      v-for="entry in entries"
      :key="entry.path"
      :entry="entry"
      :depth="0"
      :selected-path="selectedPath"
      :active-path="activePath"
      @select="$emit('select', $event)"
      @dblclick="$emit('dblclick', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { FileEntry } from '@/types'
import FileTreeNode from './FileTreeNode.vue'

defineProps<{
  entries: FileEntry[]
  selectedPath?: string
  activePath?: string
  rootPath?: string
  placeholder?: string
}>()

defineEmits<{
  select: [entry: FileEntry]
  dblclick: [entry: FileEntry]
}>()
</script>
