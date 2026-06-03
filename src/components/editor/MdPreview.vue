<template>
  <div class="md-preview prose" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: (str: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        // fall through
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

const renderedHtml = computed(() => md.render(props.content || ''))
</script>

<style>
.md-preview {
  padding: 1rem;
  line-height: 1.8;
  color: var(--text-primary);
  font-size: 15px;
}

.md-preview h1 { font-size: 1.8em; font-weight: 700; margin: 1em 0 0.5em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
.md-preview h2 { font-size: 1.5em; font-weight: 700; margin: 1em 0 0.5em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.2em; }
.md-preview h3 { font-size: 1.25em; font-weight: 600; margin: 0.8em 0 0.4em; }
.md-preview h4 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; }

.md-preview p { margin: 0.6em 0; }

.md-preview a { color: #60a5fa; text-decoration: underline; }
.md-preview a:hover { color: #93bbfd; }

.md-preview blockquote {
  border-left: 3px solid #4b5563;
  padding-left: 1em;
  margin: 0.6em 0;
  color: var(--text-secondary);
}

.md-preview code {
  background: var(--bg-tertiary);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Consolas', 'Cascadia Code', 'Fira Code', monospace;
}

.md-preview pre.hljs {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 1em;
  overflow-x: auto;
  margin: 0.6em 0;
  font-size: 0.85em;
  line-height: 1.6;
}

.md-preview pre.hljs code {
  background: none;
  padding: 0;
  font-size: inherit;
}

.md-preview ul, .md-preview ol {
  padding-left: 1.5em;
  margin: 0.4em 0;
}

.md-preview li {
  margin: 0.2em 0;
}

.md-preview ul { list-style-type: disc; }
.md-preview ol { list-style-type: decimal; }

.md-preview table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.6em 0;
}

.md-preview th, .md-preview td {
  border: 1px solid var(--border-color);
  padding: 0.5em 0.8em;
  text-align: left;
}

.md-preview th {
  background: var(--bg-tertiary);
  font-weight: 600;
}

.md-preview hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1.5em 0;
}

.md-preview img {
  max-width: 100%;
  border-radius: 6px;
  margin: 0.5em 0;
}

.md-preview input[type="checkbox"] {
  margin-right: 0.4em;
}
</style>
