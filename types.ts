export interface MarkdownState {
  content: string;
  isRendering: boolean;
}

export enum ViewMode {
  SPLIT = 'SPLIT',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
}

export interface ToolbarProps {
  exportFileBaseName: string;
  onExportFileBaseNameChange: (name: string) => void;
  onDownloadMd: () => void;
  onDownloadPdf: () => void;
  onAiEnhance: () => void;
  isAiLoading: boolean;
  isPdfExporting: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}
