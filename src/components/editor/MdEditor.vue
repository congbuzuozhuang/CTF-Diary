<template>
  <div class="md-editor-wrapper">
    <!-- Quick insert toolbar (Markdown only) -->
    <div v-if="language === 'markdown' && !readonly" class="md-toolbar">
      <button v-for="btn in toolbarButtons" :key="btn.label"
        class="md-toolbar-btn"
        :title="btn.label + (btn.key ? ` (${btn.key})` : '')"
        @click="insertMarkup(btn)">
        <span v-html="btn.icon"></span>
      </button>
    </div>
    <div ref="editorRef" class="md-editor h-full"></div>
  </div>
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

interface ToolbarButton {
  label: string
  key?: string
  icon: string
  before: string
  after: string
  block?: boolean
}

const toolbarButtons: ToolbarButton[] = [
  { label: '粗体', key: 'Ctrl+B', icon: '<b>B</b>', before: '**', after: '**' },
  { label: '斜体', key: 'Ctrl+I', icon: '<i>I</i>', before: '*', after: '*' },
  { label: '删除线', icon: '<s>S</s>', before: '~~', after: '~~' },
  { label: '行内代码', icon: '&lt;/&gt;', before: '`', after: '`' },
  { label: '代码块', icon: '{}', before: '\n```\n', after: '\n```\n', block: true },
  { label: '引用', icon: '&gt;', before: '> ', after: '', block: true },
  { label: '链接', icon: '🔗', before: '[', after: '](url)' },
  { label: '图片', icon: '🖼', before: '![', after: '](url)' },
]

const props = defineProps<{
  modelValue: string
  language?: 'markdown' | 'python' | 'text'
  readonly?: boolean
  dark?: boolean
  fontSize?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'save': []
  'cursor': [pos: { line: number; col: number }]
}>()

const editorRef = ref<HTMLElement>()
let view: EditorView | null = null

// ── Toolbar actions ──

function insertMarkup(btn: ToolbarButton) {
  if (!view) return
  const sel = view.state.selection.main

  if (btn.block) {
    // Block-level: insert at line start / around selected lines
    const fromLine = view.state.doc.lineAt(sel.from)
    const toLine = view.state.doc.lineAt(sel.to)
    view.dispatch({
      changes: [
        { from: fromLine.from, insert: btn.before },
        { from: toLine.to, insert: btn.after }
      ],
      selection: { anchor: fromLine.from + btn.before.length, head: toLine.to + btn.before.length }
    })
  } else {
    // Inline: wrap selection or insert at cursor
    const selected = view.state.sliceDoc(sel.from, sel.to)
    if (sel.from !== sel.to) {
      view.dispatch({
        changes: [
          { from: sel.from, to: sel.from, insert: btn.before },
          { from: sel.to + btn.before.length, to: sel.to + btn.before.length, insert: btn.after }
        ],
        selection: { anchor: sel.from + btn.before.length, head: sel.to + btn.before.length + selected.length }
      })
    } else {
      // No selection: insert markup at cursor with placeholder
      const placeholder = btn.before === '[' ? 'text' : btn.before === '![' ? 'alt' : '文本'
      view.dispatch({
        changes: { from: sel.from, insert: `${btn.before}${placeholder}${btn.after}` },
        selection: { anchor: sel.from + btn.before.length, head: sel.from + btn.before.length + placeholder.length }
      })
    }
  }
  view.focus()
}

// ── Editor setup ──

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

  const extensions: any[] = [
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
      { key: 'Ctrl-s', run: () => { emit('save'); return true } }
    ]),
    themeExtension,
    createUpdateListener(),
    EditorState.readOnly.of(props.readonly || false),
    EditorView.lineWrapping
  ]

  if (props.fontSize) {
    extensions.push(EditorView.theme({
      '&': { fontSize: `${props.fontSize}px` }
    }))
  }

  return extensions
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

onMounted(() => { createEditor() })
onBeforeUnmount(() => { view?.destroy(); view = null })

watch(() => props.modelValue, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newVal }
    })
  }
})

watch(() => props.dark, () => {
  if (!view) return
  view.destroy()
  createEditor()
})
</script>

<style>
.md-editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.md-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  flex-shrink: 0;
}
.md-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;
}
.md-toolbar-btn:hover {
  background: var(--btn-ghost-hover-bg);
  color: var(--text-primary);
}
.md-editor {
  height: 100%;
  overflow: auto;
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.md-editor .cm-editor {
  height: 100%;
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
