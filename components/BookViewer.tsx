import React, { useEffect, useRef, useState, forwardRef, useCallback, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Loader2, ChevronLeft, ChevronRight, X, Search, Grid3X3, Play, Pause, ZoomOut, ZoomIn, Minimize, Maximize } from 'lucide-react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import TrifoldViewer from './TrifoldViewer';


interface BookViewerProps {
  pdfDocument: any;
  onFlip: (pageIndex: number) => void;
  onBookInit: (book: any) => void;
  // Toolbar state — controlled by parent so Header can mirror these
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  isAutoPlaying?: boolean;
  onToggleAutoPlay?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  showThumbnails?: boolean;
  onToggleThumbnails?: () => void;
  showSearch?: boolean;
  onToggleSearch?: () => void;
  fullscreenContainerRef?: React.RefObject<HTMLDivElement>;
  orientation?: 'portrait' | 'landscape' | 'trifold';
}

// Fixed page dimensions per orientation — these control the SHAPE of each flipbook page.
// PDF content is fitted inside using contain-scale so it's never distorted.
const PORTRAIT_W = 500;
const PORTRAIT_H = 707;
const LANDSCAPE_W = 707;
const LANDSCAPE_H = 500;

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

// Page Component — Direct Canvas Rendering (matches erayakartuna/pdf-flipbook approach)
// Renders PDF at exactly the scale needed to fill the container.
// NO intermediate DataURLs. NO image downscaling. The <canvas> IS the page.
const Page = React.memo(forwardRef<HTMLDivElement, { number: number; pdfDocument: any; pageW: number; pageH: number; imageUrl?: string; searchQuery?: string }>(
  ({ number, pdfDocument, pageW, pageH, imageUrl, searchQuery }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const [rendered, setRendered] = useState(false);
    const renderTaskRef = useRef<any>(null);
    const textLayerTaskRef = useRef<any>(null); // Added for cleanup
    const lastSearchRef = useRef('');

    // Direct canvas render — no encoding, no decoding, no quality loss
    useEffect(() => {
      // OPTIMIZATION: If we already have a high-quality pre-rendered image, 
      // we SKIP the canvas rendering entirely to save CPU/GPU.
      if (imageUrl || !pdfDocument || !canvasRef.current) return;

      let active = true;

      const render = async () => {
        try {
          const page = await pdfDocument.getPage(number);
          if (!active) return;

          const natural = page.getViewport({ scale: 1 });

          // Calculate the scale that makes the PDF exactly fill this container
          // This is the competitor's approach — no over-rendering, no under-rendering
          const fitScale = Math.min(pageW / natural.width, pageH / natural.height);

          // The canvas backing-store must account for devicePixelRatio
          // so the browser renders 1 PDF pixel = 1 screen pixel on retina displays
          // OPTIMIZATION: Cap DPR to 2.0 on mobile to prevent memory lag/crashes
          const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
          const renderScale = fitScale * dpr;

          const viewport = page.getViewport({ scale: renderScale });

          const canvas = canvasRef.current!;
          if (!active || !canvas) return;

          // Set the actual canvas bitmap size (high-res)
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          // Set the CSS display size (matches the container)
          canvas.style.width = `${Math.round(natural.width * fitScale)}px`;
          canvas.style.height = `${Math.round(natural.height * fitScale)}px`;
          canvas.style.left = `${Math.round((pageW - natural.width * fitScale) / 2)}px`;
          canvas.style.top = `${Math.round((pageH - natural.height * fitScale) / 2)}px`;

          const ctx = canvas.getContext('2d', { alpha: true })!;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          if (renderTaskRef.current) {
            try { renderTaskRef.current.cancel(); } catch (_) {}
          }

          renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
          await renderTaskRef.current.promise;

          if (!active) return;
        } catch (e: any) {
          if (e.name === 'RenderingCancelledException') return;
          console.error('Canvas render error:', e);
        }
      };

      render();

      return () => {
        active = false;
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch (_) {}
        }
        // OPTIMIZATION: Explicitly clear canvas memory on unmount
        if (canvasRef.current) {
          canvasRef.current.width = 0;
          canvasRef.current.height = 0;
        }
      };
    }, [pdfDocument, number, pageW, pageH]);

    // Text layer — transparent for selection + search highlighting
    useEffect(() => {
      if (!pdfDocument) return;
      if (rendered && lastSearchRef.current === searchQuery) return;
      
      lastSearchRef.current = searchQuery || '';

      const setupLayer = async () => {
        try {
          // Delay text layer setup to prioritize visual rendering
          await new Promise(resolve => setTimeout(resolve, imageUrl ? 100 : 500));
          
          const page = await pdfDocument.getPage(number);
          const natural = page.getViewport({ scale: 1 });

          const fitScale = Math.min(pageW / natural.width, pageH / natural.height);
          const displayW = Math.round(natural.width * fitScale);
          const displayH = Math.round(natural.height * fitScale);

          if (textLayerRef.current) {
            // OPTIMIZATION: Delay text extraction slightly to prioritize rendering
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!textLayerRef.current) return;

            const textContent = await page.getTextContent();
            // Re-check after async call to prevent TypeError if component unmounted
            if (!textLayerRef.current) return;
            
            const div = textLayerRef.current;
            div.innerHTML = '';
            
            div.style.width = `${displayW}px`;
            div.style.height = `${displayH}px`;

            textContent.items.forEach((item: any) => {
              if (!item.str) return;
              const [a, b, , d, tx, ty] = item.transform;
              const fontSize = Math.sqrt(d * d + item.transform[2] * item.transform[2]) * fitScale;
              const span = document.createElement('span');
              span.textContent = item.str;

              const isMatch = searchQuery && searchQuery.trim().length > 1 && 
                             item.str.toLowerCase().includes(searchQuery.toLowerCase());

              span.style.cssText = `
                position: absolute;
                left: ${tx * fitScale}px;
                top: ${displayH - ty * fitScale - fontSize}px;
                font-size: ${fontSize}px;
                font-family: sans-serif;
                white-space: pre;
                color: transparent;
                transform-origin: 0% 0%;
                line-height: 1;
                ${isMatch ? 'background-color: rgba(255, 255, 0, 0.4); border-radius: 2px;' : ''}
              `;
              const angle = Math.atan2(b, a);
              if (Math.abs(angle) > 0.001) span.style.transform = `rotate(${angle}rad)`;
              if (item.width) span.style.width = `${item.width * fitScale}px`;
              div.appendChild(span);
            });
          }

          setRendered(true);
        } catch (e) {
          console.error('Text layer init error:', e);
        }
      };

      setupLayer();
    }, [pdfDocument, number, rendered, pageW, pageH, searchQuery]);

    // Calculate fit for text layer positioning
    const natural_w = pageW; // used as fallback
    const offsetX = canvasRef.current ? parseInt(canvasRef.current.style.left || '0') : 0;
    const offsetY = canvasRef.current ? parseInt(canvasRef.current.style.top || '0') : 0;

    return (
      <div
        ref={ref}
        className="page-realistic"
        style={{
          width: pageW,
          height: pageH,
          background: '#fff',
          boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Priority Rendering: Use pre-rendered image if available (buttery smooth flips) */}
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`Page ${number}`}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
              // Subtle sharpening for JPEG
              imageRendering: 'auto'
            }}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="flipbook-page-canvas"
            style={{
              position: 'absolute',
            }}
          />
        )}
        <div
          ref={textLayerRef}
          className="pdf-text-layer"
          style={{
            position: 'absolute',
            left: offsetX,
            top: offsetY,
            transformOrigin: '0 0',
            overflow: 'hidden',
          }}
        />
      </div>
    );
  })
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
        const viewport = page.getViewport({ scale: 1.0 });
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
      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${isActive
        ? 'border-lime-500 shadow-md shadow-lime-500/20 scale-[1.02]'
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
  pdfDocument, onFlip, onBookInit,
  zoomLevel = 100, onZoomIn, onZoomOut,
  isAutoPlaying = false, onToggleAutoPlay,
  isFullscreen = false, onToggleFullscreen,
  showThumbnails = false, onToggleThumbnails,
  showSearch = false, onToggleSearch,
  fullscreenContainerRef,
  orientation = 'portrait'
}) => {
  const defaultAspectRatio = orientation === 'landscape' ? LANDSCAPE_W / LANDSCAPE_H : PORTRAIT_W / PORTRAIT_H;
  const [pdfAspectRatio, setPdfAspectRatio] = useState<number>(defaultAspectRatio);
  const [isSinglePage, setIsSinglePage] = useState<boolean>(false);

  // Dynamically calculate page dimensions to perfectly match the PDF aspect ratio.
  // We use a high base resolution because CSS 3D transforms rasterize DOM layers
  // based on their intrinsic dimensions. 
  const baseSize = 1600;
  const pageW = pdfAspectRatio > 1 ? baseSize : baseSize * pdfAspectRatio;
  const pageH = pdfAspectRatio > 1 ? baseSize / pdfAspectRatio : baseSize;


  const [pages, setPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [baseScale, setBaseScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(''); // Start empty to prevent flicker
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  // Pre-rendering engine state
  const [pageImages, setPageImages] = useState<Map<number, string>>(new Map());
  const [parsingProgress, setParsingProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);

  const [pageTexts, setPageTexts] = useState<Map<number, string>>(new Map());
  const [isExtractingText, setIsExtractingText] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const scaleRef = useRef(1);

  const scale = (zoomLevel / 100);
  scaleRef.current = scale;

  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Sync zoomLevel prop with TransformWrapper scale
  useEffect(() => {
    if (transformRef.current) {
      const targetScale = (zoomLevel ?? 100) / 100;
      const { setTransform, instance } = transformRef.current;
      const { positionX, positionY } = instance.transformState;
      setTransform(positionX, positionY, targetScale, 200, "easeOut");
    }
  }, [zoomLevel]);

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

  // When search opens, focus the search input
  useEffect(() => {
    if (showSearch) {
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
        <mark key={keyIdx++} className="bg-lime-500/30 text-lime-300 rounded px-0.5">
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



  // Calculate base scale to fit screen
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null;
    let observer: ResizeObserver | null = null;

    const updateScale = () => {
      const bookContainer = containerRef.current?.querySelector('.book-area-container');
      if (!bookContainer) return;

      const isMobileOrTablet = window.innerWidth < 1024;
      const singlePage = pdfAspectRatio > 1.2 || window.innerWidth < 768;

      // Smaller padding on mobile/tablet for maximum book area
      const padX = isMobileOrTablet ? 8 : 40;
      const padY = isMobileOrTablet ? 8 : 40;
      const w = Math.max(0, bookContainer.clientWidth - padX);
      const h = Math.max(0, bookContainer.clientHeight - padY);

      const spreadW = singlePage ? pageW : pageW * 2;
      const scaleX = w / spreadW;
      const scaleY = h / pageH;

      const newScale = Math.min(scaleX, scaleY);

      setIsSinglePage(singlePage);
      setBaseScale(newScale);

      // Force HTMLFlipBook to recalculate its internal canvas offset after scale applied
      setTimeout(() => {
        bookRef.current?.pageFlip()?.update();
      }, 50);
    };

    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateScale, 50);
    };

    const bookArea = containerRef.current?.querySelector('.book-area-container');
    if (bookArea) {
      observer = new ResizeObserver(() => {
        handleResize();
      });
      observer.observe(bookArea);
    }

    // Fallbacks
    window.addEventListener('resize', handleResize);

    // Initial calls carefully staggered so DOM and React settle
    updateScale();
    setTimeout(updateScale, 100);
    setTimeout(updateScale, 500); // Failsafe for slow layout repaints

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [pageW, pageH, pdfAspectRatio]);

  // High-Resolution Image Pre-rendering Engine
  useEffect(() => {
    if (!pdfDocument || pages.length === 0 || isParsing || pageImages.size === pages.length) return;

    const renderImages = async () => {
      setIsParsing(true);
      const total = pages.length;

      // QUALITY_SCALE — carefully capped on mobile/tablet to prevent GPU memory crashes
      const isMobileDevice = window.innerWidth < 1024;
      const dpr = window.devicePixelRatio || 1;
      // With PNG (lossless), we don't need as high a scale — 2x DPR is sharp enough
      const QUALITY_SCALE = isMobileDevice
        ? Math.min(dpr * 2.0, 3.0)   // Mobile/tablet: crisp with PNG, no compression loss
        : Math.min(dpr * 2.0, 3.0);  // Desktop: 2x DPR capped at 3.0x (PNG has zero quality loss)

      for (let i = 0; i < total; i++) {
        const pageNum = pages[i];
        try {
          if (pageImages.has(pageNum)) continue;

          const page = await pdfDocument.getPage(pageNum);
          const viewport = page.getViewport({ scale: QUALITY_SCALE });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const ctx = canvas.getContext('2d', { alpha: true })!;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // CRITICAL: Force high smoothing quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          await page.render({ canvasContext: ctx, viewport }).promise;

           // Use JPEG for performance — significantly reduces memory and string size
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          setPageImages(prev => {
            const next = new Map(prev);
            next.set(pageNum, dataUrl);
            return next;
          });
          
          setParsingProgress(Math.round(((i + 1) / total) * 100));
          
          // Small yield to keep UI responsive
          await new Promise(r => setTimeout(r, 20));

          // Cleanup canvas to help GC
          canvas.width = 0;
          canvas.height = 0;
        } catch (e) {
          console.error(`❌ Render Error Page ${pageNum}:`, e);
        }
      }

      setIsParsing(false);
    };

    renderImages();
  }, [pdfDocument, pages, isParsing, pageImages.size]);

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

        try {
          // Get the exact aspect ratio from the first page of the PDF
          const page1 = await pdfDocument.getPage(1);
          const vp = page1.getViewport({ scale: 1 });
          setPdfAspectRatio(vp.width / vp.height);
        } catch (e) {
          console.warn('Could not determine aspect ratio', e);
        }

        const nums = Array.from({ length: pdfDocument.numPages }, (_, i) => i + 1);
        setPages(nums);

        // Optimization starts in background, don't show a second full-screen loader
        setLoading(false);
        console.log(`BookViewer ready (Optimization phase start): ${pdfDocument.numPages} pages`);
        setTimeout(() => {
          bookRef.current?.pageFlip()?.update();
        }, 100);
      } catch (err: any) {
        console.error('BookViewer init error:', err);
        setError(err.message || 'Failed to load book');
        setLoading(false);
      }
    };

    initBook();
  }, [pdfDocument]);

  // Auto-play mode — controlled by parent prop
  useEffect(() => {
    if (isAutoPlaying && !loading && pages.length > 0) {
      autoPlayRef.current = setInterval(() => {
        const pageFlip = bookRef.current?.pageFlip();
        if (pageFlip) {
          const current = pageFlip.getCurrentPageIndex();
          const total = pageFlip.getPageCount();
          if (current < total - 1) pageFlip.flipNext();
          else pageFlip.turnToPage(0);
        }
      }, 3500);
    }
    return () => {
      if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
    };
  }, [isAutoPlaying, loading, pages.length]);

  const handleFlip = useCallback((e: any) => {
    // Handle both HTMLFlipBook events (obj with data) and TrifoldViewer raw indices
    const pageIdx = (e && typeof e === 'object' && 'data' in e) ? e.data : e;

    if (typeof pageIdx === 'number' && !isNaN(pageIdx)) {
      setCurrentPage(pageIdx);
      onFlip(pageIdx);
    }
  }, [onFlip]);

  const handleBookInit = useCallback((el: any) => {
    if (!el) return;
    bookRef.current = el;
    onBookInit(el);
  }, [onBookInit]);

  const handleChangeState = useCallback((e: any) => {
    if (e.data === 'flipping') {
      playFlipSound();
    }
  }, []);

  const flipPrev = useCallback(() => {
    const pageFlip = bookRef.current?.pageFlip();
    if (pageFlip) pageFlip.flipPrev();
  }, []);

  const flipNext = useCallback(() => {
    const pageFlip = bookRef.current?.pageFlip();
    if (pageFlip) pageFlip.flipNext();
  }, []);

  const goToPage = useCallback((pageNum: number) => {
    const pageFlip = bookRef.current?.pageFlip();
    if (pageFlip) pageFlip.turnToPage(pageNum - 1);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const isTrifold = orientation === 'trifold';

      if (key === 'ArrowLeft' || key === 'Left') {
        // HTMLFlipBook handles arrow keys natively. 
        // Manually triggering flipPrev for arrows in normal book mode causes double-flips (skips 4 pages).
        if (isTrifold) {
          e.preventDefault();
          flipPrev();
        }
      } else if (key === 'ArrowRight' || key === 'Right' || key === ' ') {
        if (key === ' ') e.preventDefault(); // Prevent page scrolling down

        if (isTrifold || key === ' ') {
          flipNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipPrev, flipNext, orientation]);

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

  const totalPages = orientation === 'trifold' ? 5 : pages.length;

  return (
    <div
      ref={containerRef}
      className="df-container w-full h-full flex flex-col relative"
      style={{
        background: 'transparent',
        touchAction: 'manipulation'
      }}
      onWheel={(e) => { if (e.ctrlKey) e.preventDefault(); }}
    >
      {/* Main Book Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden book-area-container">
         <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={1} // Prevent zooming out smaller than the default fit!
          maxScale={6}
          centerOnInit={true}
          doubleClick={{ disabled: false, step: 2.5, mode: "toggle" }} // The main requested feature: double tap to toggle zoom
          pinch={{ disabled: false, step: 5 }}       // Mobile pinch to zoom
          wheel={{ step: 0.1, wheelDisabled: false }} // PC wheel to zoom
          panning={{
            disabled: false,
          }}
        >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
              contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div 
                className="w-full h-full flex items-center justify-center relative touch-none"
              >
                <div style={{ pointerEvents: 'auto' }}>
                  {orientation === 'trifold' ? (
                    <div
                      className="relative"
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      {isParsing && parsingProgress < 100 && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[100] bg-[#141418]/80 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="relative w-4 h-4">
                            <Loader2 className="animate-spin text-lime-500 absolute inset-0" size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-lime-500/80 leading-none tracking-widest mb-0.5">Enhancing</span>
                            <span className="text-[11px] font-bold text-white/90 whitespace-nowrap leading-none">
                              {parsingProgress}% Optimized
                            </span>
                          </div>
                        </div>
                      )}
                      <TrifoldViewer
                        pdfDocument={pdfDocument}
                        onFlip={handleFlip}
                        onBookInit={handleBookInit}
                        pageImages={pageImages}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: (isSinglePage ? pageW : pageW * 2) * baseScale,
                        height: pageH * baseScale,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        className="book-3d-container relative"
                        style={{
                          width: isSinglePage ? pageW : pageW * 2,
                          height: pageH,
                          transform: `scale(${baseScale})`, // Static fit-to-screen scale
                          transformOrigin: 'center center',
                        }}
                      >
                        <HTMLFlipBook
                          key={`${pageW}-${pageH}-${isSinglePage}`}
                          width={pageW}
                          height={pageH}
                          size="fixed"
                          minWidth={pageW}
                          maxWidth={pageW}
                          minHeight={pageH}
                          maxHeight={pageH}
                          showCover={!isSinglePage}
                          maxShadowOpacity={0.25}
                          mobileScrollSupport={true}
                          onFlip={handleFlip}
                          onChangeState={handleChangeState}
                          onInit={() => {
                            setTimeout(() => bookRef.current?.pageFlip()?.update(), 150);
                          }}
                          ref={handleBookInit}
                          className="book-3d-flip"
                          style={{ 
                            boxShadow: '0 15px 60px rgba(0,0,0,0.3)',
                            backgroundColor: '#fff'
                          }}
                          startPage={0}
                          flippingTime={600}
                          usePortrait={isSinglePage}
                          drawShadow={true}
                          startZIndex={0}
                          autoSize={false}
                          clickEventForward={false}
                          useMouseEvents={false}
                          swipeDistance={30}
                          showPageCorners={false}
                        >
                        {pages.map((num) => (
                          <Page 
                            key={num} 
                            number={num} 
                            pdfDocument={pdfDocument} 
                            pageW={pageW} 
                            pageH={pageH} 
                            imageUrl={pageImages.get(num)}
                            searchQuery={searchQuery} 
                          />
                        ))}
                      </HTMLFlipBook>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </TransformComponent>
        </TransformWrapper>

        {/* Left Navigation — Must be AFTER TransformWrapper in DOM so it stacks above the absolute overlay */}
        <button
          onClick={flipPrev}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0.5 sm:left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center text-white/40 hover:text-white/90 transition-all z-[60] rounded-full hover:bg-white/[0.08] active:bg-white/[0.15]"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
        </button>

        {/* Right Navigation */}
        <button
          onClick={flipNext}
          onMouseDown={(e) => e.preventDefault()}
          className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center text-white/40 hover:text-white/90 transition-all z-[60] rounded-full hover:bg-white/[0.08] active:bg-white/[0.15]`}
          style={{
            right: rightPanelOpen ? (window.innerWidth < 640 ? 4 : window.innerWidth < 1024 ? 260 : 290) : (window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 8 : 24),
            transition: 'right 0.3s ease'
          }}
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
        </button>

        {/* Thumbnails Panel - Right Side */}
        <div
          className="absolute top-0 right-0 h-full z-30 flex flex-col bg-[#111114]/95 backdrop-blur-xl border-l border-white/[0.04] shadow-2xl shadow-black/40"
          style={{
            width: window.innerWidth < 640 ? '100%' : window.innerWidth < 1024 ? 260 : 280,
            transform: showThumbnails ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Mobile Handle */}
          <div className="sm:hidden flex justify-center py-2 border-b border-white/[0.03] shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/10" />
          </div>

          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-[#0c0c0e]">
            <div className="flex items-center gap-2">
              <Grid3X3 size={16} className="text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-200">Thumbnails</h3>
            </div>
            <button
              onClick={onToggleThumbnails}
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
            width: window.innerWidth < 640 ? '100%' : window.innerWidth < 1024 ? 280 : 320,
            transform: showSearch ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Mobile Handle */}
          <div className="sm:hidden flex justify-center py-2 border-b border-white/[0.03] shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/10" />
          </div>

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
                className="w-full pl-3 pr-8 py-2 text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/30 focus:border-lime-500/30 bg-white/[0.04] text-white placeholder-zinc-600"
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
                className="w-3.5 h-3.5 rounded border-zinc-600 bg-white/[0.04] text-lime-500 focus:ring-lime-500/30"
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
                    if (isSinglePage) {
                      pageLabel = `p. ${pageNum}`;
                    } else {
                      if (pageNum === 1) pageLabel = `p. 1`;
                      else if (pageNum % 2 === 0) pageLabel = `p. ${pageNum} - ${Math.min(pageNum + 1, totalPages)}`;
                      else pageLabel = `p. ${pageNum - 1} - ${pageNum}`;
                    }

                    return (
                      <button
                        key={result.page}
                        onClick={() => goToPage(result.page)}
                        className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-lime-500/20 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-zinc-400 group-hover:text-lime-400">{pageLabel}</span>
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



    </div>
  );
};

export default BookViewer;
