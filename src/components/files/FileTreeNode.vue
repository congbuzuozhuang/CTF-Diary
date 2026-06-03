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

      <!-- Challenge status dot -->
      <span
        v-if="entry.type === 'directory' && challengeStatus"
        class="w-2 h-2 rounded-full shrink-0"
        :class="statusDotClass"
        :title="statusTitle"
      />

      <!-- Icon -->
      <svg v-if="entry.type === 'directory'" class="w-4 h-4 shrink-0" :class="folderColorClass" fill="currentColor" viewBox="0 0 24 24">
        <path v-if="expanded" d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v1H7a2 2 0 00-2 2v7l-2-2V6z"/>
        <path v-else d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
      </svg>
      <svg v-else class="w-4 h-4 shrink-0" :class="fileColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>

      <!-- Name -->
      <span
        class="truncate text-xs"
        :class="nameColorClass"
      >{{ entry.name }}</span>
    </div>

    <!-- Children -->
    <template v-if="entry.type === 'directory' && expanded">
      <FileTreeNode
        v-for="child in entry.children"
        :key="child.path"
        :entry="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        :challenge-path-map="challengePathMap"
        :parent-challenge-status="challengeStatus"
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
  challengePathMap?: Record<string, string>  // path -> status mapping
  parentChallengeStatus?: string              // inherit from parent dir
}>()

defineEmits<{
  select: [entry: FileEntry]
  dblclick: [entry: FileEntry]
}>()

const expanded = ref(props.depth < 1)

const isSelected = computed(() => props.selectedPath === props.entry.path)

// Challenge status for this entry (directory-level, or inherited for children)
const challengeStatus = computed(() => {
  if (props.entry.type === 'directory') {
    return props.challengePathMap?.[props.entry.path] || undefined
  }
  // Files inherit parent's challenge status
  return props.parentChallengeStatus || undefined
})

const statusDotClass = computed(() => {
  switch (challengeStatus.value) {
    case 'solved': return 'bg-green-500'
    case 'attempting': return 'bg-yellow-500'
    default: return 'bg-slate-500'
  }
})

const statusTitle = computed(() => {
  switch (challengeStatus.value) {
    case 'solved': return '已解决'
    case 'attempting': return '尝试中'
    default: return '未解决'
  }
})

const folderColorClass = computed(() => {
  switch (challengeStatus.value) {
    case 'solved': return 'text-green-400'
    case 'attempting': return 'text-yellow-400'
    default: return 'text-yellow-400' // normal folder color
  }
})

const fileColorClass = computed(() => {
  switch (challengeStatus.value) {
    case 'solved': return 'text-green-400'
    case 'attempting': return 'text-yellow-400'
    default: return 'text-[var(--text-muted)]'
  }
})

const nameColorClass = computed(() => {
  switch (challengeStatus.value) {
    case 'solved': return 'text-green-400'
    case 'attempting': return 'text-yellow-400'
    default: return ''
  }
})

function handleClick() {
  if (props.entry.type === 'directory') {
    expanded.value = !expanded.value
  }
}
</script>
