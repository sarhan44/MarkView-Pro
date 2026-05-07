import mermaid from 'mermaid';

let mermaidInitialized = false;

/**
 * Bundled Mermaid (npm): reliable with Vite + React (no race vs CDN global; correct run() API).
 */
export function getMermaid(): typeof mermaid {
  return mermaid;
}

/**
 * Prefer loose security for real docs: subgraph labels with quotes, ER diagrams, links, etc.
 * Per product spec we still set startOnLoad: false and theme: 'default'.
 */
export function ensureMermaidInitialized(): void {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
  mermaidInitialized = true;
}
