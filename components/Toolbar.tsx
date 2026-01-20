import React from 'react';
import { Download, FileText, Wand2, Columns, LayoutPanelLeft, LayoutPanelTop, FileDown } from 'lucide-react';
import { ViewMode, ToolbarProps } from '../types';

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onDownloadMd, 
  onDownloadPdf, 
  onAiEnhance, 
  isAiLoading,
  viewMode,
  setViewMode
}) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">MarkView <span className="text-indigo-600">Pro</span></h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* View Toggles (Visible on Desktop) */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1 mr-2">
          <button
            onClick={() => setViewMode(ViewMode.EDITOR)}
            className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.EDITOR ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Editor Only"
          >
            <LayoutPanelLeft size={18} />
          </button>
          <button
            onClick={() => setViewMode(ViewMode.SPLIT)}
            className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.SPLIT ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Split View"
          >
            <Columns size={18} />
            <span className="sr-only">Split</span>
          </button>
          <button
            onClick={() => setViewMode(ViewMode.PREVIEW)}
            className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.PREVIEW ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Preview Only"
          >
            <LayoutPanelTop size={18} />
          </button>
        </div>

        {/* AI Action */}
        <button
          onClick={onAiEnhance}
          disabled={isAiLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200"
        >
          {isAiLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
          ) : (
            <Wand2 size={16} />
          )}
          <span className="text-sm font-medium">AI Polish</span>
        </button>

        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        {/* Export Actions */}
        <button
          onClick={onDownloadMd}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Download Markdown"
        >
          <FileDown size={18} />
          <span className="hidden sm:inline text-sm font-medium">MD</span>
        </button>
        
        <button
          onClick={onDownloadPdf}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-md transition-colors shadow-sm"
          title="Export to PDF"
        >
          <Download size={16} />
          <span className="hidden sm:inline text-sm font-medium">PDF</span>
        </button>
      </div>
    </header>
  );
};