import React from 'react';
import { Download, FileText, Wand2, Columns, LayoutPanelLeft, LayoutPanelTop, FileDown } from 'lucide-react';
import { ViewMode, ToolbarProps } from '../types';

export const Toolbar: React.FC<ToolbarProps> = ({
  onDownloadMd,
  onDownloadPdf,
  onAiEnhance,
  isAiLoading,
  isPdfExporting,
  viewMode,
  setViewMode,
  exportFileBaseName,
  onExportFileBaseNameChange,
}) => {
  return (
    <header className="min-h-16 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-y-2 gap-x-3 px-4 py-2 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-2 shrink-0">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
          MarkView <span className="text-indigo-600">Pro</span>
        </h1>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-x-2 gap-y-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-[8rem] max-w-[14rem] sm:max-w-xs">
          <label htmlFor="export-filename" className="hidden xl:inline text-xs text-gray-500 shrink-0 whitespace-nowrap">
            File name
          </label>
          <input
            id="export-filename"
            type="text"
            value={exportFileBaseName}
            onChange={(e) => onExportFileBaseNameChange(e.target.value)}
            placeholder="document"
            title="Base name for MD and PDF downloads (no extension needed)"
            disabled={isPdfExporting}
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode(ViewMode.EDITOR)}
            className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.EDITOR ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Editor Only"
          >
            <LayoutPanelLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode(ViewMode.SPLIT)}
            className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.SPLIT ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Split View"
          >
            <Columns size={18} />
            <span className="sr-only">Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode(ViewMode.PREVIEW)}
            className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.PREVIEW ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Preview Only"
          >
            <LayoutPanelTop size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onAiEnhance}
          disabled={isAiLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200"
        >
          {isAiLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
          ) : (
            <Wand2 size={16} />
          )}
          <span className="hidden sm:inline text-sm font-medium">AI Polish</span>
        </button>

        <div className="hidden sm:block h-6 w-px bg-gray-300 mx-0.5" />

        <button
          type="button"
          onClick={onDownloadMd}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Download Markdown"
        >
          <FileDown size={18} />
          <span className="hidden sm:inline text-sm font-medium">MD</span>
        </button>

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isPdfExporting}
          aria-busy={isPdfExporting}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-md transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait min-w-[5.5rem] justify-center"
          title={isPdfExporting ? 'Generating PDF…' : 'Export to PDF'}
        >
          {isPdfExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" aria-hidden />
          ) : (
            <Download size={16} />
          )}
          <span className="hidden sm:inline text-sm font-medium">
            {isPdfExporting ? 'Exporting' : 'PDF'}
          </span>
        </button>
      </div>
    </header>
  );
};
