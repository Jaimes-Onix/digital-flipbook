import React, { useEffect, useRef, useState, forwardRef, useCallback, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Loader2, ChevronLeft, ChevronRight, Maximize, Minimize, Grid3X3, Play, Pause, X, Search, ZoomIn, ZoomOut, BookOpen } from 'lucide-react';
import Dock, { DockItemConfig } from './Dock';

interface BookViewerProps {
  pdfDocument: any;
  onFlip: (pageIndex: number) => void;
  onBookInit: (book: any) => void;
  autoPlay?: boolean;
  showSearch?: boolean;
  onToggleSearch?: () => void;
  fullscreenContainerRef?: React.RefObject<HTMLDivElement>;
}

const PAGE_WIDTH = 550;
const PAGE_HEIGHT = 733;

// Realistic page flip sound — multi-layered: swoosh + crinkle + snap
let audioContext: AudioContext | null = null;

const playFlipSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;
    const sampleRate = ctx.sampleRate;

    // === LAYER 1: Paper swoosh ===
    const swooshDuration = 0.35;
    const swooshSamples = sampleRate * swooshDuration;
    const swooshBuffer = ctx.createBuffer(1, swooshSamples, sampleRate);
    const swooshData = swooshBuffer.getChannelData(0);

    for (let i = 0; i < swooshSamples; i++) {
      const t = i / swooshSamples;
      const envelope = Math.sin(t * Math.PI) * Math.pow(1 - t, 0.8);
      swooshData[i] = (Math.random() * 2 - 1) * envelope * 0.25;
    }

    const swooshSource = ctx.createBufferSource();
    swooshSource.buffer = swooshBuffer;

    const swooshFilter = ctx.createBiquadFilter();
    swooshFilter.type = 'bandpass';
    swooshFilter.Q.value = 0.8;
    swooshFilter.frequency.setValueAtTime(400, now);
    swooshFilter.frequency.exponentialRampToValueAtTime(2000, now + swooshDuration * 0.4);
    swooshFilter.frequency.exponentialRampToValueAtTime(600, now + swooshDuration);

    const swooshGain = ctx.createGain();
    swooshGain.gain.setValueAtTime(0, now);
    swooshGain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    swooshGain.gain.setValueAtTime(0.5, now + swooshDuration * 0.3);
    swooshGain.gain.exponentialRampToValueAtTime(0.01, now + swooshDuration);

    swooshSource.connect(swooshFilter);
    swooshFilter.connect(swooshGain);
    swooshGain.connect(ctx.destination);
    swooshSource.start(now);
    swooshSource.stop(now + swooshDuration);

    // === LAYER 2: Paper crinkle texture ===
    const crinkleDuration = 0.25;
    const crinkleSamples = sampleRate * crinkleDuration;
    const crinkleBuffer = ctx.createBuffer(1, crinkleSamples, sampleRate);
    const crinkleData = crinkleBuffer.getChannelData(0);

    for (let i = 0; i < crinkleSamples; i++) {
      const t = i / crinkleSamples;
      const burstChance = Math.random();
      const envelope = Math.pow(1 - t, 1.5) * (burstChance > 0.7 ? 1.5 : 0.3);
      crinkleData[i] = (Math.random() * 2 - 1) * envelope * 0.15;
    }

    const crinkleSource = ctx.createBufferSource();
    crinkleSource.buffer = crinkleBuffer;

    const crinkleFilter = ctx.createBiquadFilter();
    crinkleFilter.type = 'highpass';
    crinkleFilter.frequency.value = 2500;
    crinkleFilter.Q.value = 0.3;

    const crinkleGain = ctx.createGain();
    crinkleGain.gain.setValueAtTime(0.35, now + 0.02);
    crinkleGain.gain.exponentialRampToValueAtTime(0.01, now + crinkleDuration);

    crinkleSource.connect(crinkleFilter);
    crinkleFilter.connect(crinkleGain);
    crinkleGain.connect(ctx.destination);
    crinkleSource.start(now + 0.02);
    crinkleSource.stop(now + crinkleDuration);

    // === LAYER 3: Page snap ===
    const snapDelay = 0.22;
    const snapDuration = 0.08;
    const snapSamples = sampleRate * snapDuration;
    const snapBuffer = ctx.createBuffer(1, snapSamples, sampleRate);
    const snapData = snapBuffer.getChannelData(0);

    for (let i = 0; i < snapSamples; i++) {
      const t = i / snapSamples;
      const envelope = Math.exp(-t * 30);
      snapData[i] = (Math.random() * 2 - 1) * envelope * 0.4;
    }

    const snapSource = ctx.createBufferSource();
    snapSource.buffer = snapBuffer;

    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'lowpass';
    snapFilter.frequency.value = 3000;
    snapFilter.Q.value = 1.0;

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.45, now + snapDelay);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + snapDelay + snapDuration);

    snapSource.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapSource.start(now + snapDelay);
    snapSource.stop(now + snapDelay + snapDuration);
  } catch (e) {
    // Silent fail
  }
};

// Page Component with text layer for selection/copy
const Page = forwardRef<HTMLDivElement, { number: number; pdfDocument: any }>(
  ({ number, pdfDocument }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
      if (!pdfDocument || !canvasRef.current || rendered) return;

      const render = async () => {
        try {
          const page = await pdfDocument.getPage(number);
          const viewport = page.getViewport({ scale: 2.5 });
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport }).promise;

          // Render text layer for selection/copy
          if (textLayerRef.current) {
            const textContent = await page.getTextContent();
            const textLayerDiv = textLayerRef.current;
            textLayerDiv.innerHTML = '';

            // The text layer is built at viewport coordinates (scale 2.5)
            // then CSS-scaled down to match the displayed page size
            const scaleDownX = PAGE_WIDTH / viewport.width;
            const scaleDownY = PAGE_HEIGHT / viewport.height;
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;
            textLayerDiv.style.transform = `scale(${scaleDownX}, ${scaleDownY})`;

            textContent.items.forEach((item: any) => {
              if (!item.str) return;

              const [a, b, , d, tx, ty] = item.transform;
              const fontSize = Math.sqrt(d * d + item.transform[2] * item.transform[2]);
              const scaledFontSize = fontSize * 2.5;

              const screenX = tx * 2.5;
              const screenY = viewport.height - ty * 2.5;

              const span = document.createElement('span');
              span.textContent = item.str;
              span.style.cssText = `
                position: absolute;
                left: ${screenX}px;
                top: ${screenY - scaledFontSize}px;
                font-size: ${scaledFontSize}px;
                font-family: sans-serif;
                white-space: pre;
                color: transparent;
                transform-origin: 0% 0%;
                line-height: 1;
              `;

              const angle = Math.atan2(b, a);
              if (Math.abs(angle) > 0.001) {
                span.style.transform = `rotate(${angle}rad)`;
              }

              if (item.width) {
                span.style.width = `${item.width * 2.5}px`;
              }

              textLayerDiv.appendChild(span);
            });
          }

          setRendered(true);
        } catch (e) {
          console.error('Page render error:', e);
        }
      };

      render();
    }, [pdfDocument, number, rendered]);

    return (
      <div
        ref={ref}
        className="page-realistic"
        style={{
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          background: '#fff',
          boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {!rendered && (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-gray-300" size={24} />
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: rendered ? 'block' : 'none' }}
        />
        {/* Text layer for selection/copy — transparent text positioned over canvas */}
        <div
          ref={textLayerRef}
          className="pdf-text-layer"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            transformOrigin: '0 0',
            overflow: 'hidden',
          }}
        />
      </div>
    );
  }
);

Page.displayName = 'Page';

// Thumbnail Component — lazy-rendered small preview
const Thumbnail: React.FC<{
  number: number;
  pdfDocument: any;
  isActive: boolean;
  onClick: () => void;
}> = ({ number, pdfDocument, isActive, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || rendered) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          renderThumb();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const renderThumb = async () => {
      try {
        const page = await pdfDocument.getPage(number);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        setRendered(true);
      } catch (e) {
        console.error('Thumbnail render error:', e);
      }
    };

    return () => observer.disconnect();
  }, [pdfDocument, number, rendered]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
        isActive
          ? 'border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.02]'
          : 'border-transparent hover:border-white/10'
      }`}
    >
      <div className="bg-white aspect-[3/4] flex items-center justify-center">
        {!rendered && (
          <Loader2 className="animate-spin text-gray-300" size={16} />
        )}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: rendered ? 'block' : 'none', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};

// Search result type
interface SearchResult {
  page: number;
  snippets: string[];
  matchCount: number;
}

// Main BookViewer
const BookViewer: React.FC<BookViewerProps> = ({
  pdfDocument, onFlip, onBookInit, autoPlay = false,
  showSearch = false, onToggleSearch, fullscreenContainerRef
}) => {
  const [pages, setPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [baseScale, setBaseScale] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  const [pageTexts, setPageTexts] = useState<Map<number, string>>(new Map());
  const [isExtractingText, setIsExtractingText] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const scaleRef = useRef(1);

  const scale = baseScale * (zoomLevel / 100);
  scaleRef.current = scale;

  // Extract text from all pages when search opens
  useEffect(() => {
    if (!showSearch || !pdfDocument || pageTexts.size > 0) return;

    const extractText = async () => {
      setIsExtractingText(true);
      const texts = new Map<number, string>();

      for (let i = 1; i <= pdfDocument.numPages; i++) {
        try {
          const page = await pdfDocument.getPage(i);
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => item.str).join(' ');
          texts.set(i, text);
        } catch (e) {
          texts.set(i, '');
        }
      }

      setPageTexts(texts);
      setIsExtractingText(false);
    };

    extractText();
  }, [showSearch, pdfDocument, pageTexts.size]);

  // When search opens from top bar, close thumbnails + focus input
  useEffect(() => {
    if (showSearch) {
      setShowThumbnails(false);
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [showSearch]);

  // Search results
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim() || pageTexts.size === 0) return [];

    const query = exactMatch ? searchQuery : searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    pageTexts.forEach((text, page) => {
      const searchText = exactMatch ? text : text.toLowerCase();
      const matches: number[] = [];
      let idx = searchText.indexOf(query);

      while (idx !== -1) {
        matches.push(idx);
        idx = searchText.indexOf(query, idx + 1);
      }

      if (matches.length > 0) {
        // Get up to 3 snippets from this page
        const snippets: string[] = [];
        const snippetCount = Math.min(matches.length, 2);

        for (let i = 0; i < snippetCount; i++) {
          const matchIdx = matches[i];
          const start = Math.max(0, matchIdx - 40);
          const end = Math.min(text.length, matchIdx + query.length + 60);
          let snippet = text.substring(start, end).trim();
          if (start > 0) snippet = '...' + snippet;
          if (end < text.length) snippet = snippet + '...';
          snippets.push(snippet);
        }

        results.push({ page, snippets, matchCount: matches.length });
      }
    });

    return results.sort((a, b) => a.page - b.page);
  }, [searchQuery, exactMatch, pageTexts]);

  const totalMatchPages = searchResults.length;

  // Highlight search query in snippet text
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;

    const parts: React.ReactNode[] = [];
    const lowerText = exactMatch ? text : text.toLowerCase();
    const lowerQuery = exactMatch ? query : query.toLowerCase();
    let lastIndex = 0;

    let idx = lowerText.indexOf(lowerQuery);
    let keyIdx = 0;
    while (idx !== -1) {
      if (idx > lastIndex) {
        parts.push(text.substring(lastIndex, idx));
      }
      parts.push(
        <mark key={keyIdx++} className="bg-emerald-500/30 text-emerald-300 rounded px-0.5">
          {text.substring(idx, idx + query.length)}
        </mark>
      );
      lastIndex = idx + query.length;
      idx = lowerText.indexOf(lowerQuery, lastIndex);
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }, [exactMatch]);

  // Fullscreen toggle — use outer reader container if available so Vanta is included
  const toggleFullscreen = useCallback(() => {
    const target = fullscreenContainerRef?.current || containerRef.current;
    if (!target) return;

    if (!document.fullscreenElement) {
      target.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, [fullscreenContainerRef]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calculate base scale to fit screen
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null;

    const updateScale = () => {
      const w = window.innerWidth - 120;
      const h = window.innerHeight - 180;
      const scaleX = w / (PAGE_WIDTH * 2);
      const scaleY = h / PAGE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1.3);
      setBaseScale(newScale);
    };

    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateScale, 100);
    };

    updateScale();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  // Initialize pages
  useEffect(() => {
    const initBook = async () => {
      if (!pdfDocument) {
        setError('No PDF document provided');
        setLoading(false);
        return;
      }

      try {
        setLoadingText('Loading pages...');

        if (!pdfDocument.numPages || pdfDocument.numPages < 1) {
          throw new Error('PDF has no pages');
        }

        const nums = Array.from({ length: pdfDocument.numPages }, (_, i) => i + 1);
        setPages(nums);

        setLoadingText('Preparing viewer...');
        await new Promise(resolve => setTimeout(resolve, 300));

        setLoading(false);
        console.log(`BookViewer ready: ${pdfDocument.numPages} pages`);
      } catch (err: any) {
        console.error('BookViewer init error:', err);
        setError(err.message || 'Failed to load book');
        setLoading(false);
      }
    };

    initBook();
  }, [pdfDocument]);

  // Auto-play mode
  useEffect(() => {
    if (isAutoPlaying && !loading && pages.length > 0) {
      autoPlayRef.current = setInterval(() => {
        const pageFlip = bookRef.current?.pageFlip();
        if (pageFlip) {
          const current = pageFlip.getCurrentPageIndex();
          const total = pageFlip.getPageCount();

          if (current < total - 1) {
            pageFlip.flipNext();
          } else {
            pageFlip.turnToPage(0);
          }
        }
      }, 3500);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [isAutoPlaying, loading, pages.length]);

  const flipPrev = useCallback(() => {
    const pageFlip = bookRef.current?.pageFlip();
    if (pageFlip) pageFlip.flipPrev();
  }, []);

  const flipNext = useCallback(() => {
    const pageFlip = bookRef.current?.pageFlip();
    if (pageFlip) pageFlip.flipNext();
  }, []);

  // Play sound when flip STARTS
  const handleChangeState = useCallback((e: any) => {
    if (e.data === 'flipping') {
      playFlipSound();
    }
  }, []);

  const handleFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
    onFlip(e.data);
  }, [onFlip]);

  const goToPage = useCallback((pageNum: number) => {
    const pageFlip = bookRef.current?.pageFlip();
    if (pageFlip) pageFlip.turnToPage(pageNum - 1);
  }, []);

  // Determine if the right panel is open (thumbnails or search)
  const rightPanelOpen = showThumbnails || showSearch;

  // Error state
  if (error) {
    return (
      <div className="df-container w-full h-full flex items-center justify-center" style={{ background: '#0c0c0e' }}>
        <div className="text-center">
          <div className="text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-zinc-300 font-medium">Failed to load book</p>
          <p className="text-zinc-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!pdfDocument || pages.length === 0 || loading) {
    return (
      <div className="df-container w-full h-full flex items-center justify-center" style={{ background: '#0c0c0e' }}>
        <div className="text-center">
          <Loader2 className="animate-spin text-zinc-600 mx-auto mb-3" size={40} />
          <p className="text-zinc-500 text-sm">{loadingText}</p>
        </div>
      </div>
    );
  }

  const totalPages = pages.length;

  return (
    <div
      ref={containerRef}
      className="df-container w-full h-full flex flex-col relative"
      style={{
        background: 'transparent',
        touchAction: 'pan-x pan-y'
      }}
      onWheel={(e) => { if (e.ctrlKey) e.preventDefault(); }}
    >
      {/* Main Book Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Left Navigation */}
        <button
          onClick={flipPrev}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/15 hover:text-white/40 transition-all z-20 rounded-full hover:bg-white/[0.04]"
          title="Previous Page"
        >
          <ChevronLeft size={32} />
        </button>

        {/* The Book */}
        <div
          className="relative book-3d-container"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <HTMLFlipBook
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            size="fixed"
            minWidth={PAGE_WIDTH}
            maxWidth={PAGE_WIDTH}
            minHeight={PAGE_HEIGHT}
            maxHeight={PAGE_HEIGHT}
            showCover={true}
            maxShadowOpacity={0.5}
            mobileScrollSupport={true}
            onFlip={handleFlip}
            onChangeState={handleChangeState}
            ref={(el: any) => {
              bookRef.current = el;
              if (el) onBookInit(el);
            }}
            className="book-3d-flip"
            style={{ boxShadow: '0 5px 30px rgba(0,0,0,0.2)' }}
            startPage={0}
            flippingTime={800}
            usePortrait={false}
            drawShadow={true}
            startZIndex={0}
            autoSize={false}
            clickEventForward={false}
            useMouseEvents={true}
            swipeDistance={0}
            showPageCorners={false}
            disableFlipByClick={true}
          >
            {pages.map((num) => (
              <Page key={num} number={num} pdfDocument={pdfDocument} />
            ))}
          </HTMLFlipBook>
        </div>

        {/* Right Navigation */}
        <button
          onClick={flipNext}
          onMouseDown={(e) => e.preventDefault()}
          className={`absolute top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/15 hover:text-white/40 transition-all z-20 rounded-full hover:bg-white/[0.04]`}
          style={{
            right: rightPanelOpen ? 284 : 16,
            transition: 'right 0.3s ease'
          }}
          title="Next Page"
        >
          <ChevronRight size={32} />
        </button>

        {/* Thumbnails Panel - Right Side */}
        <div
          className="absolute top-0 right-0 h-full z-30 flex flex-col bg-[#111114]/95 backdrop-blur-xl border-l border-white/[0.04] shadow-2xl shadow-black/40"
          style={{
            width: 280,
            transform: showThumbnails ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-[#0c0c0e]">
            <div className="flex items-center gap-2">
              <Grid3X3 size={16} className="text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-200">Thumbnails</h3>
            </div>
            <button
              onClick={() => setShowThumbnails(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Thumbnails - Spread Layout (cover alone, then pairs) */}
          <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
            <div className="flex flex-col gap-4">
              {/* Page 1 - Cover (centered, alone) */}
              {pages.length > 0 && (
                <div>
                  <div className="flex justify-center">
                    <div className="w-1/2">
                      <Thumbnail
                        number={1}
                        pdfDocument={pdfDocument}
                        isActive={currentPage === 0}
                        onClick={() => goToPage(1)}
                      />
                    </div>
                  </div>
                  <div className="text-center text-xs text-zinc-600 mt-1">1</div>
                </div>
              )}

              {/* Remaining pages as spreads (2-3, 4-5, 6-7, ...) */}
              {(() => {
                const spreads: { left: number; right: number | null }[] = [];
                for (let i = 2; i <= pages.length; i += 2) {
                  spreads.push({
                    left: i,
                    right: i + 1 <= pages.length ? i + 1 : null,
                  });
                }
                return spreads.map((spread) => (
                  <div key={`spread-${spread.left}`}>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <Thumbnail
                          number={spread.left}
                          pdfDocument={pdfDocument}
                          isActive={currentPage === spread.left - 1 || currentPage === spread.left}
                          onClick={() => goToPage(spread.left)}
                        />
                      </div>
                      {spread.right ? (
                        <div className="flex-1">
                          <Thumbnail
                            number={spread.right}
                            pdfDocument={pdfDocument}
                            isActive={currentPage === spread.right - 1 || currentPage === spread.right}
                            onClick={() => goToPage(spread.right!)}
                          />
                        </div>
                      ) : (
                        <div className="flex-1" />
                      )}
                    </div>
                    <div className="flex text-center text-xs text-zinc-600 mt-1">
                      <span className="flex-1">{spread.left}</span>
                      {spread.right && <span className="flex-1">{spread.right}</span>}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Search Panel - Right Side */}
        <div
          className="absolute top-0 right-0 h-full z-30 flex flex-col bg-[#111114]/95 backdrop-blur-xl border-l border-white/[0.04] shadow-2xl shadow-black/40"
          style={{
            width: 320,
            transform: showSearch ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Search Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-[#0c0c0e]">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-200">Search</h3>
            </div>
            <button
              onClick={onToggleSearch}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Input */}
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in document..."
                className="w-full pl-3 pr-8 py-2 text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 bg-white/[0.04] text-white placeholder-zinc-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exactMatch}
                onChange={(e) => setExactMatch(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-zinc-600 bg-white/[0.04] text-emerald-500 focus:ring-emerald-500/30"
              />
              <span className="text-xs text-zinc-500">Exact match</span>
            </label>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {isExtractingText ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-zinc-600 mr-2" size={16} />
                <span className="text-sm text-zinc-600">Extracting text...</span>
              </div>
            ) : searchQuery.trim() ? (
              <>
                <p className="text-xs text-zinc-500 mb-3 font-medium">
                  {totalMatchPages > 0
                    ? `${totalMatchPages} page${totalMatchPages !== 1 ? 's' : ''} found.`
                    : 'No results found.'
                  }
                </p>

                <div className="flex flex-col gap-2.5">
                  {searchResults.map((result) => {
                    const pageNum = result.page;
                    let pageLabel: string;
                    if (pageNum === 1) pageLabel = `p. 1`;
                    else if (pageNum % 2 === 0) pageLabel = `p. ${pageNum} - ${Math.min(pageNum + 1, totalPages)}`;
                    else pageLabel = `p. ${pageNum - 1} - ${pageNum}`;

                    return (
                      <button
                        key={result.page}
                        onClick={() => goToPage(result.page)}
                        className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-emerald-500/20 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-zinc-400 group-hover:text-emerald-400">{pageLabel}</span>
                        </div>
                        {result.snippets.map((snippet, i) => (
                          <p key={i} className="text-xs text-zinc-500 leading-relaxed mb-1 select-text">
                            {highlightText(snippet, searchQuery)}
                          </p>
                        ))}
                        {result.matchCount > 2 && (
                          <p className="text-[11px] text-zinc-600 mt-1 italic">
                            ...and {result.matchCount - 2} more result{result.matchCount - 2 !== 1 ? 's' : ''} on this page.
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-600 text-center py-8">
                Type to search within this document
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls - macOS Dock */}
      <div className="relative w-full flex justify-center z-10" style={{ height: '80px', position: 'relative' }}>
        <Dock
          items={[
            {
              icon: <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{currentPage + 1}/{totalPages}</span>,
              label: `Page ${currentPage + 1} of ${totalPages}`,
              onClick: () => {},
              className: 'pointer-events-none',
            },
            {
              icon: <Grid3X3 size={18} />,
              label: showThumbnails ? 'Hide Thumbnails' : 'Thumbnails',
              onClick: () => { setShowThumbnails(!showThumbnails); if (!showThumbnails && showSearch && onToggleSearch) onToggleSearch(); },
              className: showThumbnails ? 'active' : '',
            },
            {
              icon: <Search size={18} />,
              label: showSearch ? 'Hide Search' : 'Search',
              onClick: () => { if (onToggleSearch) onToggleSearch(); if (showThumbnails) setShowThumbnails(false); },
              className: showSearch ? 'active' : '',
            },
            {
              icon: isAutoPlaying ? <Pause size={18} /> : <Play size={18} />,
              label: isAutoPlaying ? 'Pause Auto-flip' : 'Auto-flip',
              onClick: () => setIsAutoPlaying(!isAutoPlaying),
              className: isAutoPlaying ? 'active' : '',
            },
            {
              icon: <ZoomOut size={18} />,
              label: 'Zoom Out',
              onClick: () => setZoomLevel(prev => Math.max(50, prev - 10)),
            },
            {
              icon: <ZoomIn size={18} />,
              label: 'Zoom In',
              onClick: () => setZoomLevel(prev => Math.min(150, prev + 10)),
            },
            {
              icon: isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />,
              label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
              onClick: toggleFullscreen,
              className: isFullscreen ? 'active' : '',
            },
          ] as DockItemConfig[]}
          panelHeight={64}
          baseItemSize={46}
          magnification={65}
          distance={180}
        />
      </div>
    </div>
  );
};

export default BookViewer;
