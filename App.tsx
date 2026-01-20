import React, { useState, useRef, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { DEFAULT_MARKDOWN } from './constants';
import { enhanceMarkdown } from './services/geminiService';
import { ViewMode } from './types';

// Declare html2pdf for TypeScript since it's loaded via CDN
declare const html2pdf: any;

function App() {
  const [content, setContent] = useState<string>(DEFAULT_MARKDOWN);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle downloading the raw Markdown file
  const handleDownloadMd = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content]);

  // Handle generating and downloading PDF
  const handleDownloadPdf = useCallback(() => {
    if (!previewRef.current) return;

    const element = previewRef.current;
    const opt = {
      margin:       [10, 10],
      filename:     'document.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // If currently in Editor only mode, we need to temporarily render the preview
    // However, for simplicity in this MVP, we assume the ref is available if the component is mounted.
    // Ideally, we force mount or use an offscreen render, but checking viewMode is safer.
    if (viewMode === ViewMode.EDITOR) {
      alert("Please switch to Preview or Split view to generate PDF.");
      return;
    }

    html2pdf().set(opt).from(element).save();
  }, [viewMode]);

  // AI Enhancement Feature
  const handleAiEnhance = useCallback(async () => {
    if (!process.env.API_KEY) {
      alert("Please provide an API_KEY in the environment to use AI features.");
      return;
    }

    setIsAiLoading(true);
    try {
      const improvedContent = await enhanceMarkdown(content);
      setContent(improvedContent);
    } catch (error) {
      console.error("Failed to enhance content", error);
      alert("Failed to connect to AI service. Please check console for details.");
    } finally {
      setIsAiLoading(false);
    }
  }, [content]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Toolbar 
        content={content}
        onDownloadMd={handleDownloadMd}
        onDownloadPdf={handleDownloadPdf}
        onAiEnhance={handleAiEnhance}
        isAiLoading={isAiLoading}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={`${
            viewMode === ViewMode.SPLIT ? 'w-1/2' : 
            viewMode === ViewMode.EDITOR ? 'w-full' : 'hidden'
          } h-full transition-all duration-300 ease-in-out`}
        >
          <Editor 
            content={content} 
            onChange={setContent} 
            visible={viewMode !== ViewMode.PREVIEW}
          />
        </div>

        {/* Preview Panel */}
        <div className={`${
            viewMode === ViewMode.SPLIT ? 'w-1/2' : 
            viewMode === ViewMode.PREVIEW ? 'w-full' : 'hidden'
          } h-full transition-all duration-300 ease-in-out`}
        >
          <Preview 
            content={content} 
            previewRef={previewRef}
            visible={viewMode !== ViewMode.EDITOR}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
