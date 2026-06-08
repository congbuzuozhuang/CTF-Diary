import { ViewPlugin, Decoration, type DecorationSet, type ViewUpdate, WidgetType } from '@codemirror/view'
import { type EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { RangeSetBuilder } from '@codemirror/state'

/**
 * Typora-style WYSIWYG — v6: Single-pass, line-ordered
 *
 * Key fix: ALL decorations must be added to RangeSetBuilder in strict
 * ascending `from` order. Single loop over lines guarantees this.
 */

// ── Widget ──

class ActiveMarkerWidget extends WidgetType {
  constructor(private text: string) { super() }
  toDOM() {
    const span = document.createElement('span')
    span.textContent = this.text
    span.style.cssText = 'font-size:0.7em;opacity:0.5;user-select:none;display:inline-block'
    return span
  }
}

// ── Constants ──

const HEADING_SIZES = ['1.6em', '1.4em', '1.2em', '1.1em', '1.05em', '1em']
const INLINE_FORMAT_TYPES = new Set(['Emphasis', 'StrongEmphasis', 'Strikethrough', 'InlineCode'])

// ── Single-pass builder ──

function buildDecorations(view: EditorView): DecorationSet {
  try {
    return buildDecorationsUnsafe(view)
  } catch (e) {
    console.error('[wysiwyg]', e)
    const b = new RangeSetBuilder<Decoration>()
    b.add(view.state.doc.length, view.state.doc.length, Decoration.widget({
      widget: new class extends WidgetType {
        toDOM() {
          const el = document.createElement('div')
          el.style.cssText = 'color:red;font-size:12px;padding:8px;border:2px solid red'
          el.textContent = '⚠ ' + String(e)
          return el
        }
      },
      side: 0
    }))
    return b.finish()
  }
}

function buildDecorationsUnsafe(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const cursor = view.state.selection.main.head
  const doc = view.state.doc

  // Pre-scan: which inline format nodes contain the cursor?
  const activeFormatKeys = new Set<string>()
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from, to,
      enter: (ref) => {
        if (INLINE_FORMAT_TYPES.has(ref.type.name)) {
          if (cursor > ref.from && cursor < ref.to) {
            activeFormatKeys.add(`${ref.from}:${ref.to}`)
          }
        }
      }
    })
  }

  // Pre-scan: collect syntax tree inline nodes per line for Phase 2 merging
  // Map: line number → array of {from, to, type, parent, parentFrom, parentTo}
  const lineInlineNodes = new Map<number, Array<{
    from: number; to: number; type: string
    parentType: string; parentFrom: number; parentTo: number
  }>>()
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from, to,
      enter: (ref) => {
        const name = ref.type.name
        if (name === 'EmphasisMark' || name === 'StrikethroughMark' || name === 'CodeMark') {
          let p = ref.node.parent
          let pType = '', pFrom = 0, pTo = 0
          while (p) {
            if (INLINE_FORMAT_TYPES.has(p.type.name)) {
              pType = p.type.name; pFrom = p.from; pTo = p.to
              break
            }
            p = p.parent
          }
          const lineNum = doc.lineAt(ref.from).number
          if (!lineInlineNodes.has(lineNum)) lineInlineNodes.set(lineNum, [])
          lineInlineNodes.get(lineNum)!.push({
            from: ref.from, to: ref.to, type: name,
            parentType: pType, parentFrom: pFrom, parentTo: pTo
          })
        }
        if (name === 'LinkMark') {
          const lineNum = doc.lineAt(ref.from).number
          if (!lineInlineNodes.has(lineNum)) lineInlineNodes.set(lineNum, [])
          lineInlineNodes.get(lineNum)!.push({
            from: ref.from, to: ref.to, type: 'LinkMark',
            parentType: '', parentFrom: 0, parentTo: 0
          })
        }
        if (name === 'Blockquote') {
          // Collect inline children for italic styling
          let child = ref.node.firstChild
          while (child) {
            if (child.type.name !== 'QuoteMark') {
              const lineNum = doc.lineAt(child.from).number
              if (!lineInlineNodes.has(lineNum)) lineInlineNodes.set(lineNum, [])
              lineInlineNodes.get(lineNum)!.push({
                from: child.from, to: child.to, type: 'BlockquoteChild',
                parentType: '', parentFrom: 0, parentTo: 0
              })
            }
            child = child.nextSibling
          }
        }
      }
    })
  }

  // ── Pre-scan: find code block ranges (for per-line position styling) ──
  const codeBlockRanges: Array<{ start: number; end: number }> = []
  let cbScanning = false
  let cbStart = 0
  for (let i = 1; i <= doc.lines; i++) {
    const t = doc.line(i).text
    if (/^\s{0,3}```/.test(t)) {
      if (cbScanning) {
        codeBlockRanges.push({ start: cbStart, end: i })
        cbScanning = false
      } else {
        cbStart = i
        cbScanning = true
      }
    }
  }

  // ── Helper: get code block line position ──
  function getCodeBlockPos(lineNum: number): string | null {
    for (const r of codeBlockRanges) {
      if (lineNum > r.start && lineNum < r.end) {
        const len = r.end - r.start - 1 // body lines only
        if (len === 1) return 'single'
        if (lineNum === r.start + 1) return 'first'
        if (lineNum === r.end - 1) return 'last'
        return 'middle'
      }
    }
    return null
  }

  // ── Single pass over all lines ──
  let inCodeBlock = false

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const text = line.text

    // ═══ PHASE 1: Regex-based block detection ═══

    // ── Code fence toggle (allows up to 3 spaces indent per markdown spec) ──
    if (/^\s{0,3}```/.test(text)) {
      inCodeBlock = !inCodeBlock
      builder.add(line.from, line.to, Decoration.replace({}))
      continue
    }

    // ── Code block body ──
    const cbPos = getCodeBlockPos(i)
    if (cbPos) {
      const base = 'background-color:rgba(59,130,246,0.14);border-left:3px solid rgba(59,130,246,0.5);border-right:3px solid rgba(59,130,246,0.5);padding-left:12px;padding-right:12px'
      let style = base
      if (cbPos === 'first')   style = base + ';padding-top:10px;border-top:3px solid rgba(59,130,246,0.5);border-radius:6px 6px 0 0'
      else if (cbPos === 'last') style = base + ';padding-bottom:10px;border-bottom:3px solid rgba(59,130,246,0.5);border-radius:0 0 6px 6px'
      else if (cbPos === 'single') style = base + ';padding-top:10px;padding-bottom:10px;border:3px solid rgba(59,130,246,0.5);border-radius:6px'
      // middle: no radius, no top/bottom border, no extra padding
      builder.add(line.from, line.from, Decoration.line({
        attributes: { style }
      }))
      continue
    }

    // ── ATX Heading ──
    const hMatch = text.match(/^(#{1,6})(\s*)(.*)/)
    if (hMatch && hMatch[1].length <= 6) {
      const level = hMatch[1].length
      const size = HEADING_SIZES[level - 1]
      const hashEnd = line.from + hMatch[1].length
      const spaceEnd = hashEnd + hMatch[2].length

      builder.add(line.from, line.from, Decoration.line({
        attributes: { style: `font-size:${size}` }
      }))
      builder.add(line.from, hashEnd, Decoration.replace({}))
      if (spaceEnd < line.to) {
        builder.add(spaceEnd, line.to, Decoration.mark({
          attributes: { style: `font-size:${size}` }
        }))
      }
      continue
    }

    // ── Setext: look ahead to line i+1 ──
    if (i < doc.lines) {
      const nextText = doc.line(i + 1).text
      if (/^={3,}\s*$/.test(nextText)) {
        // Current line is Setext H1
        builder.add(line.from, line.from, Decoration.line({
          attributes: { style: 'font-size:1.6em' }
        }))
        builder.add(line.from, line.to, Decoration.mark({
          attributes: { style: 'font-size:1.6em' }
        }))
      } else if (/^-{3,}\s*$/.test(nextText) && !/^(#{1,6})\s?/.test(text)) {
        // Current line is Setext H2 (but not if it's already ATX)
        builder.add(line.from, line.from, Decoration.line({
          attributes: { style: 'font-size:1.4em' }
        }))
        builder.add(line.from, line.to, Decoration.mark({
          attributes: { style: 'font-size:1.4em' }
        }))
      }
    }

    // ── Setext underline (fade this line if it's === or ---) ──
    if (/^(={3,}|-{3,})\s*$/.test(text) && i > 1) {
      const prevText = doc.line(i - 1).text
      if (!/^(#{1,6})\s?/.test(prevText)) {
        builder.add(line.from, line.to, Decoration.mark({
          attributes: { style: 'font-size:0.65em;opacity:0.25' }
        }))
        continue
      }
    }

    // ── Blockquote ──
    if (/^>/.test(text)) {
      builder.add(line.from, line.from + 1, Decoration.replace({}))
    }

    // ── Unordered list ──
    const ulMatch = text.match(/^(\s*)([-*])\s/)
    if (ulMatch) {
      const markerStart = line.from + ulMatch[1].length
      builder.add(markerStart, markerStart + 1, Decoration.replace({}))
    }

    // ── Ordered list ──
    const olMatch = text.match(/^(\s*)(\d+\.)\s/)
    if (olMatch) {
      const markerStart = line.from + olMatch[1].length
      builder.add(markerStart, markerStart + olMatch[2].length, Decoration.replace({}))
    }

    // ═══ PHASE 2: Inline node decorations for this line ═══
    const nodes = lineInlineNodes.get(i)
    if (nodes) {
      for (const node of nodes) {
        if (node.type === 'LinkMark') {
          builder.add(node.from, node.to, Decoration.mark({
            attributes: { style: 'font-size:0.65em;opacity:0.4;vertical-align:super;font-weight:400' }
          }))
        } else if (node.type === 'BlockquoteChild') {
          builder.add(node.from, node.to, Decoration.mark({
            attributes: { style: 'font-style:italic' }
          }))
        } else {
          // EmphasisMark, StrikethroughMark, CodeMark
          const markActive = activeFormatKeys.has(`${node.parentFrom}:${node.parentTo}`)
          if (markActive) {
            const text = doc.sliceString(node.from, node.to)
            builder.add(node.from, node.to, Decoration.replace({
              widget: new ActiveMarkerWidget(text)
            }))
          } else {
            builder.add(node.from, node.to, Decoration.replace({}))
          }
        }
      }
    }
  }

  return builder.finish()
}

// ── Plugin ──

export const wysiwygPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) { this.decorations = buildDecorations(view) }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations }
)
