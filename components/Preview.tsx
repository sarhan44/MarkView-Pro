import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface PreviewProps {
  content: string;
  previewRef: React.RefObject<HTMLDivElement>;
  visible: boolean;
}

export const Preview: React.FC<PreviewProps> = ({ content, previewRef, visible }) => {
  // Configure marked for security and features
  const htmlContent = useMemo(() => {
    const rawHtml = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  if (!visible) return null;

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
        <span>Live Preview</span>
      </div>
      <div className="flex-1 overflow-auto bg-white p-8">
        {/* 
          The prose class comes from @tailwindcss/typography. 
          It automatically styles HTML elements nicely.
        */}
        <div 
          ref={previewRef}
          className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>
    </div>
  );
};
