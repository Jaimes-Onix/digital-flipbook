import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

interface NormalModeViewerProps {
  pdfDocument: any;
  onFlip: (pageIndex: number) => void;
  zoomLevel?: number;
  isFullscreen?: boolean;
  currentStartPage?: number; // 0-indexed, optional controlled page
  onPageChange?: (pageIndex: number) => void;
}


const NormalModeViewer: React.FC<NormalModeViewerProps> = ({
  pdfDocument,
  onFlip,
  zoomLevel = 100,
  currentStartPage = 0,
  onPageChange,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = pdfDocument?.numPages ?? 0;
  const groupSize = isMobile ? 2 : 4;

  // groupStart is the index of the first page in the group (0-indexed, steps of groupSize)
  const [groupStart, setGroupStart] = useState<number>(() => {
    const clamped = Math.max(0, currentStartPage);
    return Math.floor(clamped / groupSize) * groupSize;
  });

  // Re-calculate groupStart when groupSize changes (e.g., rotation/resize)
  useEffect(() => {
    setGroupStart(prev => Math.floor(prev / groupSize) * groupSize);
  }, [groupSize]);

  const [renderedPages, setRenderedPages] = useState<Map<number, string | null>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Sync zoomLevel prop with TransformWrapper scale
  useEffect(() => {
    if (transformRef.current) {
      const scale = (zoomLevel ?? 100) / 100;
      const { setTransform, instance } = transformRef.current;
      const { positionX, positionY } = instance.transformState;
      setTransform(positionX, positionY, scale, 200, "easeOut");
    }
  }, [zoomLevel]);

  // The page numbers (1-indexed) visible in this group
  const pageNums = Array.from({ length: groupSize }, (_, i) => groupStart + i + 1).filter(
    (n) => n >= 1 && n <= totalPages
  );

  // Render pages for current group
  useEffect(() => {
    if (!pdfDocument) return;

    const needed = pageNums.filter((n) => !renderedPages.has(n));
    if (needed.length === 0) return;

    let cancelled = false;
    setLoading(true);

    const render = async () => {
      const updates = new Map<number, string | null>();

      for (const pageNum of needed) {
        if (cancelled) break;
        try {
          const page = await pdfDocument.getPage(pageNum);
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale: dpr * 1.5 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { alpha: false })!;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          updates.set(pageNum, canvas.toDataURL('image/jpeg', 0.85));
          canvas.width = 0;
          canvas.height = 0;
        } catch {
          updates.set(pageNum, null);
        }
      }

      if (!cancelled) {
        setRenderedPages((prev) => {
          const next = new Map(prev);
          updates.forEach((v, k) => next.set(k, v));
          return next;
        });
        setLoading(false);
      }
    };

    render();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupStart, pdfDocument]);

  const canGoPrev = groupStart > 0;
  const canGoNext = groupStart + groupSize < totalPages;

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    const next = Math.max(0, groupStart - groupSize);
    setGroupStart(next);
    onFlip(next);
    onPageChange?.(next);
  }, [canGoPrev, groupStart, onFlip, onPageChange, groupSize]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    const next = groupStart + groupSize;
    setGroupStart(next);
    onFlip(next);
    onPageChange?.(next);
  }, [canGoNext, groupStart, onFlip, onPageChange, groupSize]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext]);

  if (!pdfDocument) return null;

  // Slots based on group size
  const slots: Array<{ label: string; pageNum: number | null }> = Array.from({ length: groupSize }, (_, i) => ({
    label: `page-${i + 1}`,
    pageNum: groupStart + i + 1 <= totalPages ? groupStart + i + 1 : null
  }));

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center relative select-none"
      style={{ background: 'transparent' }}
    >
      {/* Navigation - Previous */}
      <button
        onClick={goPrev}
        disabled={!canGoPrev}
        className="absolute left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-white/40 hover:text-white/90 disabled:opacity-20 disabled:cursor-not-allowed transition-all z-30 rounded-full hover:bg-white/[0.08] active:bg-white/[0.15]"
        title="Previous Group"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={1}
        maxScale={6}
        centerOnInit={true}
        doubleClick={{ disabled: false, step: 2.5, mode: "toggle" }}
        pinch={{ disabled: false, step: 5 }}
        wheel={{ step: 0.1, wheelDisabled: false }}
        panning={{ disabled: false }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="relative touch-none">
            <div
              className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}
              style={{
                // Maximized for mobile: almost full width and more vertical space
                width: isMobile ? 'min(98vw, calc(95vh * 0.75))' : 'min(calc(96vw - 160px), calc(92vh * 1.6))',
                height: isMobile ? 'min(calc(98vw / 0.75), 95vh)' : 'min(calc((96vw - 160px) / 1.6), 92vh)',
                gap: isMobile ? '8px' : '16px',
              }}
            >
              {slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden flex items-center justify-center bg-[#f0f0ee] rounded-sm"
                  style={{
                    border: '1.5px solid #2a2a2a',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                  }}
                >
                  {slot.pageNum !== null ? (
                    renderedPages.has(slot.pageNum) ? (
                      renderedPages.get(slot.pageNum) ? (
                        <img
                          src={renderedPages.get(slot.pageNum)!}
                          alt={`Page ${slot.pageNum}`}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                          <span className="text-xs">Failed to render</span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <Loader2 className="animate-spin text-zinc-400" size={28} />
                      </div>
                    )
                  ) : (
                    // Empty cell (when total pages isn't a multiple of 4)
                    <div className="w-full h-full bg-[#e8e8e6]" />
                  )}

                  {/* Page number badge */}
                  {slot.pageNum !== null && (
                    <div className="absolute bottom-2 right-2 bg-black/40 text-white/70 text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {slot.pageNum}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded">
                <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10">
                  <Loader2 className="animate-spin text-lime-500" size={16} />
                  <span className="text-xs text-white/70 font-medium">Rendering pages...</span>
                </div>
              </div>
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Page range label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30 font-medium tracking-wide pointer-events-none">
        Pages {groupStart + 1}–{Math.min(groupStart + groupSize, totalPages)} of {totalPages}
      </div>

      {/* Navigation - Next */}
      <button
        onClick={goNext}
        disabled={!canGoNext}
        className="absolute right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-white/40 hover:text-white/90 disabled:opacity-20 disabled:cursor-not-allowed transition-all z-30 rounded-full hover:bg-white/[0.08] active:bg-white/[0.15]"
        title="Next Group"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
      </button>
    </div>
  );
};

export default NormalModeViewer;
