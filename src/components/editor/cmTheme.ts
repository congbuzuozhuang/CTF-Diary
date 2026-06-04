import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

// ════════════════════════════════════════════════════════════════
// Light transparent theme — matches card glass effect
// ════════════════════════════════════════════════════════════════
const lightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent'
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
      backgroundColor: 'rgba(191, 219, 254, 0.55) !important'
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(241, 245, 249, 0.5)'
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(224, 242, 254, 0.5)'
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(219, 234, 254, 0.6)',
      outline: '1px solid #93c5fd'
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: 'rgba(254, 226, 226, 0.6)',
      outline: '1px solid #fca5a5'
    },
    '.cm-gutters': {
      backgroundColor: 'rgba(248, 250, 252, 0.7)',
      color: '#94a3b8',
      border: 'none',
      borderRight: '1px solid rgba(226, 232, 240, 0.6)',
      paddingRight: '8px'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(241, 245, 249, 0.5)',
      color: '#64748b'
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'rgba(241, 245, 249, 0.7)',
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

// ════════════════════════════════════════════════════════════════
// Dark transparent theme — oneDark-inspired palette, glass effect
// ════════════════════════════════════════════════════════════════
const darkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
      color: '#abb2bf'
    },
    '.cm-content': {
      caretColor: '#528bff',
      fontFamily: "'Consolas', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
      fontSize: '14px',
      lineHeight: '1.7',
      padding: '4px 0'
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#528bff'
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(37, 99, 235, 0.35) !important'
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(51, 65, 85, 0.45)'
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(37, 99, 235, 0.2)'
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(37, 99, 235, 0.25)',
      outline: '1px solid #528bff'
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: 'rgba(220, 38, 38, 0.25)',
      outline: '1px solid #ef4444'
    },
    '.cm-gutters': {
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      color: '#5c6370',
      border: 'none',
      borderRight: '1px solid rgba(51, 65, 85, 0.6)',
      paddingRight: '8px'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(51, 65, 85, 0.45)',
      color: '#abb2bf'
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'rgba(51, 65, 85, 0.6)',
      border: '1px solid #3b4252',
      color: '#abb2bf',
      borderRadius: '4px',
      padding: '0 4px'
    },
    '.cm-tooltip': {
      backgroundColor: '#1e2127',
      border: '1px solid #3b4252',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      color: '#abb2bf'
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#2c313a',
        color: '#abb2bf'
      }
    }
  },
  { dark: true }
)

const darkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#c678dd', fontWeight: '600' },
  { tag: tags.comment, color: '#5c6370', fontStyle: 'italic' },
  { tag: tags.string, color: '#98c379' },
  { tag: tags.number, color: '#d19a66' },
  { tag: tags.bool, color: '#d19a66' },
  { tag: tags.regexp, color: '#e06c75' },
  { tag: tags.typeName, color: '#e5c07b' },
  { tag: tags.className, color: '#e5c07b' },
  { tag: tags.function(tags.variableName), color: '#61afef' },
  { tag: tags.definition(tags.variableName), color: '#abb2bf' },
  { tag: tags.labelName, color: '#abb2bf' },
  { tag: tags.operator, color: '#abb2bf' },
  { tag: tags.punctuation, color: '#5c6370' },
  { tag: tags.bracket, color: '#5c6370' },
  { tag: tags.heading, color: '#e06c75', fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.link, color: '#61afef', textDecoration: 'underline' },
  { tag: tags.contentSeparator, color: '#5c6370' },
  { tag: tags.processingInstruction, color: '#c678dd' },
  { tag: tags.meta, color: '#c678dd' },
  { tag: tags.url, color: '#61afef' },
  { tag: tags.propertyName, color: '#e06c75' },
  { tag: tags.attributeName, color: '#d19a66' },
  { tag: tags.quote, color: '#98c379' },
  { tag: tags.deleted, color: '#e06c75' },
  { tag: tags.inserted, color: '#98c379' },
  { tag: tags.changed, color: '#e5c07b' }
])

export const darkThemeExtension = [
  darkTheme,
  syntaxHighlighting(darkHighlight)
]
