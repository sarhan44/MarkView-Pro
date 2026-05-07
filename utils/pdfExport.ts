import DOMPurify from 'dompurify';
import {
  extractFirstH1,
  extractMermaidTitle,
  hoistMermaidBlocksInSanitizedHtml,
  parseFrontmatter,
  renderMarkdownToHtml,
} from './markdown';
import { ensureMermaidInitialized, getMermaid } from './mermaidClient';

declare const html2pdf: (() => {
  set: (opts: Record<string, unknown>) => {
    from: (el: HTMLElement) => {
      toPdf: () => { get: (key: 'pdf') => Promise<{ save: (name: string) => void }> };
    };
  };
}) | undefined;

function formatExportDate(d = new Date()): string {
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${month} ${day}, ${d.getFullYear()}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function waitAnimationFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let n = 0;
    const step = () => {
      n++;
      if (n >= count) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function getSvgRenderDimensions(svg: SVGSVGElement): { w: number; h: number } {
  const vb = svg.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    return { w: vb.width, h: vb.height };
  }
  try {
    const b = svg.getBBox();
    if (Number.isFinite(b.width) && Number.isFinite(b.height) && b.width > 0 && b.height > 0) {
      return { w: b.width, h: b.height };
    }
  } catch {
    /* not laid out yet */
  }
  const rect = svg.getBoundingClientRect();
  if (rect.width > 1 && rect.height > 1) {
    return { w: rect.width, h: rect.height };
  }
  const wAttr = parseFloat(svg.getAttribute('width') || '0');
  const hAttr = parseFloat(svg.getAttribute('height') || '0');
  if (wAttr > 0 && hAttr > 0) return { w: wAttr, h: hAttr };
  return { w: 960, h: 540 };
}

function prepareSvgCloneForRaster(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  const { w, h } = getSvgRenderDimensions(svg);
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const vb = svg.viewBox?.baseVal;
  if (vb && !clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
  }
  return clone;
}

async function loadSvgOntoCanvas(
  svg: SVGSVGElement,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): Promise<void> {
  const clone = prepareSvgCloneForRaster(svg);
  const svgXml = new XMLSerializer().serializeToString(clone);

  const draw = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = src;
    });

  const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    await draw(blobUrl);
  } catch {
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`;
    await draw(encoded);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

declare global {
  interface Window {
    html2canvas?: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

async function snapshotElementToPngDataUrl(el: HTMLElement): Promise<string | null> {
  const fn = typeof window !== 'undefined' ? window.html2canvas : undefined;
  if (!fn) return null;
  try {
    const canvas = await fn(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

async function svgToPngDataUrl(svg: SVGSVGElement): Promise<string> {
  const { w, h } = getSvgRenderDimensions(svg);
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w * scale));
  canvas.height = Math.max(1, Math.ceil(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  await loadSvgOntoCanvas(svg, ctx, canvas);
  return canvas.toDataURL('image/png');
}

function stashMermaidSources(root: HTMLElement): void {
  root.querySelectorAll('.mermaid-diagram-wrap').forEach((wrap) => {
    const el = wrap as HTMLElement;
    const pre = el.querySelector('pre.mermaid');
    if (pre?.textContent) el.dataset.mermaidSource = pre.textContent;
  });
}

async function renderMermaidDefinitionToPng(
  source: string,
  uniqueId: string,
): Promise<string | null> {
  const mermaid = getMermaid();
  const trimmed = source.trim();
  if (!trimmed) return null;
  try {
    const { svg: svgMarkup } = await mermaid.render(uniqueId, trimmed);
    const holder = document.createElement('div');
    holder.innerHTML = svgMarkup;
    const svg = holder.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return null;
    return await svgToPngDataUrl(svg);
  } catch {
    return null;
  }
}

async function rasterizeMermaidBlocks(root: HTMLElement): Promise<void> {
  const wraps = root.querySelectorAll('.mermaid-diagram-wrap');
  let idx = 0;
  for (const wrap of Array.from(wraps)) {
    const el = wrap as HTMLElement;
    const source = el.dataset.mermaidSource ?? '';
    const caption = extractMermaidTitle(source);
    const svg = el.querySelector('svg') as SVGSVGElement | null;
    const figure = document.createElement('div');
    figure.className = 'pdf-mermaid-figure';

    let dataUrl: string | null = null;

    if (svg) {
      try {
        dataUrl = await svgToPngDataUrl(svg);
      } catch {
        dataUrl = null;
      }
    }

    if (!dataUrl && source) {
      dataUrl = await renderMermaidDefinitionToPng(source, `mmd-pdf-${idx}-${Date.now()}`);
    }

    if (!dataUrl) {
      dataUrl = await snapshotElementToPngDataUrl(el);
    }

    if (!dataUrl) {
      figure.innerHTML =
        '<p class="pdf-mermaid-fallback">Diagram could not be exported to PDF.</p>';
      el.replaceChildren(figure);
      idx++;
      continue;
    }

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Mermaid diagram';
    figure.appendChild(img);
    if (caption) {
      const cap = document.createElement('p');
      cap.className = 'pdf-mermaid-caption';
      cap.textContent = caption;
      figure.appendChild(cap);
    }
    el.replaceChildren(figure);
    idx++;
  }
}

function buildPdfStyles(): string {
  return `
    .pdf-export-root {
      font-family: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
      color: #333;
      font-size: 11pt;
      line-height: 1.7;
      box-sizing: border-box;
    }
    .pdf-export-root * { box-sizing: border-box; }
    .pdf-cover {
      text-align: center;
      padding: 48px 24px 56px;
      page-break-after: always;
    }
    .pdf-cover-title {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 16px;
    }
    .pdf-cover-accent {
      width: 120px;
      height: 4px;
      background: #4a90d9;
      margin: 0 auto 24px;
      border-radius: 2px;
    }
    .pdf-cover-meta, .pdf-cover-author {
      font-size: 11pt;
      color: #555;
      margin: 6px 0;
    }
    .pdf-flow { padding: 0; }
    .pdf-flow h1 {
      font-size: 24px;
      color: #1a1a2e;
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 6px;
      margin: 1.2em 0 0.6em;
    }
    .pdf-flow h2 {
      font-size: 18px;
      color: #16213e;
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 4px;
      margin: 1em 0 0.5em;
    }
    .pdf-flow h3, .pdf-flow h4, .pdf-flow h5, .pdf-flow h6 {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin: 0.9em 0 0.4em;
    }
    .pdf-flow a {
      color: #2563eb;
      text-decoration: underline;
    }
    .pdf-flow p { margin: 0.6em 0; }
    .pdf-flow blockquote {
      border-left: 4px solid #4a90d9;
      background: #f0f4ff;
      padding: 8px 12px;
      margin: 1em 0;
      font-style: italic;
    }
    .pdf-flow code {
      font-family: 'Courier New', Courier, monospace;
      background: #f4f4f4;
      border-radius: 3px;
      padding: 1px 4px;
      font-size: 0.95em;
    }
    .pdf-flow pre:not(.mermaid) {
      background: #1e1e1e;
      color: #d4d4d4;
      border-radius: 6px;
      padding: 12px;
      font-size: 9pt;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .pdf-flow pre:not(.mermaid) code {
      background: none;
      color: inherit;
      padding: 0;
      font-size: inherit;
    }
    .pdf-mermaid-figure {
      margin: 16px auto;
      max-width: 90%;
      text-align: center;
    }
    .pdf-mermaid-figure img {
      max-width: 90%;
      margin: 0 auto;
      display: block;
      border: 1px solid #cbd5e1;
    }
    .pdf-mermaid-caption {
      font-size: 9pt;
      color: #64748b;
      margin: 8px 0 0;
      font-style: italic;
    }
    .pdf-mermaid-fallback {
      font-size: 9pt;
      color: #b45309;
      text-align: center;
      padding: 12px;
      border: 1px solid #fcd34d;
      background: #fffbeb;
      border-radius: 6px;
    }
    .pdf-flow table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin: 1em 0;
    }
    .pdf-flow thead th {
      background: #2d3748;
      color: #fff;
      font-weight: bold;
      text-align: left;
      padding: 8px;
      border: 1px solid #1a202c;
    }
    .pdf-flow tbody td {
      padding: 8px;
      border: 1px solid #cbd5e1;
    }
    .pdf-flow tbody tr:nth-child(even) { background: #f7fafc; }
    .pdf-flow tbody tr:nth-child(odd) { background: #fff; }
    .pdf-flow ul, .pdf-flow ol { margin: 0.6em 0 0.6em 1.2em; padding-left: 1em; }
    .pdf-flow hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 1.5em 0;
    }
    .pdf-flow img { max-width: 100%; height: auto; }
    .pdf-watermark {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #94a3b8;
    }
    .pdf-watermark a { color: #4f46e5; text-decoration: none; }
  `;
}

function decoratePdfPdf(
  pdf: {
    internal: {
      getNumberOfPages: () => number;
      pageSize: { getWidth: () => number; getHeight: () => number };
    };
    setPage: (n: number) => void;
    setFontSize: (n: number) => void;
    setTextColor: (...args: number[]) => void;
    setDrawColor: (...args: number[]) => void;
    line: (x1: number, y1: number, x2: number, y2: number) => void;
    text: (
      s: string,
      x: number,
      y: number,
      opts?: { align?: string; maxWidth?: number },
    ) => void;
    save: (name: string) => void;
  },
  docTitle: string,
  dateLabel: string,
  filename: string,
): void {
  const pageCount = pdf.internal.getNumberOfPages();
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginL = 18;
  const marginR = 18;

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(26, 26, 46);
    pdf.text(docTitle, marginL, 14);
    pdf.text(dateLabel, pageW - marginR, 14, { align: 'right' });
    pdf.setDrawColor(200, 200, 200);
    pdf.line(marginL, 17, pageW - marginR, 17);
    pdf.setTextColor(80, 88, 103);
    pdf.setFontSize(9);
    pdf.text(`Page ${i} of ${pageCount}`, pageW / 2, pageH - 12, { align: 'center' });
    pdf.line(marginL, pageH - 16, pageW - marginR, pageH - 16);
  }
  pdf.save(filename);
}

export async function exportMarkdownToPdf(
  markdown: string,
  filename = 'document.pdf',
): Promise<void> {
  if (typeof html2pdf !== 'function') {
    throw new Error('html2pdf is not loaded');
  }

  const { attributes, body } = parseFrontmatter(markdown);
  const docTitle =
    extractFirstH1(body) || attributes.title || attributes.Title || 'Document';
  const dateLabel = formatExportDate();
  const rawHtml = renderMarkdownToHtml(body);
  const html = hoistMermaidBlocksInSanitizedHtml(DOMPurify.sanitize(rawHtml));

  const authorLine = attributes.author || attributes.Author || '';
  const coverHtml = `
    <div class="pdf-cover">
      <h1 class="pdf-cover-title">${escapeHtml(docTitle)}</h1>
      <div class="pdf-cover-accent"></div>
      <p class="pdf-cover-meta">${escapeHtml(dateLabel)}</p>
      ${authorLine ? `<p class="pdf-cover-author">Author: ${escapeHtml(authorLine)}</p>` : ''}
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '210mm';
  wrapper.innerHTML = `
    <div class="pdf-export-root">
      <style>${buildPdfStyles()}</style>
      ${coverHtml}
      <div class="pdf-flow">${html}</div>
      <div class="pdf-watermark">
        Made with <a href="https://markdown.sarhankhan.in">MarkViewPro</a>
      </div>
    </div>
  `;

  const root = wrapper.querySelector('.pdf-export-root') as HTMLElement;
  document.body.appendChild(wrapper);

  stashMermaidSources(root);

  ensureMermaidInitialized();
  const mermaid = getMermaid();
  try {
    const nodes = root.querySelectorAll('.mermaid');
    if (nodes.length) {
      await mermaid.run({ nodes: Array.from(nodes) as HTMLElement[], suppressErrors: true });
    }
  } catch {
    /* individual blocks may still fail */
  }

  await waitAnimationFrames(2);
  await rasterizeMermaidBlocks(root);

  const opt = {
    margin: [20, 18, 20, 18],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['img', '.pdf-mermaid-figure'] },
  };

  try {
    const pdf = await html2pdf().set(opt).from(root).toPdf().get('pdf');
    decoratePdfPdf(pdf, docTitle, dateLabel, filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}
