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
  content: string;
  onDownloadMd: () => void;
  onDownloadPdf: () => void;
  onAiEnhance: () => void;
  isAiLoading: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}
