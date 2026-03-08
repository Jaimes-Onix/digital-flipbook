import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface TrifoldViewerProps {
    pdfDocument: any;
    onFlip: (pageIndex: number) => void;
    onBookInit: (book: any) => void;
}

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------
type FoldState = 'closed' | 'opened_front_flap' | 'fully_opened' | 'back_cover_closed' | 'back_cover_opened';

// PDF trifold format types
type TrifoldFormat =
    | 'single_spread'    // 1 wide page: all 3 outside panels
    | 'two_spread'       // 2 wide pages: outside + inside (landscape trifold)
    | 'six_individual';  // 6 pages: one per panel

// -----------------------------------------------------------------------------
// Component: Single Panel Renderer
// -----------------------------------------------------------------------------
interface PanelProps {
    pdfDocument: any;
    pageNumber: number; // 1-indexed
    width: number;
    height: number;
    clipThirds: boolean; // whether to clip this page into thirds
    clipIndex: number;   // 0=left, 1=mid, 2=right (only matters when clipThirds=true)
    lazy?: boolean;      // If true, delay rendering slightly
    className?: string;
    style?: React.CSSProperties;
}

const PDFPanel: React.FC<PanelProps> = ({
    pdfDocument, pageNumber, width, height, clipThirds, clipIndex, lazy, className = '', style = {}
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        if (!pdfDocument || !canvasRef.current) return;
        if (pageNumber < 1 || pageNumber > pdfDocument.numPages) return;
        if (width <= 0 || height <= 0) return;

        let active = true;
        let renderTask: any = null;

        const render = async () => {
            if (lazy && active) {
                // Background panels wait a bit to give priority to the front cover
                await new Promise(r => setTimeout(r, 150));
            }
            if (!active) return;

            try {
                const page = await pdfDocument.getPage(pageNumber);
                if (!active) return;

                // Adaptive Scaling: calculate exactly what we need for the current width/height
                // We add a tiny buffer (1.5x) for sharpness without excessive memory
                const viewport1 = page.getViewport({ scale: 1 });
                const baseWidth = clipThirds ? (viewport1.width / 3) : viewport1.width;
                const fitScale = Math.max(width / baseWidth, height / viewport1.height) * 1.5;

                const viewport = page.getViewport({ scale: fitScale });

                const canvas = canvasRef.current!;
                const ctx = canvas.getContext('2d', { alpha: false })!;

                if (clipThirds) {
                    const panelW = viewport.width / 3;
                    canvas.width = Math.floor(panelW);
                    canvas.height = Math.floor(viewport.height);

                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.save();
                    ctx.translate(-panelW * clipIndex, 0);
                    renderTask = page.render({ canvasContext: ctx, viewport });
                    await renderTask.promise;
                    ctx.restore();
                } else {
                    canvas.width = Math.floor(viewport.width);
                    canvas.height = Math.floor(viewport.height);
                    renderTask = page.render({ canvasContext: ctx, viewport });
                    await renderTask.promise;
                }

                if (active) setRendered(true);
            } catch (e: any) {
                if (e.name === 'RenderingCancelledException') return;
                console.error('Trifold Panel render error:', e);
            }
        };

        setRendered(false);
        render();

        return () => {
            active = false;
            if (renderTask) renderTask.cancel();
        };
    }, [pdfDocument, pageNumber, width, height, clipThirds, clipIndex, lazy]);

    return (
        <div
            className={`bg-white shadow-inner flex items-center justify-center overflow-hidden absolute inset-0 ${className}`}
            style={{
                ...style,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
            }}
        >
            {!rendered && pageNumber >= 1 && pageNumber <= pdfDocument.numPages && (
                <Loader2 className="animate-spin text-gray-300" size={24} />
            )}
            {(pageNumber < 1 || pageNumber > pdfDocument.numPages) && (
                <div className="w-full h-full bg-white flex items-center justify-center">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-200 rounded animate-pulse" />
                </div>
            )}
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: rendered ? 'block' : 'none',
                }}
            />
            {/* Decorative inner fold shadow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.03)'
            }} />
        </div>
    );
};


// -----------------------------------------------------------------------------
// Component: Trifold Viewer Main
// -----------------------------------------------------------------------------
const TrifoldViewer: React.FC<TrifoldViewerProps> = ({
    pdfDocument, onFlip, onBookInit
}) => {
    const [foldState, setFoldState] = useState<FoldState>('closed');
    const [isAnimating, setIsAnimating] = useState(false);
    const [format, setFormat] = useState<TrifoldFormat>('two_spread');

    // Per-page spread detection for accurate initial view
    const [pageOrientations, setPageOrientations] = useState<Record<number, boolean>>({});

    // Responsive sizing
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [panelSize, setPanelSize] = useState({ width: 0, height: 0 }); // Start at 0 to delay render

    const { width: panelWidth, height: panelHeight } = panelSize;

    // Determine PDF format and ideal panel size based on the first page
    useEffect(() => {
        if (!pdfDocument) return;
        const initSize = async () => {
            try {
                const numPages = pdfDocument.numPages;

                // Inspect first few pages for orientation using viewport (handles rotation)
                const orientations: Record<number, boolean> = {};
                const checkCount = Math.min(numPages, 3);
                for (let i = 1; i <= checkCount; i++) {
                    const p = await pdfDocument.getPage(i);
                    const vp = p.getViewport({ scale: 1 });
                    orientations[i] = vp.width > vp.height * 1.2; // Wide enough to be a spread
                }
                setPageOrientations(orientations);

                const page = await pdfDocument.getPage(1);
                const vp = page.getViewport({ scale: 1 });
                const isWide = orientations[1];

                let detectedFormat: TrifoldFormat;
                if (numPages >= 4) {
                    // 4+ pages: Treat as individual panels to avoid slicing covers in half
                    detectedFormat = 'six_individual';
                } else if (isWide) {
                    detectedFormat = numPages === 1 ? 'single_spread' : 'two_spread';
                } else {
                    // Portrait pages: treat as individual panels
                    detectedFormat = 'six_individual';
                }

                setFormat(detectedFormat);

                // Determine base panel dimensions to fill height
                // Only divide by 3 if we are explicitly using a wide spread format (1-2 page PDFs)
                const pW = (isWide && detectedFormat !== 'six_individual') ? vp.width / 3 : vp.width;
                const pH = vp.height;
                const displayRatio = pH / pW;

                // Aim for a generous base height that fills most of the screen
                const baseH = 850;
                setPanelSize({
                    height: baseH,
                    width: baseH / displayRatio
                });

                console.log(`[TrifoldViewer] Format: ${detectedFormat}, Spread: ${isWide}, Pages: ${numPages}`);
            } catch (e) {
                console.error('[TrifoldViewer] Init error:', e);
            }
        };
        initSize();
    }, [pdfDocument]);

    // Handle responsive scaling
    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth - 20;
            const h = containerRef.current.clientHeight - 20;

            const totalSpreadWidth = panelWidth * 3.2; // Perspective margin
            const scaleX = w / totalSpreadWidth;
            const scaleY = h / panelHeight;

            // Prioritize filling the screen
            const newScale = Math.min(scaleX, scaleY, 2.5);
            setScale(Math.max(newScale, 0.4));
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [panelWidth, panelHeight]);

    // Navigation Logic
    const nextState = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setFoldState(current => {
            if (current === 'closed') return 'opened_front_flap';
            if (current === 'opened_front_flap') return 'fully_opened';
            if (current === 'fully_opened') return 'back_cover_closed';
            if (current === 'back_cover_closed') return 'back_cover_opened';
            return current;
        });
        setTimeout(() => setIsAnimating(false), 800);
    }, [isAnimating]);

    const prevState = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setFoldState(current => {
            if (current === 'back_cover_opened') return 'back_cover_closed';
            if (current === 'back_cover_closed') return 'fully_opened';
            if (current === 'fully_opened') return 'opened_front_flap';
            if (current === 'opened_front_flap') return 'closed';
            return current;
        });
        setTimeout(() => setIsAnimating(false), 800);
    }, [isAnimating]);

    // Refs to store latest state-dependent functions
    const nextStateRef = useRef(nextState);
    const prevStateRef = useRef(prevState);
    const foldStateRef = useRef(foldState);

    useEffect(() => {
        nextStateRef.current = nextState;
        prevStateRef.current = prevState;
        foldStateRef.current = foldState;
    }, [nextState, prevState, foldState]);

    // Mock BookRef API - Only call onBookInit once with stable proxy functions
    useEffect(() => {
        const stableBookRef = {
            pageFlip: () => ({
                flipNext: () => nextStateRef.current(),
                flipPrev: () => prevStateRef.current(),
                turnToPage: (page: number) => {
                    if (page === 0) setFoldState('closed');
                    else if (page === 1) setFoldState('opened_front_flap');
                    else if (page === 2) setFoldState('fully_opened');
                    else if (page === 3) setFoldState('back_cover_closed');
                    else if (page >= 4) setFoldState('back_cover_opened');
                },
                getCurrentPageIndex: () => {
                    const current = foldStateRef.current;
                    if (current === 'closed') return 0;
                    if (current === 'opened_front_flap') return 1;
                    if (current === 'fully_opened') return 2;
                    if (current === 'back_cover_closed') return 3;
                    return 4;
                },
                getPageCount: () => 5
            })
        };
        onBookInit(stableBookRef);
    }, [onBookInit]); // Only depends on stabilization call

    useEffect(() => {
        let pageIdx = 0;
        if (foldState === 'closed') pageIdx = 0;
        else if (foldState === 'opened_front_flap') pageIdx = 1;
        else if (foldState === 'fully_opened') pageIdx = 2;
        else if (foldState === 'back_cover_closed') pageIdx = 3;
        else if (foldState === 'back_cover_opened') pageIdx = 4;
        onFlip(pageIdx);
    }, [foldState, onFlip]);


    // =========================================================================
    // Panel Mapping
    // =========================================================================
    const getLayerConfig = () => {
        const p1Spread = !!pageOrientations[1];
        const p2Spread = !!pageOrientations[2];

        switch (format) {
            case 'single_spread':
                // For a 1-page trifold spread:
                // Outside: Left=Flap(0), Mid=Back(1), Right=Front(2)
                // Inside: Left=L(0), Mid=C(1), Right=R(2)
                return {
                    frontCover: { page: 1, clipThirds: p1Spread, clipIndex: 2 },
                    backCover: { page: 1, clipThirds: p1Spread, clipIndex: 1 },
                    backFlap: { page: 1, clipThirds: p1Spread, clipIndex: 0 },
                    insideLeft: { page: 1, clipThirds: p1Spread, clipIndex: 0 },
                    insideCenter: { page: 1, clipThirds: p1Spread, clipIndex: 1 },
                    insideRight: { page: 1, clipThirds: p1Spread, clipIndex: 2 },
                };

            case 'two_spread':
                // Page 1 = Outside (Back side of the paper)
                // Page 2 = Inside (Front side of the paper)
                return {
                    frontCover: { page: 1, clipThirds: p1Spread, clipIndex: 2 },
                    backCover: { page: 1, clipThirds: p1Spread, clipIndex: 1 },
                    backFlap: { page: 1, clipThirds: p1Spread, clipIndex: 0 },
                    insideLeft: { page: 2, clipThirds: p2Spread, clipIndex: 0 },
                    insideCenter: { page: 2, clipThirds: p2Spread, clipIndex: 1 },
                    insideRight: { page: 2, clipThirds: p2Spread, clipIndex: 2 },
                };

            default: // six_individual (portrait pages)
                return {
                    frontCover: { page: 1, clipThirds: false, clipIndex: 0 },
                    insideLeft: { page: 2, clipThirds: false, clipIndex: 0 },
                    insideCenter: { page: 3, clipThirds: false, clipIndex: 0 },
                    insideRight: { page: 0, clipThirds: false, clipIndex: 0 }, // Empty
                    backFlap: { page: 0, clipThirds: false, clipIndex: 0 },    // Empty
                    backCover: { page: 4, clipThirds: false, clipIndex: 0 },   // Back of book
                };
        }
    };

    const layers = getLayerConfig();

    // Rotations (Left opens first)
    let rotLeft = 0, rotRight = 0, rotEntire = 0;
    switch (foldState) {
        case 'closed': rotLeft = 179; rotRight = -179; rotEntire = 0; break;
        case 'opened_front_flap': rotLeft = 0; rotRight = -179; rotEntire = 0; break;
        case 'fully_opened': rotLeft = 0; rotRight = 0; rotEntire = 0; break;
        case 'back_cover_closed': rotLeft = 179; rotRight = -179; rotEntire = 180; break;
        case 'back_cover_opened': rotLeft = 0; rotRight = 0; rotEntire = 180; break;
    }

    let centerTranslateX = (foldState === 'opened_front_flap') ? panelWidth : 0;

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center relative touch-none" onClick={nextState}>
            <div className="relative flex items-center justify-center pointer-events-none" style={{
                perspective: '3000px', transform: `scale(${scale})`, transition: 'transform 0.4s ease-out'
            }}>
                <div className="relative flex" style={{
                    transformStyle: 'preserve-3d', transform: `translateX(${centerTranslateX}px) rotateY(${rotEntire}deg)`,
                    transition: 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)', width: panelWidth, height: panelHeight
                }}>

                    {/* CENTER */}
                    <div className="absolute top-0 left-0 w-full h-full" style={{ transformStyle: 'preserve-3d', zIndex: 10 }}>
                        <PDFPanel pageNumber={layers.insideCenter.page} clipThirds={layers.insideCenter.clipThirds} clipIndex={layers.insideCenter.clipIndex} pdfDocument={pdfDocument} width={panelWidth} height={panelHeight} lazy={true} />
                        <PDFPanel pageNumber={layers.backCover.page} clipThirds={layers.backCover.clipThirds} clipIndex={layers.backCover.clipIndex} pdfDocument={pdfDocument} width={panelWidth} height={panelHeight} lazy={true} style={{ transform: 'rotateY(180deg)' }} />
                    </div>

                    {/* LEFT (Front Cover) */}
                    <div className="absolute top-0 right-full w-full h-full" style={{
                        transformStyle: 'preserve-3d', transformOrigin: 'right center',
                        transform: `rotateY(${rotLeft}deg) ${foldState === 'closed' || foldState === 'back_cover_closed' ? 'translateZ(-1px)' : ''}`,
                        transition: 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)', zIndex: foldState === 'closed' || foldState === 'back_cover_closed' ? 100 : 15
                    }}>
                        <PDFPanel pageNumber={layers.insideLeft.page} clipThirds={layers.insideLeft.clipThirds} clipIndex={layers.insideLeft.clipIndex} pdfDocument={pdfDocument} width={panelWidth} height={panelHeight} lazy={true} />
                        <PDFPanel pageNumber={layers.frontCover.page} clipThirds={layers.frontCover.clipThirds} clipIndex={layers.frontCover.clipIndex} pdfDocument={pdfDocument} width={panelWidth} height={panelHeight} lazy={false} style={{ transform: 'rotateY(180deg)' }} />
                    </div>

                    {/* RIGHT (Inside Flap) */}
                    <div className="absolute top-0 left-full w-full h-full" style={{
                        transformStyle: 'preserve-3d', transformOrigin: 'left center',
                        transform: `rotateY(${rotRight}deg)`,
                        transition: 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
                        zIndex: foldState === 'closed' ? 0 : 20,
                        opacity: foldState === 'closed' ? 0 : 1,
                        display: foldState === 'closed' ? 'none' : 'block'
                    }}>
                        <PDFPanel pageNumber={layers.insideRight.page} clipThirds={layers.insideRight.clipThirds} clipIndex={layers.insideRight.clipIndex} pdfDocument={pdfDocument} width={panelWidth} height={panelHeight} lazy={true} />
                        <PDFPanel pageNumber={layers.backFlap.page} clipThirds={layers.backFlap.clipThirds} clipIndex={layers.backFlap.clipIndex} pdfDocument={pdfDocument} width={panelWidth} height={panelHeight} lazy={true} style={{ transform: 'rotateY(180deg)' }} />
                    </div>
                </div>

                {/* Floor Shadow */}
                <div className="absolute w-[150%] h-12 bg-black/20 blur-2xl top-[105%] left-1/2 -translate-x-1/2 rounded-full transition-all duration-800"
                    style={{ transform: `translateX(-50%) scaleX(${foldState === 'fully_opened' ? 1 : 0.4})` }} />
            </div>

        </div>
    );
};

export default TrifoldViewer;
