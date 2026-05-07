import React, { useMemo, useLayoutEffect } from 'react';
import DOMPurify from 'dompurify';
import { ensureMermaidInitialized, getMermaid } from '../utils/mermaidClient';
import { renderMarkdownToHtml, hoistMermaidBlocksInSanitizedHtml } from '../utils/markdown';

interface PreviewProps {
  content: string;
  previewRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}

export const Preview: React.FC<PreviewProps> = ({ content, previewRef, visible }) => {
  const htmlContent = useMemo(() => {
    const rawHtml = renderMarkdownToHtml(content);
    const clean = DOMPurify.sanitize(rawHtml);
    return hoistMermaidBlocksInSanitizedHtml(clean);
  }, [content]);

  useLayoutEffect(() => {
    if (!visible || !previewRef.current) return;

    const root = previewRef.current;
    const mermaid = getMermaid();
    ensureMermaidInitialized();

    let cancelled = false;

    const attachFallbacks = () => {
      root.querySelectorAll('.mermaid-diagram-wrap').forEach((wrap) => {
        if (wrap.querySelector('svg')) return;
        if (wrap.querySelector('.mermaid-parse-error')) return;
        const hint = document.createElement('p');
        hint.className = 'mermaid-parse-error';
        hint.textContent = 'Diagram could not be rendered. Check the Mermaid syntax.';
        wrap.appendChild(hint);
      });
    };

    const run = async () => {
      const nodes = root.querySelectorAll('.mermaid');
      try {
        if (nodes.length) {
          await mermaid.run({ nodes: Array.from(nodes) as HTMLElement[], suppressErrors: true });
        }
      } catch {
        /* fallbacks below */
      }
      if (!cancelled) attachFallbacks();
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [htmlContent, visible]);

  if (!visible) return null;

  return (
    <div className="h-full flex flex-col bg-white border-t md:border-t-0 md:border-l border-gray-200 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
        <span>Live Preview</span>
      </div>
      <div className="flex-1 overflow-auto bg-white p-8">
        <div
          ref={previewRef}
          className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};
