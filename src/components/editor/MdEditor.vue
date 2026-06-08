<template>
  <div ref="editorRef" class="md-editor h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { EditorState, Prec } from '@codemirror/state'
import { markdown, markdownLanguage, markdownKeymap } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching } from '@codemirror/language'
import { closeBrackets, autocompletion } from '@codemirror/autocomplete'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { lightThemeExtension, darkThemeExtension } from './cmTheme'
import { wysiwygPlugin } from './wysiwygPlugin'

const props = defineProps<{
  modelValue: string
  language?: 'markdown' | 'python' | 'text'
  readonly?: boolean
  dark?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'save': []
  'cursor': [pos: { line: number; col: number }]
}>()

const editorRef = ref<HTMLElement>()
let view: EditorView | null = null

function createUpdateListener() {
  return EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString())
    }
    if (update.selectionSet || update.docChanged) {
      const pos = update.state.selection.main.head
      const line = update.state.doc.lineAt(pos)
      emit('cursor', { line: line.number, col: pos - line.from + 1 })
    }
  })
}

function buildExtensions(dark: boolean) {
  const langExtension = props.language === 'python'
    ? python()
    : props.language === 'markdown'
      ? markdown({ base: markdownLanguage, codeLanguages: [] })
      : []

  const themeExtension = dark ? darkThemeExtension : lightThemeExtension

  return [
    langExtension,
    Prec.highest(wysiwygPlugin),
    history(),
    closeBrackets(),
    autocompletion(),
    bracketMatching(),
    highlightSelectionMatches(),
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    keymap.of([
      ...markdownKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
      {
        key: 'Ctrl-s',
        run: () => {
          emit('save')
          return true
        }
      }
    ]),
    themeExtension,
    createUpdateListener(),
    EditorState.readOnly.of(props.readonly || false),
    EditorView.lineWrapping
  ]
}

function createEditor() {
  if (!editorRef.value) return
  view = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions: buildExtensions(props.dark ?? false)
    }),
    parent: editorRef.value
  })
}

onMounted(() => {
  createEditor()
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

// Sync external content changes
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

// Rebuild editor when theme changes (preserves document content)
watch(() => props.dark, () => {
  if (!view) return
  view.destroy()
  createEditor()
})
</script>

<style>
.md-editor {
  height: 100%;
  overflow: auto;
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.md-editor .cm-editor {
  height: 100%;
  font-size: 14px;
  border-radius: 8px;
}
.md-editor .cm-editor .cm-scroller {
  height: 100% !important;
  font-family: 'Consolas', 'Cascadia Code', 'Fira Code', 'Source Code Pro', 'JetBrains Mono', monospace;
}
.md-editor .cm-editor.cm-focused {
  outline: none;
}
</style>
