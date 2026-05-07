import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { DEFAULT_MARKDOWN } from './constants';
import { enhanceMarkdown } from './services/geminiService';
import { ViewMode } from './types';
import { exportMarkdownToPdf } from './utils/pdfExport';
import { withMdExtension, withPdfExtension } from './utils/filenames';

const SPLIT_PERCENT_KEY = 'markview-split-percent';
const MIN_SPLIT = 20;
const MAX_SPLIT = 80;
const DIVIDER_PX = 8;

function clampSplit(n: number): number {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, n));
}

function readInitialSplit(): number {
  try {
    const raw = localStorage.getItem(SPLIT_PERCENT_KEY);
    if (raw === null) return 50;
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return 50;
    return clampSplit(n);
  } catch {
    return 50;
  }
}

function App() {
  const [content, setContent] = useState<string>(DEFAULT_MARKDOWN);
  const [exportFileBaseName, setExportFileBaseName] = useState('document');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isPdfExporting, setIsPdfExporting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [splitPercent, setSplitPercent] = useState<number>(() => readInitialSplit());
  const splitPercentRef = useRef(splitPercent);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isDesktopSplit, setIsDesktopSplit] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
  );

  const previewRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    splitPercentRef.current = splitPercent;
  }, [splitPercent]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktopSplit(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSplit]);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const onMove = (e: MouseEvent) => {
      const main = mainRef.current;
      if (!main) return;
      const rect = main.getBoundingClientRect();
      const inner = rect.width - DIVIDER_PX;
      if (inner <= 0) return;
      const x = e.clientX - rect.left;
      const pct = ((x - DIVIDER_PX / 2) / inner) * 100;
      setSplitPercent(clampSplit(pct));
    };

    const stop = () => {
      setIsDraggingSplit(false);
      try {
        localStorage.setItem(SPLIT_PERCENT_KEY, String(splitPercentRef.current));
      } catch {
        /* ignore */
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', stop);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', stop);
    };
  }, [isDraggingSplit]);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDesktopSplit || viewMode !== ViewMode.SPLIT) return;
    e.preventDefault();
    setIsDraggingSplit(true);
  }, [isDesktopSplit, viewMode]);

  const handleDownloadMd = useCallback(() => {
    const watermark = '\n\n---\n\n_Made with [MarkViewPro](https://markdown.sarhankhan.in)_';
    const contentWithWatermark = content + watermark;
    const blob = new Blob([contentWithWatermark], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = withMdExtension(exportFileBaseName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, exportFileBaseName]);

  const handleDownloadPdf = useCallback(async () => {
    if (viewMode === ViewMode.EDITOR) {
      alert('Please switch to Preview or Split view to generate PDF.');
      return;
    }
    setIsPdfExporting(true);
    try {
      await exportMarkdownToPdf(content, withPdfExtension(exportFileBaseName));
    } catch (err) {
      console.error(err);
      alert('PDF export failed. See the console for details.');
    } finally {
      setIsPdfExporting(false);
    }
  }, [content, viewMode, exportFileBaseName]);

  const handleAiEnhance = useCallback(async () => {
    if (!process.env.API_KEY) {
      alert('Please provide an API_KEY in the environment to use AI features.');
      return;
    }

    setIsAiLoading(true);
    try {
      const improvedContent = await enhanceMarkdown(content);
      setContent(improvedContent);
    } catch (error) {
      console.error('Failed to enhance content', error);
      alert('Failed to connect to AI service. Please check console for details.');
    } finally {
      setIsAiLoading(false);
    }
  }, [content]);

  const showSplitDivider = viewMode === ViewMode.SPLIT && isDesktopSplit;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Toolbar
        exportFileBaseName={exportFileBaseName}
        onExportFileBaseNameChange={setExportFileBaseName}
        onDownloadMd={handleDownloadMd}
        onDownloadPdf={handleDownloadPdf}
        onAiEnhance={handleAiEnhance}
        isAiLoading={isAiLoading}
        isPdfExporting={isPdfExporting}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <main
        ref={mainRef}
        className={`flex-1 min-h-0 overflow-hidden ${
          showSplitDivider ? '' : 'flex flex-col'
        }`}
        style={
          showSplitDivider
            ? {
                display: 'grid',
                gridTemplateColumns: `minmax(0, ${splitPercent}fr) ${DIVIDER_PX}px minmax(0, ${100 - splitPercent}fr)`,
              }
            : undefined
        }
      >
        <div
          className={`min-h-0 min-w-0 flex flex-col overflow-hidden bg-white ${
            showSplitDivider
              ? ''
              : viewMode === ViewMode.SPLIT && !isDesktopSplit
                ? `flex-1 ${isDraggingSplit ? '' : 'transition-all duration-300 ease-in-out'}`
                : viewMode === ViewMode.EDITOR
                  ? 'flex-1 w-full'
                  : 'hidden'
          }`}
        >
          <Editor
            content={content}
            onChange={setContent}
            visible={viewMode !== ViewMode.PREVIEW}
          />
        </div>

        {showSplitDivider && (
          <div
            role="separator"
            aria-orientation="vertical"
            className="split-pane-divider z-10 flex items-center justify-center bg-gray-200 hover:bg-indigo-200 border-x border-gray-300 select-none touch-none"
            style={{ width: DIVIDER_PX, cursor: 'col-resize' }}
            onMouseDown={onDividerMouseDown}
          >
            <span className="split-pane-divider-grip text-gray-500 text-xs leading-none" aria-hidden>
              ⋮⋮
            </span>
          </div>
        )}

        <div
          className={`min-h-0 min-w-0 flex flex-col overflow-hidden ${
            showSplitDivider
              ? ''
              : viewMode === ViewMode.SPLIT && !isDesktopSplit
                ? `flex-1 ${isDraggingSplit ? '' : 'transition-all duration-300 ease-in-out'}`
                : viewMode === ViewMode.PREVIEW
                  ? 'flex-1 w-full'
                  : 'hidden'
          }`}
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
