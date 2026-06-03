import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

// Light theme matching the app's light mode aesthetic
const lightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#ffffff',
      color: '#1e293b'
    },
    '.cm-content': {
      caretColor: '#3b82f6',
      fontFamily: "'Consolas', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
      fontSize: '14px',
      lineHeight: '1.7',
      padding: '4px 0'
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#3b82f6'
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#bfdbfe !important'
    },
    '.cm-activeLine': {
      backgroundColor: '#f1f5f9'
    },
    '.cm-selectionMatch': {
      backgroundColor: '#e0f2fe'
    },
    '.cm-matchingBracket': {
      backgroundColor: '#dbeafe',
      outline: '1px solid #93c5fd'
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: '#fee2e2',
      outline: '1px solid #fca5a5'
    },
    '.cm-gutters': {
      backgroundColor: '#f8fafc',
      color: '#94a3b8',
      border: 'none',
      borderRight: '1px solid #e2e8f0',
      paddingRight: '8px'
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#f1f5f9',
      color: '#64748b'
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#f1f5f9',
      border: '1px solid #e2e8f0',
      color: '#64748b',
      borderRadius: '4px',
      padding: '0 4px'
    },
    '.cm-tooltip': {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      color: '#1e293b'
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#eff6ff',
        color: '#1e293b'
      }
    }
  },
  { dark: false }
)

const lightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#7c3aed', fontWeight: '600' },
  { tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },
  { tag: tags.string, color: '#059669' },
  { tag: tags.number, color: '#d97706' },
  { tag: tags.bool, color: '#7c3aed' },
  { tag: tags.regexp, color: '#dc2626' },
  { tag: tags.typeName, color: '#2563eb' },
  { tag: tags.className, color: '#2563eb' },
  { tag: tags.function(tags.variableName), color: '#0891b2' },
  { tag: tags.definition(tags.variableName), color: '#1e293b' },
  { tag: tags.labelName, color: '#1e293b' },
  { tag: tags.operator, color: '#475569' },
  { tag: tags.punctuation, color: '#64748b' },
  { tag: tags.bracket, color: '#64748b' },
  { tag: tags.heading, color: '#0f172a', fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
  { tag: tags.contentSeparator, color: '#94a3b8' },
  { tag: tags.processingInstruction, color: '#9333ea' },
  { tag: tags.meta, color: '#9333ea' },
  { tag: tags.url, color: '#2563eb' }
])

export const lightThemeExtension = [
  lightTheme,
  syntaxHighlighting(lightHighlight)
]

// Dark theme re-export (use oneDark from @codemirror/theme-one-dark)
import { oneDark } from '@codemirror/theme-one-dark'
export { oneDark as darkThemeExtension }
