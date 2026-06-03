<template>
  <div ref="editorRef" class="md-editor h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { closeBrackets } from '@codemirror/autocomplete'

const props = defineProps<{
  modelValue: string
  language?: 'markdown' | 'python'
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'save': []
}>()

const editorRef = ref<HTMLElement>()
let view: EditorView | null = null

onMounted(() => {
  if (!editorRef.value) return

  const langExtension = props.language === 'python'
    ? python()
    : markdown({ base: markdownLanguage })

  const extensions = [
    langExtension,
    syntaxHighlighting(defaultHighlightStyle),
    history(),
    closeBrackets(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      {
        key: 'Ctrl-s',
        run: () => {
          emit('save')
          return true
        }
      }
    ]),
    oneDark,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        emit('update:modelValue', update.state.doc.toString())
      }
    }),
    EditorState.readOnly.of(props.readonly || false),
    EditorView.lineWrapping
  ]

  view = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions
    }),
    parent: editorRef.value
  })
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

// Sync external changes
watch(() => props.modelValue, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newVal
      }
    })
  }
})
</script>

<style>
.md-editor {
  height: 100%;
  overflow: auto;
}
.md-editor .cm-editor {
  height: 100%;
  font-size: 14px;
}
.md-editor .cm-editor .cm-scroller {
  font-family: 'Consolas', 'Cascadia Code', 'Fira Code', 'Source Code Pro', 'JetBrains Mono', monospace;
}
.md-editor .cm-editor.cm-focused {
  outline: none;
}
</style>
