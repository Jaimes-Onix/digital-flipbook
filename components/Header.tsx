import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library as LibraryIcon, Menu, LayoutGrid, Layers, X, Share2 } from 'lucide-react';
import ShareLinkModal from './ShareLinkModal';

interface HeaderProps {
  view: 'home' | 'library' | 'reader' | 'upload';
  darkMode: boolean;
  homeVariant?: 1 | 2;
  onToggleHomeVariant?: () => void;
  onToggleSidebar?: () => void;
  fileName?: string;
  onCloseReader?: () => void;
  readerBookName?: string;
  readerBookId?: string;
  readerPageInfo?: string;
}

const Header: React.FC<HeaderProps> = ({
  view, darkMode, homeVariant = 1, onToggleHomeVariant, onToggleSidebar, fileName,
  onCloseReader, readerBookName, readerBookId, readerPageInfo
}) => {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);

  // Reader mode: adapts to dark/light theme
  if (view === 'reader') {
    const readerHeaderBg = darkMode ? 'bg-black/30 border-white/[0.06]' : 'bg-white/80 border-gray-200';
    const readerCloseBtn = darkMode ? 'text-white hover:bg-white/[0.12]' : 'text-gray-700 hover:bg-gray-200';
    const readerTitle = darkMode ? 'text-white' : 'text-gray-900';
    const readerPageInfoColor = darkMode ? 'text-white/40' : 'text-gray-400';
    const readerNavBtn = darkMode
      ? 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

    return (
      <>
        <header className={`fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-5 z-50 backdrop-blur-xl border-b transition-colors ${readerHeaderBg}`}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onCloseReader} className={`p-1.5 -ml-1 rounded-full transition-colors shrink-0 ${readerCloseBtn}`} title="Close">
              <X size={18} />
            </button>
            <span className={`text-sm font-semibold truncate ${readerTitle}`}>{readerBookName}</span>
            {readerPageInfo && <span className={`text-sm shrink-0 ${readerPageInfoColor}`}>{readerPageInfo}</span>}
          </div>
          <div className="flex items-center gap-2">
            {readerBookId && (
              <button
                onClick={() => setShowShareModal(true)}
                className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${readerNavBtn}`}
                title="Share this book"
              >
                <Share2 size={15} /><span>Share</span>
              </button>
            )}
            <button onClick={() => navigate('/')} className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${readerNavBtn}`}>Home</button>
            <button onClick={() => navigate('/library')} className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${readerNavBtn}`}>
              <LibraryIcon size={15} /><span>My Books</span>
            </button>
          </div>
        </header>

        {readerBookId && (
          <ShareLinkModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            url={`${window.location.origin}/share/book/${readerBookId}`}
            title="Share Book"
            description={`Anyone with this link can view and read "${readerBookName || 'this book'}".`}
            darkMode={darkMode}
          />
        )}
      </>
    );
  }

  // Normal header with dark/light mode support
  const headerBg = darkMode ? 'bg-[#09090b]/70' : 'bg-white/80';
  const headerBorder = darkMode ? 'border-white/[0.04]' : 'border-gray-200';
  const menuBtnColor = darkMode ? 'text-zinc-400 hover:bg-white/[0.05]' : 'text-gray-500 hover:bg-gray-100';
  const navInactive = darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';
  const navActive = darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900';
  const toggleBg = darkMode ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-gray-100 border-gray-200';
  const toggleActive = darkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm';
  const toggleInactive = darkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-gray-400 hover:text-gray-600';

  return (
    <header className={`fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-50 backdrop-blur-xl border-b transition-colors ${headerBg} ${headerBorder}`}>
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className={`lg:hidden p-2 -ml-2 rounded-xl transition-colors ${menuBtnColor}`} aria-label="Toggle menu">
            <Menu size={22} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {view !== 'upload' && (
          <>
            {view !== 'home' && (
              <button onClick={() => navigate('/')} className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${navInactive}`}>Home</button>
            )}
            <button onClick={() => navigate('/library')} className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${view === 'library' ? navActive : navInactive}`}>
              <LibraryIcon size={15} /><span>My Books</span>
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
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
