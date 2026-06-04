<template>
  <div ref="viewerRef" class="code-viewer h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { python } from '@codemirror/lang-python'
import { darkThemeExtension } from './cmTheme'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

const props = defineProps<{
  code: string
  language?: string
}>()

const viewerRef = ref<HTMLElement>()
let view: EditorView | null = null

onMounted(() => {
  if (!viewerRef.value) return

  const langExtension = props.language === 'python' ? python() : []

  view = new EditorView({
    state: EditorState.create({
      doc: props.code || '',
      extensions: [
        langExtension,
        syntaxHighlighting(defaultHighlightStyle),
        darkThemeExtension,
        EditorState.readOnly.of(true),
        EditorView.lineWrapping,
        EditorView.editable.of(false)
      ]
    }),
    parent: viewerRef.value
  })
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

watch(() => props.code, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newVal || ''
      }
    })
  }
})
</script>

<style>
.code-viewer {
  height: 100%;
  overflow: auto;
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.code-viewer .cm-editor {
  height: 100%;
  font-size: 14px;
  border-radius: 8px;
}
.code-viewer .cm-editor .cm-scroller {
  font-family: 'Consolas', 'Cascadia Code', 'Fira Code', 'Source Code Pro', 'JetBrains Mono', monospace;
}
.code-viewer .cm-editor.cm-focused {
  outline: none;
}
</style>
