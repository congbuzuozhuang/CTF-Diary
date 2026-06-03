<template>
  <div ref="editorRef" class="md-editor h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { closeBrackets, autocompletion } from '@codemirror/autocomplete'
import { bracketMatching } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { oneDark } from '@codemirror/theme-one-dark'
import { lightThemeExtension } from './cmTheme'

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

onMounted(() => {
  if (!editorRef.value) return

  const langExtension = props.language === 'python'
    ? python()
    : props.language === 'markdown'
      ? markdown({ base: markdownLanguage, codeLanguages: [] })
      : []

  const themeExtension = props.dark ? oneDark : lightThemeExtension

  const extensions = [
    langExtension,
    syntaxHighlighting(defaultHighlightStyle),
    history(),
    closeBrackets(),
    autocompletion(),
    bracketMatching(),
    highlightSelectionMatches(),
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    keymap.of([
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
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        emit('update:modelValue', update.state.doc.toString())
      }
      // Emit cursor position
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head
        const line = update.state.doc.lineAt(pos)
        emit('cursor', { line: line.number, col: pos - line.from + 1 })
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

// Rebuild editor when theme changes
watch(() => props.dark, () => {
  if (view) {
    view.destroy()
    view = null
  }
  // Trigger re-mount through key change on parent
  if (editorRef.value) {
    const langExtension = props.language === 'python'
      ? python()
      : props.language === 'markdown'
        ? markdown({ base: markdownLanguage, codeLanguages: [] })
        : []

    const themeExtension = props.dark ? oneDark : lightThemeExtension

    view = new EditorView({
      state: EditorState.create({
        doc: props.modelValue,
        extensions: [
          langExtension,
          syntaxHighlighting(defaultHighlightStyle),
          history(),
          closeBrackets(),
          autocompletion(),
          bracketMatching(),
          highlightSelectionMatches(),
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            indentWithTab,
            { key: 'Ctrl-s', run: () => { emit('save'); return true } }
          ]),
          themeExtension,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              emit('update:modelValue', update.state.doc.toString())
            }
            if (update.selectionSet || update.docChanged) {
              const pos = update.state.selection.main.head
              const line = update.state.doc.lineAt(pos)
              emit('cursor', { line: line.number, col: pos - line.from + 1 })
            }
          }),
          EditorState.readOnly.of(props.readonly || false),
          EditorView.lineWrapping
        ]
      }),
      parent: editorRef.value
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
