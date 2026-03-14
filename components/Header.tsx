import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Library as LibraryIcon, Menu, LayoutGrid, Layers, X, Share2, Presentation, UploadCloud,
  Grid3X3, Search, Play, Pause, ZoomIn, ZoomOut, Maximize, Minimize,
} from 'lucide-react';
import ShareLinkModal from './ShareLinkModal';

interface HeaderProps {
  view: 'home' | 'library' | 'reader' | 'upload' | 'convert-pptx' | 'shared' | 'signin';
  darkMode: boolean;
  homeVariant?: 1 | 2;
  onToggleHomeVariant?: () => void;
  onToggleSidebar?: () => void;
  fileName?: string;
  onCloseReader?: () => void;
  readerBookName?: string;
  readerBookId?: string;
  readerPageInfo?: string;
  // Reader toolbar
  readerZoom?: number;
  onReaderZoomIn?: () => void;
  onReaderZoomOut?: () => void;
  readerAutoPlay?: boolean;
  onToggleReaderAutoPlay?: () => void;
  readerFullscreen?: boolean;
  onToggleReaderFullscreen?: () => void;
  readerShowThumbnails?: boolean;
  onToggleReaderThumbnails?: () => void;
  readerShowSearch?: boolean;
  onToggleReaderSearch?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  view, darkMode, homeVariant = 1, onToggleHomeVariant, onToggleSidebar, fileName,
  onCloseReader, readerBookName, readerBookId, readerPageInfo,
  readerZoom = 100, onReaderZoomIn, onReaderZoomOut,
  readerAutoPlay, onToggleReaderAutoPlay,
  readerFullscreen, onToggleReaderFullscreen,
  readerShowThumbnails, onToggleReaderThumbnails,
  readerShowSearch, onToggleReaderSearch,
}) => {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);

  // ── Reader mode ──────────────────────────────────────────────────────────
  if (view === 'reader') {
    const bg = darkMode ? 'bg-[#0a0a0a]/50 backdrop-blur-2xl border-white/[0.08]' : 'bg-white/60 backdrop-blur-2xl border-black/[0.05]';
    const closeBtn = darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/[0.12]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50';
    const title = darkMode ? 'text-white' : 'text-gray-900';
    const pageInfoColor = darkMode ? 'text-zinc-500' : 'text-black';
    const divider = <div className={`w-px h-5 mx-0.5 shrink-0 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />;

    const btn = (active?: boolean) =>
      `flex items-center justify-center w-8 h-8 rounded-lg transition-all shrink-0 ${active
        ? (darkMode ? 'bg-white/[0.14] text-white border border-white/20' : 'bg-gray-200 text-gray-900')
        : (darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08]' : 'text-black hover:text-gray-900 hover:bg-gray-100')
      }`;

    return (
      <>
        <header className={`fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 border-b transition-colors shadow-sm ${bg}`}>

          {/* Left: close + title */}
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <button onClick={onCloseReader} className={`p-1.5 -ml-1 rounded-full transition-colors shrink-0 ${closeBtn}`} title="Close">
              <X size={18} />
            </button>
            <span className={`text-sm font-semibold truncate ${title}`}>{readerBookName}</span>
            {readerPageInfo && (
              <span className={`text-xs tracking-wide font-medium shrink-0 hidden md:inline ${pageInfoColor}`}>· {readerPageInfo}</span>
            )}
          </div>

          {/* Right: toolbar */}
          <div className="flex items-center gap-0.5 shrink-0 ml-2">

            {/* Thumbnails */}
            <button onClick={onToggleReaderThumbnails} className={btn(readerShowThumbnails)} title={readerShowThumbnails ? 'Hide Thumbnails' : 'Thumbnails'}>
              <Grid3X3 size={16} />
            </button>

            {/* Search */}
            <button onClick={onToggleReaderSearch} className={btn(readerShowSearch)} title={readerShowSearch ? 'Hide Search' : 'Search'}>
              <Search size={16} />
            </button>

            {/* Auto-flip */}
            <button onClick={onToggleReaderAutoPlay} className={btn(readerAutoPlay)} title={readerAutoPlay ? 'Pause' : 'Auto-flip'}>
              {readerAutoPlay ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {divider}

            {/* Zoom */}
            <button onClick={onReaderZoomOut} className={btn()} title="Zoom Out" disabled={readerZoom <= 50}><ZoomOut size={16} /></button>
            <span className={`text-[11px] font-semibold tabular-nums w-9 text-center shrink-0 ${darkMode ? 'text-zinc-400' : 'text-black'}`}>{readerZoom}%</span>
            <button onClick={onReaderZoomIn} className={btn()} title="Zoom In" disabled={readerZoom >= 150}><ZoomIn size={16} /></button>

            {divider}

            {/* Fullscreen */}
            <button onClick={onToggleReaderFullscreen} className={btn(readerFullscreen)} title={readerFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              {readerFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>

            {/* Share */}
            {readerBookId && (
              <>
                {divider}
                <button
                  onClick={() => setShowShareModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all shrink-0 ${darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08]' : 'text-black hover:text-gray-900 hover:bg-gray-100'}`}
                  title="Share"
                >
                  <Share2 size={14} /><span className="hidden sm:inline">Share</span>
                </button>
              </>
            )}
          </div>
        </header>

        {readerBookId && (
          <ShareLinkModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            linkType="book"
            target={readerBookId}
            title="Share Book"
            description={`Anyone with this link can view and read "${readerBookName || 'this book'}".`}
            darkMode={darkMode}
          />
        )}
      </>
    );
  }

  // ── Normal header ─────────────────────────────────────────────────────────
  const headerBg = darkMode ? 'bg-[#0a0a0a]/50 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-2xl';
  const headerBorder = darkMode ? 'border-white/[0.08] shadow-black/20' : 'border-black/[0.05] shadow-gray-200/50';
  const menuBtnColor = darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08]' : 'text-black hover:text-gray-900 hover:bg-gray-200/50';
  const navInactive = darkMode ? 'text-zinc-400 hover:text-lime-400 hover:bg-lime-500/[0.08]' : 'text-black hover:text-emerald-600 hover:bg-emerald-50';
  const navActive = darkMode ? 'bg-lime-500/[0.12] text-lime-400 shadow-sm border border-lime-500/20' : 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200/60';
  const toggleBg = darkMode ? 'bg-black/40 border-white/[0.08]' : 'bg-gray-100/50 border-black/[0.04] p-0.5';
  const toggleActive = darkMode ? 'bg-white/15 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm border border-black/[0.04]';
  const toggleInactive = darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-black hover:text-gray-600';

  return (
    <header className={`fixed top-0 left-0 lg:left-[300px] right-0 h-14 flex items-center justify-between px-6 z-50 border-b transition-colors shadow-sm ${headerBg} ${headerBorder}`}>
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className={`lg:hidden p-2 -ml-2 rounded-xl transition-colors ${menuBtnColor}`} aria-label="Toggle menu">
            <Menu size={22} strokeWidth={1.8} />
          </button>
        )}
        <div className="flex items-center gap-3 ml-1">
          <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-lime-500/20 to-lime-600/5 border border-lime-500/20' : 'bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-500/15'}`}>
            <svg viewBox="0 0 512 512" fill="currentColor" className={`w-5 h-5 ${darkMode ? 'text-lime-400' : 'text-emerald-500'}`} xmlns="http://www.w3.org/2000/svg">
              <path d="M256 160c.3 0 160-48 160-48v288s-159.7 48-160 48c-.3 0-160-48-160-48V112s159.7 48 160 48z" opacity="0.2" />
              <path d="M256 160v288M416 112v288M96 112v288M256 160c0-.3-80-32-128-48M256 160c0-.3 80-32 128-48"
                stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="flex flex-col whitespace-nowrap">
            <span className={`text-[13.5px] font-bold tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lifewood Philippines</span>
            <span className={`text-[9.5px] uppercase tracking-[0.2em] font-semibold ${darkMode ? 'text-zinc-500' : 'text-black'}`}>Digital Flipbook</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {view !== 'home' && (
          <button onClick={() => navigate('/')} className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${navInactive}`}>Home</button>
        )}
        <button onClick={() => navigate('/library')} className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${view === 'library' ? navActive : navInactive}`}>
          <LibraryIcon size={15} /><span>All Books</span>
        </button>
        <button onClick={() => navigate('/convert-pptx')} className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${view === 'convert-pptx' ? navActive : navInactive}`}>
          <Presentation size={15} /><span>PPTX to PDF</span>
        </button>
        <button onClick={() => navigate('/upload')} className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${view === 'upload' ? navActive : navInactive}`}>
          <UploadCloud size={15} /><span>Import PDF</span>
        </button>

        {view === 'home' && onToggleHomeVariant && (
          <div className={`flex items-center rounded-full p-1 border ${toggleBg}`}>
            <button onClick={homeVariant === 1 ? undefined : onToggleHomeVariant} className={`p-1.5 rounded-full transition-all ${homeVariant === 1 ? toggleActive : toggleInactive}`} title="Card View">
              <LayoutGrid size={14} />
            </button>
            <button onClick={homeVariant === 2 ? undefined : onToggleHomeVariant} className={`p-1.5 rounded-full transition-all ${homeVariant === 2 ? toggleActive : toggleInactive}`} title="Showcase View">
              <Layers size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
