# MarkView Pro

A browser-based Markdown editor with live preview, **Mermaid diagrams**, and **PDF export**. Built with React, Vite, and TypeScript. Everything runs in the client except optional AI assistance.

## Features

- **Split, editor-only, and preview-only layouts** — toggle from the toolbar.
- **Draggable split** (desktop) — resize editor and preview; ratio is saved in `localStorage`.
- **Live Markdown preview** — [marked](https://marked.js.org/) plus [DOMPurify](https://github.com/cure53/DOMPurify) for safe HTML.
- **Mermaid** — fenced ` ```mermaid ` blocks render as diagrams in the preview (flowcharts, sequence, ER, Gantt, etc.). Mermaid is bundled via npm for reliable rendering with React.
- **Export**
  - **Markdown** — download `.md` with a small footer credit.
  - **PDF** — A4 layout via [html2pdf.js](https://github.com/eKoopmans/html2pdf.js); diagrams are rasterized to images for the PDF. A **filename** field in the header sets the base name for both `.md` and `.pdf` downloads.
- **PDF export UX** — loading state on the PDF button while the file is generated.
- **AI polish** (optional) — uses Google Gemini when `GEMINI_API_KEY` is set in the environment.

## Prerequisites

- Node.js 18+ (recommended)

## Setup

```bash
git clone https://github.com/sarhan44/MarkView-Pro.git
cd MarkView-Pro
npm install
```

### Optional: AI features

Create a `.env` in the project root:

```env
GEMINI_API_KEY=your_key_here
```

Vite injects this as `process.env.API_KEY` at build time. Without it, the editor and export features still work; only **AI Polish** is disabled.

## Scripts

| Command        | Description                 |
| -------------- | --------------------------- |
| `npm run dev`  | Start dev server (port 3000) |
| `npm run build`| Production build to `dist/`  |
| `npm run preview` | Serve the production build locally |

## Tech stack

- **React 19**, **TypeScript**, **Vite 6**
- **marked**, **dompurify**, **mermaid** (npm)
- **Tailwind CSS** (CDN + Typography plugin in `index.html`)
- **html2pdf.js** and **html2canvas** (CDN in `index.html`) for PDF generation and diagram snapshots

## Project layout

- `App.tsx` — layout, split pane, export handlers
- `components/` — `Editor`, `Preview`, `Toolbar`
- `utils/markdown.ts` — Markdown parsing, Mermaid fence handling, `hoistMermaidBlocksInSanitizedHtml`
- `utils/mermaidClient.ts` — Mermaid `initialize` / shared instance
- `utils/pdfExport.ts` — off-screen render, diagram rasterization, PDF generation
- `utils/filenames.ts` — safe download base names

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source the repo.
