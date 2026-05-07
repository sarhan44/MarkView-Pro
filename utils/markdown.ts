import { marked } from 'marked';

let markedMermaidConfigured = false;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Undo HTML entities inside `<code>` bodies produced by marked's default code renderer. */
function decodeMarkdownCodeInner(encoded: string): string {
  return encoded
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/');
}

/**
 * marked's default fenced output is `<pre><code class="language-mermaid">…</code></pre>`.
 * Mermaid's run() looks for `.mermaid`, so convert those blocks to our wrapper + `<pre class="mermaid">`.
 */
function convertDefaultMermaidFencedBlocks(html: string): string {
  return html.replace(
    /<pre><code class="([^"]*\s)?language-mermaid(?:\s[^"]*)?">([\s\S]*?)<\/code><\/pre>/gi,
    (_, _classes, inner) => {
      const raw = decodeMarkdownCodeInner(inner);
      return `<div class="mermaid-diagram-wrap"><pre class="mermaid">${escapeHtml(raw)}</pre></div>`;
    },
  );
}

/** First keyword line of common Mermaid diagram types (fenced block heuristic). */
const MERMAID_LEADING_SYNTAX =
  /^\s*(flowchart|graph|sequenceDiagram|erDiagram|gantt|classDiagram|stateDiagram|stateDiagram-v2|pie|gitGraph|journey|C4Context|C4Container|mindmap|timeline|sankey-beta|block-beta|requirementDiagram|kanban|quadrantChart)\b/i;

/**
 * After DOMPurify: turn any remaining `pre > code` Mermaid fences into `<pre class="mermaid">`
 * so `mermaid.run()` always finds them (handles class order, missing renderer, etc.).
 */
export function hoistMermaidBlocksInSanitizedHtml(html: string): string {
  if (typeof document === 'undefined') return html;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  tpl.content.querySelectorAll('pre').forEach((pre) => {
    const code = pre.querySelector(':scope > code');
    if (!code) return;
    const cls = code.getAttribute('class') || '';
    const txt = code.textContent ?? '';
    const tagged =
      /\blanguage-mermaid\b/.test(cls) ||
      /\bmermaid\b/.test(cls) ||
      /\bhljs-mermaid\b/.test(cls);
    const heuristic = MERMAID_LEADING_SYNTAX.test(txt);
    if (!tagged && !heuristic) return;
    if (pre.closest('.mermaid-diagram-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'mermaid-diagram-wrap';
    const mpre = document.createElement('pre');
    mpre.className = 'mermaid';
    mpre.textContent = txt;
    wrap.appendChild(mpre);
    pre.replaceWith(wrap);
  });
  return tpl.innerHTML;
}

/** Configure marked once: ```mermaid blocks become <pre class="mermaid"> for Mermaid.run(). */
export function ensureMarkedWithMermaid(): void {
  if (markedMermaidConfigured) return;
  marked.use({
    renderer: {
      code(token) {
        const lang = token.lang?.trim().toLowerCase();
        if (lang === 'mermaid') {
          return `<div class="mermaid-diagram-wrap"><pre class="mermaid">${escapeHtml(token.text)}</pre></div>`;
        }
        return false;
      },
    },
  });
  markedMermaidConfigured = true;
}

export function parseFrontmatter(raw: string): {
  attributes: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { attributes: {}, body: raw };
  }
  const attributes: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const kv = trimmed.match(/^([\w-]+):\s*(.*)$/);
    if (kv) {
      let v = kv[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      attributes[kv[1]] = v;
    }
  }
  return { attributes, body: match[2] };
}

export function extractFirstH1(markdown: string): string | null {
  for (const line of markdown.split(/\r?\n/)) {
    const m = line.match(/^#\s+(.+)$/);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Extract Mermaid `title` directive if present (e.g. title Finance Gantt or flowchart title …).
 */
export function extractMermaidTitle(diagramSource: string): string | null {
  const titleMatch = diagramSource.match(/^\s*(?:(?:%%\s*)?title\s+([^\n]+)|title\s+([^\n]+))/im);
  if (titleMatch) {
    return (titleMatch[1] || titleMatch[2] || '').trim() || null;
  }
  const flowchartTitle = diagramSource.match(/\b(title)\s+([^\n;]+)/i);
  if (flowchartTitle) {
    return flowchartTitle[2].trim().replace(/["']/g, '') || null;
  }
  return null;
}

export function renderMarkdownToHtml(markdown: string): string {
  ensureMarkedWithMermaid();
  const parsed = marked.parse(markdown, { async: false }) as string;
  return convertDefaultMermaidFencedBlocks(parsed);
}
