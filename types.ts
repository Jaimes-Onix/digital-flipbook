
export interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  destroy: () => void;
}

export interface PDFPageProxy {
  getViewport: (params: { scale: number }) => PDFPageViewport;
  render: (params: {
    canvasContext: CanvasRenderingContext2D | null;
    viewport: PDFPageViewport;
  }) => { promise: Promise<void> };
}

export interface PDFPageViewport {
  width: number;
  height: number;
  scale: number;
}

export type BookCategory = 'philippines' | 'internal' | 'international' | 'ph_interns' | 'deseret' | 'angelhost';

export interface LibraryBook {
  id: string;
  name: string;
  doc: any;
  pdfUrl: string; // Blob URL for dflip viewer
  coverUrl: string;
  totalPages: number;
  summary?: string;
  category?: BookCategory;
  isFavorite?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export interface BookRef {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    turnToPage: (page: number) => void;
    getCurrentPageIndex: () => number;
    getPageCount: () => number;
  } | null;
}
