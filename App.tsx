import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { DEFAULT_MARKDOWN } from './constants';
import { enhanceMarkdown } from './services/geminiService';
import { ViewMode } from './types';

// Declare html2pdf for TypeScript since it's loaded via CDN
declare const html2pdf: any;

const STORAGE_KEY = 'markview-content';

function App() {
  // Initialize state from local storage if available, otherwise use default
  const [content, setContent] = useState<string>(() => {
    try {
      const savedContent = localStorage.getItem(STORAGE_KEY);
      return savedContent !== null ? savedContent : DEFAULT_MARKDOWN;
    } catch (error) {
      console.warn('Failed to load content from local storage:', error);
      return DEFAULT_MARKDOWN;
    }
  });

  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const previewRef = useRef<HTMLDivElement>(null);

  // Save content to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, content);
    } catch (error) {
      console.error('Failed to save content to local storage:', error);
    }
  }, [content]);

  // Handle downloading the raw Markdown file
  const handleDownloadMd = useCallback(() => {
    const watermark = '\n\n---\n\n_Made with [MarkViewPro](https://markdown.sarhankhan.in)_';
    const contentWithWatermark = content + watermark;
    const blob = new Blob([contentWithWatermark], { type: 'text/markdown' });
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

    // If currently in Editor only mode, we need to temporarily render the preview
    // However, for simplicity in this MVP, we assume the ref is available if the component is mounted.
    // Ideally, we force mount or use an offscreen render, but checking viewMode is safer.
    if (viewMode === ViewMode.EDITOR) {
      alert("Please switch to Preview or Split view to generate PDF.");
      return;
    }

    // Create a temporary container with watermark
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = previewRef.current.offsetWidth + 'px';
    
    // Clone the preview content
    const clonedContent = previewRef.current.cloneNode(true) as HTMLElement;
    
    // Create watermark element
    const watermarkDiv = document.createElement('div');
    watermarkDiv.style.marginTop = '2rem';
    watermarkDiv.style.paddingTop = '1rem';
    watermarkDiv.style.borderTop = '1px solid #e5e7eb';
    watermarkDiv.style.textAlign = 'center';
    watermarkDiv.style.fontSize = '0.85rem';
    watermarkDiv.style.color = '#999';
    watermarkDiv.innerHTML = 'Made with <a href="https://markdown.sarhakhan.in" style="color: #4f46e5; text-decoration: none;">MarkViewPro</a> | https://markdown.sarhakhan.in';
    
    clonedContent.appendChild(watermarkDiv);
    tempContainer.appendChild(clonedContent);
    document.body.appendChild(tempContainer);

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     'document.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(clonedContent).save().then(() => {
      document.body.removeChild(tempContainer);
    });
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

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Editor Panel */}
        <div className={`${
            viewMode === ViewMode.SPLIT ? 'h-1/2 w-full md:h-full md:w-1/2' : 
            viewMode === ViewMode.EDITOR ? 'h-full w-full' : 'hidden'
          } transition-all duration-300 ease-in-out`}
        >
          <Editor 
            content={content} 
            onChange={setContent} 
            visible={viewMode !== ViewMode.PREVIEW}
          />
        </div>

        {/* Preview Panel */}
        <div className={`${
            viewMode === ViewMode.SPLIT ? 'h-1/2 w-full md:h-full md:w-1/2' : 
            viewMode === ViewMode.PREVIEW ? 'h-full w-full' : 'hidden'
          } transition-all duration-300 ease-in-out`}
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